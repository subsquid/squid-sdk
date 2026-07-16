#!/usr/bin/env node
// Generate a directory "redirect" (`<subpath>/package.json` with `types`/`main` pointing into `lib/`)
// for every declared subpath. Purpose: editor discoverability under the classic (node10) module
// resolution that the standard squid tsconfig uses. There, TypeScript ignores the `exports` map and
// only surfaces a subpath's *children* in autocomplete when the parent is a real, resolvable
// directory — so `@subsquid/squid-sdk/evm/` completes to `rpc`/`fallback` only if `evm/rpc/` and
// `evm/fallback/` exist on disk. Node itself always resolves these subpaths via `exports` at runtime;
// these files are consumed only by editor tooling. Run after `tsc` (see the `build` script).
const fs = require('fs')
const path = require('path')

const pkgDir = path.resolve(__dirname, '..')
const pkg = require(path.join(pkgDir, 'package.json'))

const subpaths = Object.keys(pkg.exports)
    .filter((k) => k !== '.' && k !== './package.json')
    .map((k) => k.replace(/^\.\//, ''))

const topDirs = [...new Set(subpaths.map((s) => s.split('/')[0]))]

// Guard: every generated top-level dir must be in `files`, or publish would silently drop the stubs
// and break discoverability for that subtree.
const missingFromFiles = topDirs.filter((d) => !pkg.files.includes(d))
if (missingFromFiles.length) {
    console.error(`gen-subpath-stubs: add ${missingFromFiles.join(', ')} to "files" in package.json`)
    process.exit(1)
}

// Clean previously generated dirs so rebuilds are idempotent and a removed subpath leaves nothing behind.
for (const d of topDirs) fs.rmSync(path.join(pkgDir, d), {recursive: true, force: true})

for (const sub of subpaths) {
    const target = path.join(pkgDir, 'lib', sub, 'index.d.ts')
    if (!fs.existsSync(target)) {
        console.error(`gen-subpath-stubs: exports declares "./${sub}" but ${path.relative(pkgDir, target)} is missing — build first`)
        process.exit(1)
    }
    const up = '../'.repeat(sub.split('/').length)
    const dir = path.join(pkgDir, sub)
    fs.mkdirSync(dir, {recursive: true})
    // No `name` field: this is a folder redirect, not a nested package.
    const redirect = {types: `${up}lib/${sub}/index.d.ts`, main: `${up}lib/${sub}/index.js`}
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(redirect, null, 2) + '\n')
}

console.log(`gen-subpath-stubs: wrote ${subpaths.length} subpath redirect(s)`)
