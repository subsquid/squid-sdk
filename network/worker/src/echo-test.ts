import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import {TaskResult} from './chain/interface'
import {TaskProcessor} from './taskProcessor'


const LOG = createLogger('sqd:worker')


runProgram(async () => {
    let processor = new TaskProcessor({
        concurrency: 2,
        maxWaiting: 5,
        log: LOG
    })

    let results: Promise<TaskResult>[] = []

    for (let i = 0; i < 5; i++) {
        results[i] = processor.submit({
            taskId: new Uint8Array([i]),
            dockerImage: Buffer.from('debian:stable-20221205-slim@sha256:3cc6a43149705e0fbf09fde1d6ef2c9707aa6cc012219d95281cff535890b306'),
            command: ['/bin/sh', '-c', `echo "hello ${i+1}"`].map(arg => Buffer.from(arg))
        })!.result
    }

    await Promise.all(results)

}, err => LOG.fatal(err))
