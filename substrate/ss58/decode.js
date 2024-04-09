const ss58 = require('./lib')

const address = ss58.decode(process.argv[2])

console.log(address)
