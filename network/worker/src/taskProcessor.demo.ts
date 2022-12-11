import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import assert from 'assert'
import {initIpfsService} from './ipfs/init.js'
import {TaskProcessor} from './taskProcessor.js'


const LOG = createLogger('sqd:worker')


runProgram(async () => {
    let ipfsService = await initIpfsService()

    let processor = new TaskProcessor({
        concurrency: 2,
        maxWaiting: 5,
        log: LOG,
        ipfsService
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
        'curl -sS "$SQD_IPFS_SERVICE/cache/QmP8jTG1m9GSDJLCbeWhVSVgEzCPPwXRdCRuJtQ5Tz9Kc9"'
    ])

    await execute('curlimages/curl', [
        'cat', '/ipfs/N5/zdj7WWDyph5cck361e8LPUKMpLEsCPq7UwZVWqRygnkHRiDn5'
    ])

    await execute('curlimages/curl', [
        '/bin/sh',
        '-c',
        `curl -sS -X POST --data "Hello world" "$SQD_IPFS_SERVICE/publish"`
    ])

    await new Promise(resolve => {
        process.on('SIGINT', resolve)
    })

}, err => LOG.fatal(err))
