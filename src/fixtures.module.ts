import { DynamicModule } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { glob } from 'glob'
import { Schema } from 'mongoose'
import { Fixtures, ReferenceRepository } from './fixtures'
import { registerOutputRoot } from './module-resolver'

type ModuleExports = { [key: string]: any }
type EntityDefinition = { name: string; schema: Schema }

// duck typing as a fallback in case the project resolves another copy of mongoose / of this package
const isSchema = (value: any): value is Schema =>
    value instanceof Schema || (value?.constructor?.name === 'Schema' && typeof value.path === 'function' && typeof value.add === 'function')

const isFixturesClass = (value: any) =>
    typeof value === 'function' &&
    (value.prototype instanceof Fixtures || (typeof value.prototype?.load === 'function' && typeof value.prototype?.getDependencies === 'function'))

function getFixtures(exported: ModuleExports, path: string): any[] {
    const fixtures = Object.values(exported).filter(isFixturesClass)
    if (fixtures.length === 0) {
        throw new Error(`No class extending Fixtures is exported from "${path}"`)
    }
    return fixtures
}

// pairs every exported schema with its class, following the `export const CatSchema = SchemaFactory.createForClass(Cat)` naming
function getEntities(exported: ModuleExports, path: string): EntityDefinition[] {
    const schemas = Object.entries(exported).filter(([, value]) => isSchema(value))
    const classes = Object.values(exported).filter((value) => typeof value === 'function')

    const entities = schemas
        .filter(([key]) => typeof exported[key.replace(/Schema$/, '')] === 'function')
        .map(([key, schema]) => ({ name: exported[key.replace(/Schema$/, '')].name, schema }))

    if (entities.length === 0 && schemas.length === 1 && classes.length === 1) {
        return [{ name: classes[0].name, schema: schemas[0][1] }]
    }
    if (entities.length === 0) {
        throw new Error(`Cannot find the entity exported from "${path}", export the class "Name" along with its schema "NameSchema"`)
    }
    return entities
}

async function importFiles(sourcePaths: string[], toOutputPath: (path: string) => string): Promise<{ path: string; exported: ModuleExports }[]> {
    const outputPaths = sourcePaths.map(toOutputPath)
    outputPaths.forEach((path, i) => registerOutputRoot(sourcePaths[i], path))
    return Promise.all(outputPaths.map(async (path) => ({ path, exported: await import(path) })))
}

async function createModule(
    fixturesPathPattern: string,
    entitiesPathPattern: string,
    discriminatorDir: string,
    toFixtureOutputPath: (path: string) => string,
    toEntityOutputPath: (path: string) => string,
): Promise<DynamicModule> {
    // import fixtures
    const importedFixtures = await importFiles(glob.sync(fixturesPathPattern), toFixtureOutputPath)
    const fixturesProviders: any[] = importedFixtures.flatMap(({ path, exported }) => getFixtures(exported, path))

    // import entities
    const importedEntities = await importFiles(glob.sync(entitiesPathPattern), toEntityOutputPath)

    const nonDiscriminators = importedEntities.filter((e) => !e.path.includes(discriminatorDir))
    const discriminators = importedEntities.filter((e) => e.path.includes(discriminatorDir))

    const entitiesProviders: any[] = []

    for (const entity of nonDiscriminators) {
        const entityDiscriminators = discriminators
            .filter((e) => e.path.includes(entity.path.replace(/(.+)(\/.+)$/gm, '$1')))
            .flatMap((e) => getEntities(e.exported, e.path))

        for (const provider of getEntities(entity.exported, entity.path)) {
            if (entityDiscriminators.length !== 0) {
                provider['discriminators'] = entityDiscriminators
            }

            entitiesProviders.push(provider)
        }
    }

    return {
        module: FixturesModule,
        imports: [MongooseModule.forFeature(entitiesProviders)],
        providers: [
            ReferenceRepository,
            ...fixturesProviders,
            {
                provide: 'FIXTURES',
                useFactory(...args) {
                    const providersObject = {}
                    args.forEach((arg) => (providersObject[arg.constructor.name] = arg))
                    return providersObject
                },
                inject: fixturesProviders,
            },
        ],
        exports: ['FIXTURES'],
    }
}

export class FixturesModule {
    static async forRootAsync(fixturesPathPattern: string, entitiesPathPattern: string, discriminatorDir: string = 'discriminatorDir'): Promise<DynamicModule> {
        const toOutputPath = (path: string) => path.replace('src/', `${process.cwd()}/dist/`).replace('.ts', '')
        return createModule(fixturesPathPattern, entitiesPathPattern, discriminatorDir, toOutputPath, toOutputPath)
    }

    static async forRootAsyncMonorepo(
        fixturesPathPattern: string,
        entitiesPathPattern: string,
        discriminatorDir: string = 'discriminators',
        buildDir: string = 'dist',
    ): Promise<DynamicModule> {
        return createModule(
            fixturesPathPattern,
            entitiesPathPattern,
            discriminatorDir,
            (path) => `${process.cwd()}/${buildDir}/${path.split('/').slice(-2).join('/')}`.replace('.ts', ''),
            (path) => `${process.cwd()}/${buildDir}/${path.split('/').slice(-3).join('/')}`.replace('.ts', ''),
        )
    }
}
