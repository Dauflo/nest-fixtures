// Compiles the test projects the same way a consumer project would, with a plain `tsc` that keeps
// the non-relative imports (`src/...`) as they are in the emitted JavaScript.
const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const { PROJECTS_DIR, ROOT_DIR, projectDir } = require('./helpers')

// make `@dauflo/nest-fixtures` resolve to this repository from the test projects
const packageLink = path.join(PROJECTS_DIR, 'node_modules', '@dauflo', 'nest-fixtures')
fs.rmSync(packageLink, { recursive: true, force: true })
fs.mkdirSync(path.dirname(packageLink), { recursive: true })
fs.symlinkSync(path.relative(path.dirname(packageLink), ROOT_DIR), packageLink, 'dir')

const tsc = require.resolve('typescript/bin/tsc')

for (const project of ['app', 'monorepo', 'invalid']) {
    fs.rmSync(path.join(projectDir(project), 'dist'), { recursive: true, force: true })
    try {
        execFileSync(process.execPath, [tsc, '-p', projectDir(project)], { stdio: 'pipe' })
    } catch (error) {
        console.error(`Compilation of the "${project}" test project failed:\n${error.stdout}${error.stderr}`)
        process.exit(1)
    }
}
