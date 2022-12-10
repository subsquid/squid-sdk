import {runProgram} from '@subsquid/util-internal'
import {OutDir} from '@subsquid/util-internal-code-printer'
import {definitions} from './definitions.js'


runProgram(async () => {
    let out = new OutDir(__dirname).file('../../src/chain/interface.ts')
    await definitions.generateInterfaces(out)
    out.write()
})
