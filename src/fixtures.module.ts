import { DynamicModule } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { glob } from 'glob'
import { ReferenceRepository } from './fixtures'

export class FixturesModule {
    static async forRootAsync(fixturesPathPattern: string, entitiesPathPattern: string): Promise<DynamicModule> {
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
        const entitiesProviders: any[] = []
        const importedEntities = await Promise.all(entitiesRelativePath.map((path) => import(path)))

        importedEntities.forEach((entity) => {
            entitiesProviders.push({
                name: entity[Object.keys(entity)[0]].name,
                schema: entity[Object.keys(entity)[1]],
            })
        })

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
