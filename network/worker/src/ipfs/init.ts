import {createLogger} from '@subsquid/logger'
import * as fs from 'fs/promises'
import {create as createIpfs} from 'ipfs-core'
import type {IpfsService} from '../taskProcessor.js'
import {IpfsCache} from './cache.js'
import {createIpfsService} from './service'


export async function initIpfsService(): Promise<IpfsService> {
    let log = createLogger('sqd:worker:ipfs')
    let cacheDir = '.temp.ipfs-cache'

    await fs.mkdir(cacheDir, {recursive: true})

    log.info('initializing ipfs')
    let ipfs = await createIpfs({silent: true})
    log.info('initialized ipfs')

    let cache = new IpfsCache({
        ipfs,
        dir: cacheDir,
        log
    })

    let service = await createIpfsService({ipfs, cache})

    log.info(`sqd ipfs service listening on port ${service.port}`)

    return {
        port: service.port,
        cacheDir
    }
}
