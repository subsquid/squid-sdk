/**
 * Given a path to npm package, extract its version
 */

const assert = require('assert')
const path = require("path")
const PKG = process.argv[2]

assert(PKG, 'missing path of the package')

const version = require(path.resolve(__dirname, '..', PKG, 'package.json')).version
assert(version, `missing .version in ${PKG}`)
console.log(version)

