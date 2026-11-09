const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')
const { FixturesModule } = require('..')
const { inProject, projectDir, modelTokens, fixturesProviders, fixturesNames } = require('./helpers')

const forApp = () => inProject('app', () => FixturesModule.forRootAsync('src/datafixtures/*.fixtures.ts', 'src/models/**/*.schema.ts', 'discriminators'))

const forMonorepo = () =>
    inProject('monorepo', () =>
        FixturesModule.forRootAsyncMonorepo('backend/src/datafixtures/*.fixtures.ts', 'backend/src/entities/**/*.schema.ts', 'discriminators', 'dist/src'),
    )

const forInvalid = (fixturesPattern, entitiesPattern) => inProject('invalid', () => FixturesModule.forRootAsync(fixturesPattern, entitiesPattern))

describe('forRootAsync', () => {
    it('loads fixtures and schemas importing their dependencies with non-relative paths', async () => {
        const dynamicModule = await forApp()

        assert.deepEqual(fixturesNames(dynamicModule), ['CatFixtures', 'UserFixtures'])
        assert.ok(modelTokens(dynamicModule).includes('UserModel'))
    })

    it('loads a module imported with a non-relative path only once', async () => {
        const dynamicModule = await forApp()

        const userFixtures = fixturesProviders(dynamicModule).find((fixtures) => fixtures.name === 'UserFixtures')
        assert.equal(userFixtures, require(path.join(projectDir('app'), 'dist/datafixtures/user.fixtures')).UserFixtures)
        assert.equal(Object.keys(require.cache).filter((file) => file.endsWith('user.fixtures.js')).length, 1)
    })

    it('registers the entity of a schema file whatever the order of its exports', async () => {
        const dynamicModule = await forApp()

        assert.ok(modelTokens(dynamicModule).includes('CatModel'))
        assert.ok(!modelTokens(dynamicModule).includes('undefinedModel'))
    })

    it('registers the discriminators of a schema file whatever the order of their exports', async () => {
        const dynamicModule = await forApp()

        assert.ok(modelTokens(dynamicModule).includes('LionModel'))
    })

    it('registers every entity exported from the same schema file', async () => {
        const dynamicModule = await forApp()

        assert.deepEqual(modelTokens(dynamicModule), ['BallModel', 'CatModel', 'LionModel', 'ToyModel', 'UserModel'])
    })

    it('injects every fixtures in the FIXTURES provider', async () => {
        const dynamicModule = await forApp()

        const factory = dynamicModule.providers.find((provider) => provider.provide === 'FIXTURES')
        assert.deepEqual(factory.inject, fixturesProviders(dynamicModule))
    })
})

describe('forRootAsyncMonorepo', () => {
    it('loads fixtures and schemas importing their dependencies with non-relative paths', async () => {
        const dynamicModule = await forMonorepo()

        assert.deepEqual(fixturesNames(dynamicModule), ['QuoteFixtures', 'UserFixtures'])
        assert.deepEqual(modelTokens(dynamicModule), ['QuoteModel', 'UserModel'])
    })
})

describe('invalid projects', () => {
    it('explains how to export a schema when its entity cannot be found', async () => {
        await assert.rejects(forInvalid('src/none/*.fixtures.ts', 'src/ambiguous/*.schema.ts'), /Cannot find the entity exported from ".*ambiguous\.schema"/)
    })

    it('fails when a fixtures file does not export any fixtures', async () => {
        await assert.rejects(forInvalid('src/no-fixtures/*.fixtures.ts', 'src/none/*.schema.ts'), /No class extending Fixtures is exported from ".*empty\.fixtures"/)
    })

    it('still fails on a non-relative import that does not exist', async () => {
        await assert.rejects(forInvalid('src/missing-import/*.fixtures.ts', 'src/none/*.schema.ts'), (error) => {
            assert.equal(error.code, 'MODULE_NOT_FOUND')
            assert.match(error.message, /Cannot find module 'src\/does\/not\/exist'/)
            return true
        })
    })
})
