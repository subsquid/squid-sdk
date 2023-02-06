import {Logger} from '@subsquid/logger'
import {assertNotNull, def, wait} from '@subsquid/util-internal'
import assert from 'assert'
import {Client} from './chain/client.js'
import {TaskSpec, TaskResult, TaskId, WorkerInfo, HardwareSpec} from './chain/interface.js'
import {KeyPair} from './chain/keyPair.js'
import {IpfsService, TaskHandle, TaskProcessor} from './taskProcessor.js'
import {toBuffer, xx64concat} from './util.js'
import equal from "fast-deep-equal/es6";

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
    hardwareSpec: HardwareSpec
    client: Client
    log: Logger
    ipfsService?: IpfsService
}


export class Controller {
    private identity: KeyPair
    private hardwareSpec: HardwareSpec
    private client: Client
    private log: Logger
    private head!: Block
    private taskProcessor: TaskProcessor
    private running = true

    constructor(options: ControllerOptions) {
        this.identity = options.identity
        this.hardwareSpec = options.hardwareSpec
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
            let worker_info = await this.getWorkerInfo()
            if (worker_info === null) {
                await this.register()
            } else {
                if (!worker_info.isOnline) {
                    await this.go_online()
                }
                if (!equal(worker_info.spec, this.hardwareSpec)) {
                    await this.update_spec()
                }
            }

            await Promise.race([
                this.loop(),
                this.trackFinalizedBlocks()
            ])
        } finally {
            await this.go_offline()
            this.running = false
        }
    }

    private async getWorkerInfo(): Promise<WorkerInfo> {
        let blockHash = await this.client.getHead()
        let encodedKey = xx64concat(this.identity.getPublicKey())
        return  await this.client.getStorageItem(blockHash, 'Worker', 'Workers', encodedKey)
    }

    private async register(): Promise<void> {
        this.log.info("Registering worker")
        let tx = await this.client.send({
            call: {
                __kind: 'Worker.register',
                spec: this.hardwareSpec,
                isOnline: true
            },
            author: this.identity
        })
        this.log.info({tx}, `Worker registration submitted`)
    }

    private async go_online(): Promise<void> {
        this.log.info("Going online")
        let tx = await this.client.send({
            call: {
                __kind: 'Worker.go_online',
            },
            author: this.identity
        })
        this.log.info({tx}, `Worker go_online submitted`)
    }

    private async go_offline(): Promise<void> {
        this.log.info("Going offline")
        let tx = await this.client.send({
            call: {
                __kind: 'Worker.go_offline',
            },
            author: this.identity
        })
        this.log.info({tx}, `Worker go_offline submitted`)
    }

    private async update_spec(): Promise<void> {
        this.log.info({spec: this.hardwareSpec}, "Updating worker specification")
        let tx = await this.client.send({
            call: {
                __kind: 'Worker.update_spec',
                spec: this.hardwareSpec
            },
            author: this.identity
        })
        this.log.info({tx}, `Specification update submitted`)

    }

    close(): void {
        this.running = false
    }
}
