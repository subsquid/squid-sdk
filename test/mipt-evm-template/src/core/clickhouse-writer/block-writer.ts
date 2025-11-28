import {createLogger, Logger} from '@subsquid/logger'
import {bisect, ensureError, last, maybeLast, Semaphore, waitDrain} from '@subsquid/util-internal'
import assert from 'node:assert'
import {ClickhouseClient} from '../clickhouse-client'
import {TableOptions, TableWriter} from './table-writer'
import {Block, BlockHeader} from './types'


export class BlockWriter {
    private tables: Record<string, TableWriter> = {}
    private pending: BlockHeader[] = []
    private head?: BlockHeader
    private commitPromise?: Promise<void>
    private error?: Error
    private flushing = false
    private put = new Semaphore(true)
    private uploadAbort = new AbortController()
    private lowWaterMark = 1024
    private highWaterMark = 4096
    private log: Logger

    constructor(
        private clickhouse: ClickhouseClient,
        private database: string,
        tables: Record<string, TableOptions>
    ) {
        this.log = createLogger('clickhouse-writer:block')

        for (let table in tables) {
            let writer = new TableWriter(
                clickhouse,
                database + '.' + table,
                tables[table]
            )
            writer.on('error', err => this.fail(err))
            this.tables[table] = writer
        }
    }

    get isHealthy(): boolean {
        return this.error == null
    }

    push(block: Block): void {
        this.assertHealth()
        if (this.head) {
            assert(this.head.number < block.header.number)
        }
        this.head = block.header
        this.pending.push(block.header)

        try {
            for (let name in block.tables) {
                let writer = this.tables[name]
                if (writer == null) {
                    throw new Error(`table '${name}' does not exist`)
                }
                writer.push(block.header, block.tables[name])
            }

            for (let name in this.tables) {
                this.tables[name].bump(block.header)
            }

        } catch(err: any) {
            this.fail(err)
            throw this.error
        }

        if (this.pending.length >= this.highWaterMark) {
            this.put.unready()
            this.startCommit()
        } else if (this.pending.length >= this.lowWaterMark) {
            this.startCommit()
        }
    }

    drain(): void | Promise<void> {
        this.assertHealth()
        for (let name in this.tables) {
            if (this.tables[name].drain()) return this.waitDrain()
        }
        return this.put.wait()
    }

    private async waitDrain(): Promise<void> {
        try {
            for (let name in this.tables) {
                await this.tables[name].drain()
            }
            await this.put.wait()
        } catch(err: any) {
            throw this.error ?? err
        }
    }

    abort(err?: Error): void {
        if (this.error) return
        this.fail(err ?? new Error('aborted'))
    }

    private fail(err: Error): void {
        if (this.error) return
        this.error = ensureError(err)
        this.put.reject(this.error)
        for (let name in this.tables) {
            let abortError = new Error('aborted')
            this.tables[name].abort(abortError)
        }
        this.uploadAbort.abort()
    }

    private assertHealth(): void {
        if (this.error) throw this.error
    }

    async flush(): Promise<void> {
        this.assertHealth()
        assert(!this.flushing, 'already flushing')
        this.log.debug('flush')
        this.flushing = true
        try {
            while (this.commitPromise || this.pending.length > 0) {
                this.startCommit()
                await this.commitPromise
                this.assertHealth()
            }
        } finally {
            this.flushing = false
        }
    }

    private startCommit(): void {
        if (this.commitPromise) return
        this.commitPromise = this.commit().then(
            () => {
                this.commitPromise = undefined
                if (this.error) return
                if (this.flushing && this.pending.length > 0 || this.pending.length >= this.lowWaterMark) {
                    this.startCommit()
                }
            },
            err => {
                this.commitPromise = undefined
                this.fail(err)
            }
        )
    }

    private async commit(): Promise<void> {
        this.log.debug({pendingBlocks: this.pending.length}, 'commit started')

        if (this.flushing) {
            let flushes: Promise<void>[] = []
            for (let name in this.tables) {
                flushes.push(this.tables[name].flush())
            }
            await Promise.all(flushes)
        } else {
            // flush tables, that haven't been flushed for a long time
            let flushes: Promise<void>[] = []
            for (let name in this.tables) {
                let writer = this.tables[name]
                let pos = this.bisectPendingBlocks(writer.getLastCommittedBlockNumber())
                if (pos * 3 < this.pending.length * 2) {
                    flushes.push(writer.flush())
                }
            }
            await Promise.all(flushes)
        }

        let blocksToCommit: BlockHeader[]
        {
            let commitHeadNumber = last(this.pending).number
            for (let name in this.tables) {
                commitHeadNumber = Math.min(
                    commitHeadNumber,
                    this.tables[name].getLastCommittedBlockNumber()
                )
            }
            let pos = this.bisectPendingBlocks(commitHeadNumber + 1)
            blocksToCommit = this.pending.slice(0, pos)
            this.pending = this.pending.slice(pos)
            if (this.pending.length < this.highWaterMark) {
                this.put.ready()
            }
        }

        this.log.debug(`${blocksToCommit.length} block(s) to commit`)

        let upload = this.clickhouse.insert({
            table: this.database + '.blocks',
            format: 'JSONEachRow'
        })

        upload.abortOnSignal(this.uploadAbort.signal)

        for (let block of blocksToCommit) {
            if (upload.input.writableNeedDrain) {
                await waitDrain(upload.input)
            }
            upload.input.write(JSON.stringify({
                number: block.number,
                hash: block.hash,
                parent_number: block.parentNumber,
                parent_hash: block.parentHash,
                timestamp: block.timestamp == null ? undefined : new Date(block.timestamp * 1000).toISOString()
            }))
        }
        upload.input.end()

        await upload.result()

        this.log.debug({
            commitHead: maybeLast(blocksToCommit),
            pendingBlocks: this.pending.length
        }, 'commit completed')
    }

    private bisectPendingBlocks(blockNumber: number): number {
        return bisect(this.pending, blockNumber, (block, num) => block.number - num)
    }
}
