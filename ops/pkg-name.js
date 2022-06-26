/**
 * Given a path to npm package, extract its name
 */

const assert = require('assert')
const path = require("path")
const PKG = process.argv[2]

assert(PKG, 'missing path of the package')

const {name} = require(path.resolve(__dirname, '..', PKG, 'package.json'))
assert(name, `missing .name in ${PKG}`)
console.log(name)
