import { DynamicModule } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { glob } from 'glob'
import { ReferenceRepository } from './fixtures'

export class FixturesModule {
    static async forRootAsync(fixturesPathPattern: string, entitiesPathPattern: string, discriminatorDir: string = 'discriminatorDir'): Promise<DynamicModule> {
        // import fixtures
        const fixturesPath = glob.sync(fixturesPathPattern)
        const fixturesRelativePath = fixturesPath.map((path) => path.replace('src/', `${process.cwd()}/dist/`)).map((path) => path.replace('.ts', ''))
        const fixturesProviders: any[] = []
        const importedFixtures = await Promise.all(fixturesRelativePath.map((path) => import(path)))

        importedFixtures.forEach((fixture) => {
            fixturesProviders.push(fixture[Object.keys(fixture)[0]])
        })

        // import entities
        const entitiesPath = glob.sync(entitiesPathPattern)
        const entitiesRelativePath = entitiesPath.map((path) => path.replace('src/', `${process.cwd()}/dist/`)).map((path) => path.replace('.ts', ''))

        const nonDiscriminatorsRelativePath = entitiesRelativePath.filter((e) => !e.includes(discriminatorDir))
        const discriminatorsRelativePath = entitiesRelativePath.filter((e) => e.includes(discriminatorDir))

        const entitiesProviders: any[] = []

        for (const entity of nonDiscriminatorsRelativePath) {
            const importedEntity = await import(entity)

            const provider = {
                name: importedEntity[Object.keys(importedEntity)[0]].name,
                schema: importedEntity[Object.keys(importedEntity)[1]],
            }

            const discriminators = discriminatorsRelativePath.filter((e) => e.includes(entity.replace(/(.+)(\/.+)$/gm, '$1')))

            if (discriminators.length !== 0) {
                const importedDiscriminators = await Promise.all(discriminators.map((path) => import(path)))
                provider['discriminators'] = importedDiscriminators.map((e) => {
                    return { name: e[Object.keys(e)[0]].name, schema: e[Object.keys(e)[1]] }
                })
            }

            entitiesProviders.push(provider)
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

    static async forRootAsyncMonorepo(
        fixturesPathPattern: string,
        entitiesPathPattern: string,
        discriminatorDir: string = 'discriminators',
        buildDir: string = 'dist',
    ): Promise<DynamicModule> {
        // import fixtures
        const fixturesPath = glob.sync(fixturesPathPattern)
        const fixturesRelativePath = fixturesPath.map((path) => `${process.cwd()}/${buildDir}/${path.split('/').slice(-2).join('/')}`).map((path) => path.replace('.ts', ''))
        const fixturesProviders: any[] = []
        const importedFixtures = await Promise.all(fixturesRelativePath.map((path) => import(path)))

        importedFixtures.forEach((fixture) => {
            fixturesProviders.push(fixture[Object.keys(fixture)[0]])
        })

        // import entities
        const entitiesPath = glob.sync(entitiesPathPattern)
        const entitiesRelativePath = entitiesPath.map((path) => `${process.cwd()}/${buildDir}/${path.split('/').slice(-3).join('/')}`).map((path) => path.replace('.ts', ''))

        const nonDiscriminatorsRelativePath = entitiesRelativePath.filter((e) => !e.includes(discriminatorDir))
        const discriminatorsRelativePath = entitiesRelativePath.filter((e) => e.includes(discriminatorDir))

        const entitiesProviders: any[] = []

        for (const entity of nonDiscriminatorsRelativePath) {
            const importedEntity = await import(entity)

            const provider = {
                name: importedEntity[Object.keys(importedEntity)[0]].name,
                schema: importedEntity[Object.keys(importedEntity)[1]],
            }

            const discriminators = discriminatorsRelativePath.filter((e) => e.includes(entity.replace(/(.+)(\/.+)$/gm, '$1')))

            if (discriminators.length !== 0) {
                const importedDiscriminators = await Promise.all(discriminators.map((path) => import(path)))
                provider['discriminators'] = importedDiscriminators.map((e) => {
                    return { name: e[Object.keys(e)[0]].name, schema: e[Object.keys(e)[1]] }
                })
            }

            entitiesProviders.push(provider)
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
}
