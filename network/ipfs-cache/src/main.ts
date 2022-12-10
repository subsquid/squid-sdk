import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import {CID, create as createIpfs} from 'ipfs-core'
import {IpfsCache} from './cache'


const LOG = createLogger('sqd:ipfs-cache')


runProgram(async () => {
    let ipfs = await createIpfs({silent: true})
    LOG.info('ipfs api is ready')

    await ipfs.files.cp(CID.parse('Qmb13YLZobPJ1okii2E4wDwoKLC84Dva2z4Jwa8Yn5dBEP'), '/chunks/0015015000-0015016404/blocks.parquet')
    let stat = await ipfs.files.stat('/chunks/0015015000-0015016404')
    LOG.info(stat)

    let cache = new IpfsCache({
        dir: '.temp.data',
        ipfs,
        log: LOG
    })

    await cache.put(CID.parse('Qmaq8aX5DeihuZKUNuLi2fFAsDE8UgmFfa1M5nXu4Q1Tuw'))

}, err => LOG.fatal(err))


function waitInterrupt(): Promise<void> {
    return new Promise(resolve => {
        process.once('SIGINT', resolve)
    })
}
