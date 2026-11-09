import Module = require('module')
import * as path from 'path'

type OutputRoot = {
    source: string
    output: string
}

const outputRoots: OutputRoot[] = []
let installed = false

const stripExtension = (file: string) => file.replace(/\.[cm]?[jt]sx?$/, '')

const isInside = (file: string, dir: string) => {
    const relative = path.relative(dir, file)
    return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative)
}

const isBareSpecifier = (request: string) =>
    !request.startsWith('.') && !path.isAbsolute(request) && !request.startsWith('node:') && !Module.builtinModules.includes(request)

/**
 * Remember how a source file maps to its compiled output, e.g. `/app/src/a/b.ts` -> `/app/dist/a/b.js`
 * gives the roots `/app/src` -> `/app/dist`. Those roots are then used to resolve non-relative imports
 * (`src/a/b`, resolved by TypeScript through `baseUrl`) that are emitted as-is and that Node cannot find.
 */
export function registerOutputRoot(sourceFile: string, outputFile: string) {
    const sourceSegments = stripExtension(path.resolve(sourceFile)).split(path.sep)
    const outputSegments = stripExtension(path.resolve(outputFile)).split(path.sep)

    while (sourceSegments.length > 1 && outputSegments.length > 1 && sourceSegments[sourceSegments.length - 1] === outputSegments[outputSegments.length - 1]) {
        sourceSegments.pop()
        outputSegments.pop()
    }

    const root = { source: sourceSegments.join(path.sep), output: outputSegments.join(path.sep) }
    if (root.source === root.output || outputRoots.some((e) => e.source === root.source && e.output === root.output)) {
        return
    }

    outputRoots.push(root)
    install()
}

function candidates(request: string, parentFile: string): string[] {
    const result: string[] = []
    for (const root of outputRoots) {
        if (!isInside(parentFile, root.output)) {
            continue
        }
        // `baseUrl` points to the source root's parent, e.g. `src/models/cat.schema` with `baseUrl: './backend'`
        result.push(path.join(root.output, request))
        // `baseUrl` points to the current directory, e.g. `backend/src/models/cat.schema` or `src/models/cat.schema`
        const fromCwd = path.resolve(process.cwd(), request)
        if (isInside(fromCwd, root.source)) {
            result.push(path.join(root.output, path.relative(root.source, fromCwd)))
        }
    }
    return result
}

function install() {
    if (installed) {
        return
    }
    installed = true

    const moduleWithResolver = Module as unknown as { _resolveFilename: (request: string, parent: any, ...rest: any[]) => string }
    const originalResolveFilename = moduleWithResolver._resolveFilename

    moduleWithResolver._resolveFilename = function (request: string, parent: any, ...rest: any[]) {
        try {
            return originalResolveFilename.call(this, request, parent, ...rest)
        } catch (error) {
            const parentFile: string | undefined = parent?.filename
            if (error?.code !== 'MODULE_NOT_FOUND' || !parentFile || !isBareSpecifier(request) || parentFile.includes(`${path.sep}node_modules${path.sep}`)) {
                throw error
            }

            for (const candidate of candidates(request, parentFile)) {
                try {
                    return originalResolveFilename.call(this, candidate, parent, ...rest)
                } catch {}
            }
            throw error
        }
    }
}
