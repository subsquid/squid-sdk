import {Logger} from '@subsquid/logger'
import {assertNotNull, def, wait} from '@subsquid/util-internal'
import assert from 'assert'
import {Client} from './chain/client.js'
import {TaskSpec, TaskResult, TaskId} from './chain/interface.js'
import {KeyPair} from './chain/keyPair.js'
import {IpfsService, TaskHandle, TaskProcessor} from './taskProcessor.js'
import {toBuffer} from './util.js'


interface Block {
    height: number
    hash: string
    parentHash: string
    parent?: Block
    timestamp: number
    tasks: TaskItem[]
}


interface TaskItem {
    taskId: TaskId
    taskSpec: TaskSpec
    handle?: TaskHandle
}


export interface ControllerOptions {
    identity: KeyPair
    client: Client
    log: Logger
    ipfsService?: IpfsService
}


export class Controller {
    private identity: KeyPair
    private client: Client
    private log: Logger
    private head!: Block
    private taskProcessor: TaskProcessor
    private running = true

    constructor(options: ControllerOptions) {
        this.identity = options.identity
        this.client = options.client
        this.log = options.log
        this.taskProcessor = new TaskProcessor({
            concurrency: 1,
            maxWaiting: 10,
            log: this.log,
            ipfsService: options.ipfsService
        })
    }

    private async loop(): Promise<void> {
        this.head = await this.fetchBlock(await this.client.getFinalizedHead())
        while (this.running) {
            let newHead = await this.client.getHead()
            if (this.head.hash == newHead) {
                await wait(500)
            } else {
                let header = await this.client.getHeader(newHead)
                let chain = [header]
                let top = this.head
                while (header.height > top.height + 1) {
                    header = await this.client.getHeader(header.parentHash)
                    chain.push(header)
                }
                while (top.hash != header.parentHash) {
                    header = await this.client.getHeader(header.parentHash)
                    chain.push(header)
                    this.rollback(top)
                    top = assertNotNull(top.parent)
                }
                chain = chain.reverse()
                this.head = top
                for (let {hash} of chain) {
                    let block = await this.fetchBlock(hash)
                    block.parent = this.head
                    this.processBlock(block)
                    this.head = block
                }
            }
        }
    }

    private processBlock(block: Block): void {
        for (let task of block.tasks) {
            let handle = this.taskProcessor.submit(task.taskId, task.taskSpec)
            if (handle == null) {
                this.log.error({
                    taskId: task.taskId
                }, `skipping the task, because there are too many in the queue already`)
            } else {
                handle.result.then(res => this.submitTaskResult(task, res)).catch(err => this.log.error(err))
                task.handle = handle
            }
        }
    }

    private rollback(block: Block): void {
        for (let task of block.tasks) {
            task.handle?.cancel()
        }
    }

    private async fetchBlock(blockHash: string): Promise<Block> {
        let [header, timestamp, events] = await Promise.all([
            this.client.getHeader(blockHash),
            this.client.getTimestamp(blockHash),
            this.client.getEvents(blockHash)
        ])

        let tasks: TaskItem[] = []

        let block: Block = {
            height: header.height,
            hash: header.hash,
            parentHash: header.parentHash,
            timestamp,
            tasks
        }

        events.forEach(e => {
            if (e.__kind == 'Worker.RunTask' && toBuffer(e.workerId).equals(this.identity.getPublicKey())) {
                tasks.push({
                    taskId: e.taskId,
                    taskSpec: e.taskSpec,
                })
            }
        })

        this.log.info({
            blockHash,
            blockHeight: block.height,
            tasks: tasks.map(t => t.taskId)
        }, 'new block')

        return block
    }

    private async submitTaskResult({taskId}: TaskItem, taskResult: TaskResult): Promise<void> {
        let tx = await this.client.send({
            call: {__kind: 'Worker.done', taskId, taskResult},
            author: this.identity
        })
        this.log.info({taskId, tx}, 'result submitted')
    }

    private async trackFinalizedBlocks() {
        let last = await this.client.getFinalizedHead()
        while (this.running) {
            await wait(5000)
            let newHead = await this.client.getFinalizedHead()
            if (newHead != last)  {
                last = newHead
                let top: Block | undefined = this.head
                while (top && top.hash != newHead) {
                    top = top.parent
                }
                if (top) {
                    assert(top.hash == newHead)
                    top.parent = undefined
                }
            }
        }
    }

    @def
    async run(): Promise<void> {
        try {
            await this.register()
            await Promise.race([
                this.loop(),
                this.trackFinalizedBlocks()
            ])
        } finally {
            this.running = false
        }
    }

    private async register(): Promise<void> {
        let tx = await this.client.send({
            call: {
                __kind: 'Worker.register',
                spec: {
                    numCpuCores: 1,
                    memoryBytes: 2048n,
                    storageBytes: 10n * 1024n * 1024n
                },
                isOnline: true
            },
            author: this.identity
        })
        this.log.info({tx}, `worker registration submitted`)
    }

    close(): void {
        this.running = false
    }
}
