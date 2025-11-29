import {createLogger, Logger} from '@subsquid/logger'
import {BlockRef} from '@subsquid/portal-tools'
import {ensureError, Semaphore, waitDrain} from '@subsquid/util-internal'
import assert from 'node:assert'
import {EventEmitter} from 'node:events'
import {ClickhouseClient} from '../clickhouse-client'
import {RingQueue} from './ring-queue'
import {BlockHeader} from './types'


export interface TableOptions {
    lowWaterMark?: number
    highWaterMark?: number
    maxInsertDuration?: number
}


export class TableWriter extends EventEmitter {
    private commitHead?: BlockRef
    private queue = new RowQueue()
    private put = new Semaphore(true)
    private writePromise?: Promise<void>
    private error?: Error
    private uploadAbort = new AbortController()
    private lowWaterMark: number
    private highWaterMark: number
    private maxInsertDuration: number
    private log: Logger

    constructor(
        private clickhouse: ClickhouseClient,
        private table: string,
        options: TableOptions = {}
    ) {
        super()
        this.lowWaterMark = options.lowWaterMark ?? 1024
        this.highWaterMark = options.highWaterMark ?? 16 * 1024
        this.maxInsertDuration = options.maxInsertDuration ?? 16_000

        assert(this.lowWaterMark >= 0)
        assert(this.highWaterMark > 0)
        assert(this.maxInsertDuration > 0)

        this.log = createLogger('clickhouse-writer:table', {
            table: this.table
        })
    }

    getCommitHead(): BlockRef | undefined {
        return this.commitHead
    }

    getLastCommittedBlockNumber(): number {
        return this.commitHead?.number ?? -1
    }

    push(block: BlockHeader, rows: object[]): void {
        this.assertHealth()
        this.queue.push(block, rows)
        if (this.queue.pendingRows > this.highWaterMark) {
            this.put.unready()
            this.startWrite()
        } else if (this.queue.pendingRows >= this.lowWaterMark && this.queue.pendingRows > 0) {
            this.startWrite()
        }
    }

    bump(block: BlockHeader): void {
        this.assertHealth()
        this.queue.bump(block)
    }

    drain(): void | Promise<void> {
        this.assertHealth()
        return this.put.wait()
    }

    abort(err?: Error): void {
        if (this.error) return
        this.fail(err ?? new Error('aborted'))
    }

    private fail(err: Error): void {
        if (this.error) return
        this.error = ensureError(err)
        this.put.reject(err)
        this.uploadAbort.abort()
        this.emit('error', this.error)
    }

    private assertHealth(): void {
        if (this.error) throw this.error
    }

    async flush(): Promise<void> {
        this.assertHealth()
        this.log.debug('flush')
        while (this.writePromise || this.queue.pendingRows > 0) {
            this.startWrite()
            await this.writePromise
            this.assertHealth()
        }
    }

    private startWrite(): void {
        if (this.writePromise) return
        this.writePromise = this.write().then(
            () => {
                this.writePromise = undefined
                if (this.error) return
                if (this.queue.pendingRows >= this.lowWaterMark && this.queue.pendingRows > 0) {
                    this.startWrite()
                }
            },
            err => {
                this.writePromise = undefined
                this.fail(err)
            }
        )
    }

    private async write(): Promise<void> {
        this.log.debug({
            pendingRows: this.queue.pendingRows
        }, 'upload started')

        let start = Date.now()
        let now = start
        let lastCompleteBlock: BlockHeader | undefined
        let rowsWritten = 0

        let upload = this.clickhouse.insert({
            table: this.table,
            format: 'JSONEachRow'
        })

        upload.abortOnSignal(this.uploadAbort.signal)

        while (this.queue.pendingRows > 0 && now - start < this.maxInsertDuration) {
            if (upload.input.writableNeedDrain) {
                await waitDrain(upload.input)
                now = Date.now()
            }

            let e = this.queue.nextRow()
            if (this.queue.pendingRows < this.highWaterMark) {
                this.put.ready()
            }

            upload.input.write(
                serialize(e)
            )

            if (e.isLastInTheBlock) {
                lastCompleteBlock = e.block
            }

            rowsWritten += 1
        }

        upload.input.end()

        if (this.queue.pendingRows == 0) {
            lastCompleteBlock = this.queue.lastSeenBlock
        }

        await upload.result()

        if (lastCompleteBlock) {
            this.commitHead = lastCompleteBlock
        }

        this.log.debug({
            rowsWritten,
            commitHead: this.commitHead,
            pendingRows: this.queue.pendingRows,
        }, 'upload finished')
    }
}


function serialize(e: RowEntry): string {
    return JSON.stringify({
        block_number: e.block.number,
        block_hash: e.block.hash,
        block_timestamp: e.block.timestamp == null ? undefined : new Date(e.block.timestamp * 1000).toISOString(),
        ...e.row
    })
}


interface Block {
    header: BlockHeader
    rows: object[]
}


interface RowEntry {
    block: BlockHeader
    row: object
    isLastInTheBlock: boolean
}


class RowQueue {
    private pending = 0
    private blocks = new RingQueue<Block>(100)
    private current?: Block
    private lastBlock?: BlockHeader

    push(block: BlockHeader, rows: object[]): void {
        this.lastBlock = block
        if (rows.length > 0) {
            this.pending += rows.length
            this.blocks.push({
                header: block,
                rows
            })
        }
    }

    bump(block: BlockHeader): void {
        this.lastBlock = block
    }

    nextRow(): RowEntry {
        while (!this.current?.rows.length) {
            this.current = this.blocks.shift()
            assert(this.current != null, 'there are no rows to write')
            this.current.rows = reverse(this.current.rows)
        }

        this.pending -= 1
        let row = this.current.rows.pop()!
        let block = this.current.header
        let isLastInTheBlock = this.current.rows.length == 0

        return {
            block,
            row,
            isLastInTheBlock
        }
    }

    get pendingRows(): number {
        return this.pending
    }

    get lastSeenBlock(): BlockHeader | undefined {
        return this.lastBlock
    }
}


function reverse<T>(arr: T[]): T[] {
    let rev = new Array(arr.length)
    for (let i = 0; i < rev.length; i++) {
        rev[i] = arr[arr.length - 1 - i]
    }
    return rev
}
