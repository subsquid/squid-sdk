import {Logger} from '@subsquid/logger'
import {ensureError} from '@subsquid/util-internal'
import {toHex} from '@subsquid/util-internal-hex'
import {spawn} from 'child_process'
import * as Path from 'path'
import {TaskSpec, TaskResult, TaskId} from './chain/interface.js'
import {Future, toBuffer} from './util.js'


export interface TaskProcessorOptions {
    concurrency: number
    maxWaiting: number
    log: Logger
    ipfsService?: IpfsService
}


export interface IpfsService {
    port: number
    cacheDir: string
}


export interface TaskHandle {
    result: Promise<TaskResult>
    cancel(): void
}


interface Item {
    taskId: TaskId
    taskSpec: TaskSpec
    abort: AbortController
    future: Future<TaskResult>
}


export class TaskProcessor {
    private running = 0
    private queue: Item[] = []
    private hasFatalError = false
    private log: Logger

    constructor(private options: TaskProcessorOptions) {
        this.log = options.log
    }

    submit(taskId: TaskId, taskSpec: TaskSpec): TaskHandle | undefined {
        if (this.hasFatalError) throw new Error(
            `Unexpected task processing error occurred previously, the processing of any new task will likely fail`
        )
        if (this.queue.length > this.options.maxWaiting && this.queueSize() > this.options.maxWaiting) {
            return undefined
        }

        let abort = new AbortController()
        let future = new Future<TaskResult>()

        let item = {
            taskId,
            taskSpec,
            abort,
            future
        }

        if (this.running >= this.options.concurrency) {
            this.queue.push(item)
        } else {
            this.process(item).catch(err => this.handleFatalError(err))
        }

        return {
            result: future.promise,
            cancel: () => abort.abort()
        }
    }

    private handleFatalError(error: unknown) {
        let err = ensureError(error)
        this.log.error(err, 'unexpected task processing error')
        this.hasFatalError = true
    }

    private queueSize(): number {
        let count = 0
        for (let i = 0; i < this.queue.length; i++) {
            let item = this.queue[i]
            if (!item.abort.signal.aborted) {
                count += 1
            }
        }
        return count
    }

    private async process(item: Item): Promise<void> {
        let image_name = toBuffer(item.taskSpec.dockerImage.name).toString()
        let digest = toBuffer(item.taskSpec.dockerImage.digest).toString("hex")
        let image = image_name + "@sha256:" + digest

        let command = item.taskSpec.command.map(arg => {
            return toBuffer(arg).toString()
        })

        let taskId = item.taskId

        this.log.info({
            taskId,
            image,
            command
        }, 'start task')

        this.running += 1
        try {
            let result = await this.execute(taskId, image, command, item.abort.signal)

            this.log.info({
                taskId,
                stdout: toBuffer(result.stdout).toString().trim() || undefined,
                stderr: toBuffer(result.stderr).toString().trim() || undefined
            }, 'task finished')

            item.future.resolve(result)
        } catch(err: any) {
            this.handleFatalError(err)
        } finally {
            this.running -= 1
        }

        if (this.hasFatalError) return

        let next: Item | undefined
        while (next = this.queue.shift()) {
            if (!next.abort.signal.aborted) {
                this.process(next).catch(err => this.handleFatalError(err))
                return
            }
        }
    }

    protected execute(taskId: TaskId, image: string, command: string[], signal: AbortSignal): Promise<TaskResult> {
        return new Promise((resolve, reject) => {
            let env = {...process.env}
            let dockerArgs: string[] = []

            env['SQD_TASK_ID'] = taskId.toString()
            dockerArgs.push('-e', 'SQD_TASK_ID')

            let ipfs = this.options.ipfsService
            if (ipfs) {
                env['SQD_IPFS_SERVICE'] = `http://host.docker.internal:${ipfs.port}`
                dockerArgs.push('-e', 'SQD_IPFS_SERVICE')
                dockerArgs.push('-v', `${Path.resolve(ipfs.cacheDir)}:/ipfs`)
            }

            let ps = spawn('docker', ['run', '--rm', ...dockerArgs, image, ...command], {
                signal,
                killSignal: 'SIGKILL',
                env
            })

            let stdout = new ByteSink(1024)
            let stderr = new ByteSink(1024)

            ps.stdout.on('data', data => {
                stdout.write(data)
            })

            ps.stderr.on('data', data => {
                stderr.write(data)
            })

            ps.on('error', err => {
                reject(new Error(`Failed to spawn docker: ${err.message}`))
            })

            ps.on('close', exitCode => {
                if (signal.aborted || exitCode == null) return
                if (exitCode == 125) {
                    // problem with the docker daemon itself
                    // beside possible image unavailability it's ours
                    // FIXME: catch unavailability as a network error
                    reject(new Error(`Failed to run a docker image: ${stderr.toString()}`))
                } else {
                    resolve({
                        exitCode,
                        stdout: stdout.toBytes(),
                        stderr: stderr.toBytes()
                    })
                }
            })
        })
    }
}


class ByteSink {
    private buf?: Uint8Array
    private len = 0

    constructor(private limit: number) {}

    write(data: Uint8Array): void {
        let left = this.limit - this.len
        if (left == 0) return
        let writeSize = Math.min(left, data.length)
        if (this.buf) {
            if (this.buf.length < this.limit) {
                this.buf = Buffer.alloc(this.limit, toBuffer(this.buf))
            }
            toBuffer(data).copy(this.buf, this.len, 0, writeSize)
        } else if (data.length < left) {
            this.buf = data
        } else {
            this.buf = data.subarray(0, left)
        }
        this.len += writeSize
    }

    toBytes(): Uint8Array {
        return this.buf || new Uint8Array(0)
    }

    toString(): string {
        return toBuffer(this.toBytes()).toString()
    }
}
