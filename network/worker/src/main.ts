import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import {Client} from './chain/client'
import {ALICE} from './chain/testing'
import {Controller} from './controller'


const LOG = createLogger('sqd:worker')


runProgram(async () => {
    let client = new Client({url: 'ws://localhost:9944'})

    let controller = new Controller({
        identity: ALICE,
        client,
        log: LOG
    })

    await controller.register()

    return controller.run()
}, err => {
    LOG.fatal(err)
})
