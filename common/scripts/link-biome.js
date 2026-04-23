// Symlinks the `@biomejs/biome` package from the `lint` autoinstaller into the
// repo-root node_modules so that editor integrations (e.g. the Biome VS Code
// extension) and `npx biome` can discover the pinned Biome install without
// requiring a manual `npm install` at the repo root.
//
// Invoked by the `install-lint` Rush global command which runs from
// `postRushInstall` (see rush.json). Safe to run repeatedly.

'use strict'

const fs = require('fs')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..', '..')
const autoinstallerBiome = path.join(
    repoRoot,
    'common',
    'autoinstallers',
    'lint',
    'node_modules',
    '@biomejs',
    'biome',
)
const rootNodeModules = path.join(repoRoot, 'node_modules')
const linkDir = path.join(rootNodeModules, '@biomejs')
const link = path.join(linkDir, 'biome')

if (!fs.existsSync(autoinstallerBiome)) {
    console.error(
        `[link-biome] @biomejs/biome is not installed in the autoinstaller at ${autoinstallerBiome}. ` +
            `Re-run \`rush install\` or \`rush update\`.`,
    )
    process.exit(1)
}

fs.mkdirSync(linkDir, {recursive: true})

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

const relativeTarget = path.relative(linkDir, autoinstallerBiome)
fs.symlinkSync(relativeTarget, link, 'junction')

console.log(`[link-biome] linked ${link} -> ${relativeTarget}`)
