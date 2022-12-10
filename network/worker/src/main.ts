import {IpfsCache} from '@subsquid/ipfs-cache/lib/cache'
import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import {setMaxListeners} from 'events'
import {create} from 'ipfs-core'
import {Client} from './chain/client'
import {ALICE} from './chain/testing'
import {Controller} from './controller'
import {createIpfsCacheService} from './ipfs'


const LOG = createLogger('sqd:worker')


runProgram(async () => {
    setMaxListeners(100)

    // let ipfs = await create({silent: true})
    // LOG.info('ipfs api is ready')
    //
    // let ipfsCacheService = await createIpfsCacheService(new IpfsCache({
    //     ipfs,
    //     dir: '.ipfs-cache',
    //     log: LOG.child('ipfs-cache')
    // }))

    let controller = new Controller({
        identity: ALICE,
        client: new Client({url: 'ws://localhost:9944'}),
        log: LOG
    })

    await controller.register()

    return controller.run()
}, err => {
    LOG.fatal(err)
})
