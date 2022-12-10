import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import {create as createIpfsClient} from 'ipfs-http-client'
import {Client} from './chain/client'
import {ALICE} from './chain/testing'
import {Controller} from './controller'
import {IpfsCache} from './ipfs/cache'
import {createIpfsCacheService} from './ipfs/cache-service'


const LOG = createLogger('sqd:worker')


runProgram(async () => {
    let ipfs = createIpfsClient({url: 'http://localhost:8080'})

    let ipfsCacheService = await createIpfsCacheService(new IpfsCache({
        ipfs,
        dir: '.ipfs-cache',
        log: LOG.child('ipfs-cache')
    }))

    let controller = new Controller({
        identity: ALICE,
        client: new Client({url: 'ws://localhost:9944'}),
        log: LOG,
        ipfs: {
            cache: `http://host.docker.internal:${ipfsCacheService.port}`,
            gateway: `http://host.docker.internal:8080`
        }
    })

    process.on('SIGINT', () => controller.close())
    process.on('SIGTERM', () => controller.close())

    return controller.run()
}, err => {
    LOG.fatal(err)
})
