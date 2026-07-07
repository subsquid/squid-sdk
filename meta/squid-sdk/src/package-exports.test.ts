import {existsSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

import {describe, expect, it} from 'vitest'

import pkg from '../package.json'

// This test lives at src/package-exports.test.ts; each subpath barrel is src/<subpath>/index.ts,
// emitted by `tsc` to the lib/<subpath>/index.{js,d.ts} the maps below reference.
const SRC = dirname(fileURLToPath(import.meta.url))

const exports = pkg.exports as Record<string, any>
const typesVersions = pkg.typesVersions['*'] as Record<string, string[]>

// `exports` keys carry a leading './'; `typesVersions` keys do not. Normalize to the bare subpath,
// excluding the root ('.') and the literal './package.json' passthrough (which has no barrel).
function exportSubpaths(): string[] {
    return Object.keys(exports)
        .filter((k) => k !== '.' && k !== './package.json')
        .map((k) => k.slice(2))
}

describe('package.json subpath maps', () => {
    it('exports and typesVersions declare exactly the same subpaths', () => {
        // A subpath present in one map but not the other is the silent-drift hazard this guard exists
        // for: it resolves at runtime / modern TS via `exports` yet fails node10 type resolution
        // (which reads only `typesVersions`), or vice-versa — a break that surfaces only in a
        // classic-tsconfig consumer, never here at build time.
        expect(Object.keys(typesVersions).sort()).toEqual(exportSubpaths().sort())
    })

    it('every subpath maps to consistent lib paths and an existing src barrel', () => {
        for (let sub of exportSubpaths()) {
            let lib = `./lib/${sub}/index`
            expect(exports['./' + sub]).toEqual({
                types: `${lib}.d.ts`,
                import: `${lib}.js`,
                require: `${lib}.js`,
            })
            expect(typesVersions[sub]).toEqual([`${lib}.d.ts`])
            expect(existsSync(join(SRC, sub, 'index.ts')), `missing barrel src/${sub}/index.ts`).toBe(true)
        }
    })

    it('exposes the root and ./package.json', () => {
        expect(exports['.']).toMatchObject({types: './lib/index.d.ts'})
        expect(existsSync(join(SRC, 'index.ts'))).toBe(true)
        // Once an `exports` map exists it is a hard allowlist; without this entry
        // `require('@subsquid/squid-sdk/package.json')` throws ERR_PACKAGE_PATH_NOT_EXPORTED.
        expect(exports['./package.json']).toBe('./package.json')
    })
})
