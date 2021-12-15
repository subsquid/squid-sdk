const self = require('../package.json')
const reader = require('@subsquid/openreader/package.json')

export const squid = self.version
export const openreader = self.dependencies['@subsquid/openreader']
export const substrateProcessor = self.devDependencies['@subsquid/substrate-processor']
export const util = self.dependencies['@subsquid/util']
export const pgTypes = reader.devDependencies['@types/pg']
export const typeorm = self.dependencies.typeorm
export const typeGraphql = '^1.1.1'
export const classValidator = '^0.13.1'
export const typeScript = self.devDependencies.typescript
