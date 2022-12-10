import {createLogger} from '@subsquid/logger'
import * as fs from 'fs/promises'
import {create as createIpfsClient} from 'ipfs-http-client'
import type {IpfsServices} from '../taskProcessor.js'
import {createIpfsCacheService} from './cache-service.js'
import {IpfsCache} from './cache.js'


export async function initIpfsServices(): Promise<IpfsServices> {
    let log = createLogger('sqd:worker:ipfs-cache')
    let cacheDir = '.temp.ipfs-cache'

    await fs.mkdir(cacheDir, {recursive: true})

    let cacheService = await createIpfsCacheService(new IpfsCache({
        ipfs: createIpfsClient({host: '127.0.0.1'}),
        dir: cacheDir,
        log
    }))

    log.info(`IPFS cache service listening on port ${cacheService.port}`)

    return {
        gateway: 'http://host.docker.internal:8080',
        cache: `http://host.docker.internal:${cacheService.port}`,
        cacheDir
    }
}
