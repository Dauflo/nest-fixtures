const path = require('path')

const ROOT_DIR = path.resolve(__dirname, '..')
const PROJECTS_DIR = path.join(__dirname, 'projects')

const projectDir = (project) => path.join(PROJECTS_DIR, project)

// the module resolves the globs and the build directory from the current directory, like in a consumer project
async function inProject(project, callback) {
    const cwd = process.cwd()
    process.chdir(projectDir(project))
    try {
        return await callback()
    } finally {
        process.chdir(cwd)
    }
}

const modelTokens = (dynamicModule) => dynamicModule.imports[0].providers.map((provider) => provider.provide).sort()

const fixturesProviders = (dynamicModule) => dynamicModule.providers.filter((provider) => typeof provider === 'function' && provider.name.endsWith('Fixtures'))

const fixturesNames = (dynamicModule) => fixturesProviders(dynamicModule).map((fixtures) => fixtures.name).sort()

module.exports = { ROOT_DIR, PROJECTS_DIR, projectDir, inProject, modelTokens, fixturesProviders, fixturesNames }
