import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import assert from 'assert'
import {initIpfsServices} from './ipfs/init.js'
import {TaskProcessor} from './taskProcessor.js'


const LOG = createLogger('sqd:worker')


runProgram(async () => {
    let ipfsServices = await initIpfsServices()

    let processor = new TaskProcessor({
        concurrency: 2,
        maxWaiting: 5,
        log: LOG,
        ipfs: ipfsServices
    })

    let ids = 0

    async function execute(image: string, args: string[]): Promise<void> {
        let id = ids += 1
        let handle = processor.submit({
            taskId: new Uint8Array([id]),
            dockerImage: Buffer.from(image),
            command: args.map(arg => Buffer.from(arg))
        })

        assert(handle)

        await handle.result
    }

    await execute('curlimages/curl', [
        '/bin/sh',
        '-c',
        'curl -sS "$IPFS_CACHE/QmP8jTG1m9GSDJLCbeWhVSVgEzCPPwXRdCRuJtQ5Tz9Kc9"'
    ])

    await new Promise(resolve => {
        process.on('SIGINT', resolve)
    })

}, err => LOG.fatal(err))
