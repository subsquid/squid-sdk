import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import * as IPFS from 'ipfs-core'
import {CID} from 'multiformats'


const LOG = createLogger('sqd:ipfs-cache')


runProgram(async () => {
    let ipfs = await IPFS.create()

    // let stat = await ipfs.files.stat(CID.parse('QmdmQXB2mzChmMeKY47C43LxUdg1NDJ5MWcKMKxDu7RgQm'))

    let cid = CID.parse('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D')
    let stat = await ipfs.files.stat(cid)

    LOG.info({stat})

}, err => LOG.fatal(err))


function waitInterrupt(): Promise<void> {
    return new Promise(resolve => {
        process.once('SIGINT', resolve)
    })
}
