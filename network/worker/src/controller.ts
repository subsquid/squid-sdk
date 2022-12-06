import {Logger} from '@subsquid/logger'
import {assertNotNull, def, wait} from '@subsquid/util-internal'
import assert from 'assert'
import {Client} from './chain/client'
import {Task} from './chain/interface'
import {KeyPair} from './chain/keyPair'
import {toBuffer} from './util'


interface Block {
    height: number
    hash: string
    parentHash: string
    parent?: Block
    timestamp: number
    tasks: TaskState[]
}


interface TaskState {
    task: Task
    block: Block
    pid?: number
}


export interface ControllerOptions {
    identity: KeyPair
    client: Client
    log: Logger
}


export class Controller {
    private identity: KeyPair
    private client: Client
    private log: Logger
    private head!: Block
    private running = true

    constructor(options: ControllerOptions) {
        this.identity = options.identity
        this.client = options.client
        this.log = options.log
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
                    await this.processBlock(block)
                    this.head = block
                }
            }
        }
    }

    private async processBlock(block: Block): Promise<void> {

    }

    private rollback(block: Block): void {

    }

    private async fetchBlock(blockHash: string): Promise<Block> {
        let [header, timestamp, events] = await Promise.all([
            this.client.getHeader(blockHash),
            this.client.getTimestamp(blockHash),
            this.client.getEvents(blockHash)
        ])

        let tasks: TaskState[] = []

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
                    task: e.task,
                    block
                })
            }
        })

        this.log.info({
            blockHash,
            blockHeight: block.height,
            tasks: tasks.map(t => t.task.taskId)
        }, 'new block')

        return block
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
            await Promise.race([
                this.loop(),
                this.trackFinalizedBlocks()
            ])
        } finally {
            this.running = false
        }
    }

    async register(): Promise<void> {
        let tx = await this.client.send({
            call: {__kind: 'Worker.register'},
            author: this.identity
        })
        this.log.info(`registered itself in transaction ${tx}`)
    }
}
