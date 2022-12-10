import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import {Client} from './chain/client.js'
import {ALICE} from './chain/testing.js'
import {Controller} from './controller.js'
import {initIpfsServices} from './ipfs/init.js'


const LOG = createLogger('sqd:worker')


runProgram(async () => {
    let ipfsServices = await initIpfsServices()

    let controller = new Controller({
        identity: ALICE,
        client: new Client({
            url: 'ws://127.0.0.1:9944'
        }),
        log: LOG,
        ipfs: ipfsServices
    })

    process.on('SIGTERM', () => controller.close())

    return controller.run()
}, err => {
    LOG.fatal(err)
})
