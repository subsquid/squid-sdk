// Symlinks the vitest package from the `vitest` autoinstaller into the repo-root
// node_modules so that the root-level `vitest.config.ts` (and its IDE tooling) can
// resolve `vitest/config` without requiring a manual `npm install` at the repo root.
//
// This script is invoked by the `install-vitest` Rush global command which in turn
// runs from `postRushInstall` (see rush.json). It is safe to run repeatedly.

'use strict'

const fs = require('fs')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..', '..')
const autoinstallerVitest = path.join(
    repoRoot,
    'common',
    'autoinstallers',
    'vitest',
    'node_modules',
    'vitest',
)
const rootNodeModules = path.join(repoRoot, 'node_modules')
const link = path.join(rootNodeModules, 'vitest')

if (!fs.existsSync(autoinstallerVitest)) {
    console.error(
        `[link-vitest] vitest is not installed in the autoinstaller at ${autoinstallerVitest}. ` +
            `Re-run \`rush install\` or \`rush update\`.`,
    )
    process.exit(1)
}

fs.mkdirSync(rootNodeModules, {recursive: true})

// Remove any prior file/symlink/directory at the target so we can (re)create the symlink.
try {
    const stat = fs.lstatSync(link)
    if (stat.isSymbolicLink() || stat.isFile()) {
        fs.unlinkSync(link)
    } else if (stat.isDirectory()) {
        fs.rmSync(link, {recursive: true, force: true})
    }
} catch (err) {
    if (err.code !== 'ENOENT') throw err
}

const relativeTarget = path.relative(rootNodeModules, autoinstallerVitest)
fs.symlinkSync(relativeTarget, link, 'junction')

console.log(`[link-vitest] linked ${link} -> ${relativeTarget}`)
