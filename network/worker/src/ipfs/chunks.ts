import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import {create as createIpfs} from 'ipfs-core'
import {CID} from 'multiformats'


const log = createLogger('sqd:chunks')


runProgram(async () => {
    log.info('initializing ipfs')
    let ipfs = await createIpfs({silent: true})
    log.info('initialized ipfs')

    let root = '/etha/0015015000-0015016404'

    async function put(cid: string, dest: string): Promise<void> {
        let path = root + '/' + dest
        await ipfs.files.cp(CID.parse(cid), path, {
            parents: true,
        })
        log.info(`${cid} -> ${path}`)
    }

    await ipfs.files.rm(root, {recursive: true})
    await put('Qmb13YLZobPJ1okii2E4wDwoKLC84Dva2z4Jwa8Yn5dBEP', 'blocks.parquet')
    await put('QmUVmUvcWGBQTJm1RJyoA5Y4P6QwBV8WDGWZziBTUQt8vQ', 'logs.parquet')
    await put('QmQULv1ArLS3CP8hk4MBkYbuXnpC6HNw89qv36tZNSSR9a', 'transactions.parquet')

    let stat = await ipfs.files.stat(root)
    log.info(`${stat.cid} -> ${root}`)

}, err => log.fatal(err))
