import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import {Client} from './chain/client.js'
import {ALICE} from './chain/testing.js'
import {Controller} from './controller.js'
import {initIpfsService} from './ipfs/init.js'


const log = createLogger('sqd:worker')


runProgram(async () => {
    // let ipfsService = await initIpfsService()

    let controller = new Controller({
        identity: ALICE,
        hardwareSpec: {
            numCpuCores: 1,
            memoryBytes: 2048n,
            storageBytes: 10n * 1024n * 1024n
        },
        client: new Client({
            url: 'ws://127.0.0.1:9944'
        }),
        log,
        // ipfsService
    })

    process.on('SIGTERM', () => controller.close())
    process.on('SIGINT', () => controller.close())

    return controller.run()
}, err => {
    log.fatal(err)
})
