import {unexpectedCase} from '@subsquid/util-internal'
import {Progress, Speed} from '@subsquid/util-internal-counters'
import {toHex} from '@subsquid/util-internal-hex'
import assert from 'assert'
import * as pg from 'pg'
import {Block, BlockData, Call, Event, Extrinsic, Metadata, Warning} from './model'
import {formatId} from './parse/util'
import {toJSON, toJsonString} from './util'
import WritableStream = NodeJS.WritableStream


export interface Sink {
    write(block: BlockData): Promise<void>
}


export interface PostgresSinkOptions {
    db: pg.ClientBase
    batchSize?: number
    speed?: Speed
    progress?: Progress
}


interface FrontierEvmLog {
    event_id: string
    contract: string
    topic0: string
    topic1?: string
    topic2?: string
    topic3?: string
}


interface FrontierEthereumTransaction {
    call_id: string
    contract: string
    sighash?: string
}


interface GearMessage {
    event_id: string
    program: string
}


interface ContractsContractEmitted {
    event_id: string
    contract: string
}


interface AcalaEvmEvent {
    event_id: string
    contract: string
}


interface AcalaEvmLog {
    id: string
    event_id: string
    event_contract: string
    contract: string
    topic0?: string
    topic1?: string
    topic2?: string
    topic3?: string
}


export class PostgresSink implements Sink {
    private metadataInsert = new Insert<Metadata>('metadata', {
        id: {cast: 'text'},
        spec_name: {cast: 'text'},
        spec_version: {cast: 'int'},
        block_height: {cast: 'int'},
        block_hash: {cast: 'text'},
        hex: {cast: 'text'}
    }, true)

    private headerInsert = new Insert<Block>('block', {
        id: {cast: 'text'},
        height: {cast: 'int'},
        hash: {cast: 'text'},
        parent_hash: {cast: 'text'},
        state_root: {cast: 'text'},
        extrinsics_root: {cast: 'text'},
        timestamp: {cast: 'timestamptz'},
        spec_id: {cast: 'text'},
        validator: {cast: 'text'}
    })

    private extrinsicInsert = new Insert<Extrinsic>('extrinsic', {
        id: {cast: 'text'},
        block_id: {cast: 'text'},
        index_in_block: {cast: 'integer'},
        version: {cast: 'integer'},
        signature: {map: toJsonString, cast: 'jsonb'},
        call_id: {cast: 'text'},
        fee: {cast: 'numeric'},
        tip: {cast: 'numeric'},
        success: {cast: 'bool'},
        error: {map: toJsonString, cast: 'jsonb'},
        pos: {cast: 'int'},
        hash: {cast: 'text', map: toJSON}
    })

    private callInsert = new Insert<Call>('call', {
        id: {cast: 'text'},
        parent_id: {cast: 'text'},
        block_id: {cast: 'text'},
        extrinsic_id: {cast: 'text'},
        origin: {map: toJsonString, cast: 'jsonb'},
        name: {cast: 'text'},
        args: {map: toJsonString, cast: 'jsonb'},
        success: {cast: 'bool'},
        error: {map: toJsonString, cast: 'jsonb'},
        pos: {cast: 'int'}
    })

    private eventInsert = new Insert<Event>('event', {
        id: {cast: 'text'},
        block_id: {cast: 'text'},
        index_in_block: {cast: 'int'},
        phase: {cast: 'text'},
        extrinsic_id: {cast: 'text'},
        call_id: {cast: 'text'},
        name: {cast: 'text'},
        args: {map: toJsonString, cast: 'jsonb'},
        pos: {cast: 'int'}
    })

    private warningInsert = new Insert<Warning>('warning', {
        block_id: {cast: 'text'},
        message: {cast: 'text'}
    })

    private frontierEvmLogInsert = new Insert<FrontierEvmLog>('frontier_evm_log', {
        event_id: {cast: 'text'},
        contract: {cast: 'text'},
        topic0: {cast: 'text'},
        topic1: {cast: 'text'},
        topic2: {cast: 'text'},
        topic3: {cast: 'text'}
    })

    private frontierEthereumTransactionInsert = new Insert<FrontierEthereumTransaction>('frontier_ethereum_transaction', {
        call_id: {cast: 'text'},
        contract: {cast: 'text'},
        sighash: {cast: 'text'}
    })

    private contractsContractEmittedInsert = new Insert<ContractsContractEmitted>('contracts_contract_emitted', {
        event_id: {cast: 'text'},
        contract: {cast: 'text'}
    })

    private gearMessageEnqueuedInsert = new Insert<GearMessage>('gear_message_enqueued', {
        event_id: {cast: 'text'},
        program: {cast: 'text'}
    })

    private gearUserMessageSentInsert = new Insert<GearMessage>('gear_user_message_sent', {
        event_id: {cast: 'text'},
        program: {cast: 'text'}
    })

    private acalaEvmExecutedInsert = new Insert<AcalaEvmEvent>('acala_evm_executed', {
        event_id: {cast: 'text'},
        contract: {cast: 'text'}
    })

    private acalaEvmExecutedLogInsert = new Insert<AcalaEvmLog>('acala_evm_executed_log', {
        id: {cast: 'text'},
        event_id: {cast: 'text'},
        event_contract: {cast: 'text'},
        contract: {cast: 'text'},
        topic0: {cast: 'text'},
        topic1: {cast: 'text'},
        topic2: {cast: 'text'},
        topic3: {cast: 'text'}
    })

    private acalaEvmExecutedFailedInsert = new Insert<AcalaEvmEvent>('acala_evm_executed_failed', {
        event_id: {cast: 'text'},
        contract: {cast: 'text'}
    })

    private acalaEvmExecutedFailedLogInsert = new Insert<AcalaEvmLog>('acala_evm_executed_failed_log', {
        id: {cast: 'text'},
        event_id: {cast: 'text'},
        event_contract: {cast: 'text'},
        contract: {cast: 'text'},
        topic0: {cast: 'text'},
        topic1: {cast: 'text'},
        topic2: {cast: 'text'},
        topic3: {cast: 'text'}
    })

    private db: pg.ClientBase
    private speed?: Speed
    private progress?: Progress
    private batchSize: number

    constructor(options: PostgresSinkOptions) {
        this.db = options.db
        this.speed = options.speed
        this.progress = options.progress
        this.batchSize = options.batchSize ?? 20
    }

    async write(block: BlockData): Promise<void> {
        if (block.metadata) {
            this.metadataInsert.add(block.metadata)
        }
        this.headerInsert.add(block.header)
        this.extrinsicInsert.addMany(block.extrinsics)
        this.insertCalls(block.calls)
        this.insertEvents(block.events)
        if (block.warnings) {
            this.warningInsert.addMany(block.warnings)
        }
        if (block.last || this.headerInsert.size >= this.batchSize) {
            await this.submit(block.header.height)
        }
    }

    private insertEvents(events: Event[]): void {
        let executedLogIndex = 0;
        let executedFailedLogIndex = 0;

        for (let event of events) {
            this.eventInsert.add(event)
            switch(event.name) {
                case 'EVM.Log': {
                    let log: {
                        address: Uint8Array,
                        topics: Uint8Array[]
                    } = event.args.address ? event.args : event.args.log
                    this.frontierEvmLogInsert.add({
                        event_id: event.id,
                        contract: toHex(log.address),
                        topic0: log.topics[0] && toHex(log.topics[0]),
                        topic1: log.topics[1] && toHex(log.topics[1]),
                        topic2: log.topics[2] && toHex(log.topics[2]),
                        topic3: log.topics[3] && toHex(log.topics[3])
                    })
                    break
                }
                case 'EVM.Executed':
                    if (this.isAcalaEvmExecuted(event)) {
                        executedLogIndex = this.insertAcalaEvmEvent(
                            event,
                            this.acalaEvmExecutedInsert,
                            this.acalaEvmExecutedLogInsert,
                            executedLogIndex
                        )
                    }
                    break
                case 'EVM.ExecutedFailed':
                    if (this.isAcalaEvmExecuted(event)) {
                        executedFailedLogIndex = this.insertAcalaEvmEvent(
                            event,
                            this.acalaEvmExecutedFailedInsert,
                            this.acalaEvmExecutedFailedLogInsert,
                            executedFailedLogIndex
                        )
                    }
                    break
                case 'Contracts.ContractEmitted':
                    this.contractsContractEmittedInsert.add({
                        event_id: event.id,
                        contract: toHex(event.args.contract)
                    })
                    break
                case 'Gear.MessageEnqueued':
                    this.gearMessageEnqueuedInsert.add({
                        event_id: event.id,
                        program: toHex(event.args.destination)
                    })
                    break
                case 'Gear.UserMessageSent':
                    this.gearUserMessageSentInsert.add({
                        event_id: event.id,
                        program: toHex(event.args.message.source)
                    })
            }
        }
    }

    private insertCalls(calls: Call[]): void {
        for (let call of calls) {
            this.callInsert.add(call)
            switch(call.name) {
                case 'Ethereum.transact':
                    this.insertEthereumTransaction(call)
                    break
            }
        }
    }

    private insertEthereumTransaction(call: Call): void {
        let tx = call.args.transaction.value.action ? call.args.transaction.value : call.args.transaction
        let contract: string
        switch(tx.action?.__kind) {
            case 'Create':
                return
            case 'Call':
                contract = toHex(tx.action.value)
                break
            default:
                throw unexpectedCase(tx.action?.__kind)
        }
        let sighash = toHex(tx.input.subarray(0, 4))
        this.frontierEthereumTransactionInsert.add({
            call_id: call.id,
            contract,
            sighash
        })
    }

    private insertAcalaEvmEvent(event: Event, insert: Insert<AcalaEvmEvent>, logInsert: Insert<AcalaEvmLog>, logIndex: number) {
        let contract = toHex(event.args.contract)
        insert.add({
            event_id: event.id,
            contract
        })

        let height = Number(event.id.slice(0, 10))
        let hash = event.id.slice(18)
        for (let log of event.args.logs) {
            logInsert.add({
                id: formatId(height, hash, logIndex++),
                event_id: event.id,
                event_contract: contract,
                contract: toHex(log.address),
                topic0: log.topics[0] && toHex(log.topics[0]),
                topic1: log.topics[1] && toHex(log.topics[1]),
                topic2: log.topics[2] && toHex(log.topics[2]),
                topic3: log.topics[3] && toHex(log.topics[3]),
            })
        }
        return logIndex
    }

    private async submit(lastBlock: number): Promise<void> {
        this.speed?.start()
        let size = this.headerInsert.size
        let metadataInsert = this.metadataInsert.take()
        let headerInsert = this.headerInsert.take()
        let extrinsicInsert = this.extrinsicInsert.take()
        let callInsert = this.callInsert.take()
        let eventInsert = this.eventInsert.take()
        let warningInsert = this.warningInsert.take()
        let frontierEvmLogInsert = this.frontierEvmLogInsert.take()
        let frontierEthereumTransactionInsert = this.frontierEthereumTransactionInsert.take()
        let contractsContractEmittedInsert = this.contractsContractEmittedInsert.take()
        let gearMessageEnqueuedInsert = this.gearMessageEnqueuedInsert.take()
        let gearUserMessageSentInsert = this.gearUserMessageSentInsert.take()
        let acalaEvmExecutedInsert = this.acalaEvmExecutedInsert.take()
        let acalaEvmExecutedLogInsert = this.acalaEvmExecutedLogInsert.take()
        let acalaEvmExecutedFailedInsert = this.acalaEvmExecutedFailedInsert.take()
        let acalaEvmExecutedFailedLogInsert = this.acalaEvmExecutedFailedLogInsert.take()
        await this.tx(async () => {
            await metadataInsert.query(this.db)
            await headerInsert.query(this.db)
            await extrinsicInsert.query(this.db)
            await callInsert.query(this.db)
            await eventInsert.query(this.db)
            await warningInsert.query(this.db)
            await frontierEvmLogInsert.query(this.db)
            await frontierEthereumTransactionInsert.query(this.db)
            await contractsContractEmittedInsert.query(this.db)
            await gearMessageEnqueuedInsert.query(this.db)
            await gearUserMessageSentInsert.query(this.db)
            await acalaEvmExecutedInsert.query(this.db)
            await acalaEvmExecutedLogInsert.query(this.db)
            await acalaEvmExecutedFailedInsert.query(this.db)
            await acalaEvmExecutedFailedLogInsert.query(this.db)
        })
        if (this.speed || this.progress) {
            let time = process.hrtime.bigint()
            this.speed?.stop(size, time)
            this.progress?.setCurrentValue(lastBlock, time)
        }
    }

    private async tx<T>(cb: () => Promise<T>): Promise<T> {
        await this.db.query('BEGIN')
        try {
            let result = await cb()
            await this.db.query('COMMIT')
            return result
        } catch(e: any) {
            await this.db.query('ROLLBACK').catch(() => {})
            throw e
        }
    }

    private isAcalaEvmExecuted(event: Event) {
        return 'contract' in event.args && 'logs' in event.args
    }
}


type TableColumns<E> = {
    [name in keyof E]: {map?: (val: E[name]) => unknown, cast?: string}
}


class Insert<E> {
    private sql: string
    private columns: Record<string, unknown[]>

    constructor(private table: string, private mapping: TableColumns<E>, ignoreDuplicates?: boolean, sql?: string, columns?: Record<string, unknown[]>) {
        if (sql == null) {
            let names = Object.keys(mapping) as (keyof E)[]
            let args = names.map((name, idx) => {
                let param = '$' + (idx + 1)
                let cast = mapping[name].cast
                if (cast == 'jsonb') { // Cockroach workaround
                    cast = 'text'
                }
                if (cast) {
                    param += '::' + cast + '[]'
                }
                return param
            })
            let cols = names.map(name => {
                let cast = mapping[name].cast
                if (cast == 'jsonb') { // Cockroach workaround
                    return name.toString() + '::jsonb'
                } else {
                    return name
                }
            })
            this.sql = `INSERT INTO ${table} (${names.join(', ')}) SELECT ${cols.join(', ')} FROM unnest(${args.join(', ')}) AS i(${names.join(', ')})`
            if (ignoreDuplicates) {
                this.sql += ' ON CONFLICT DO NOTHING'
            }
        } else {
            this.sql = sql
        }
        this.columns = columns || this.makeColumns()
    }

    async query(db: pg.ClientBase): Promise<void> {
        if (this.size == 0) return
        await db.query(this.sql, Object.values(this.columns))
    }

    add(row: E): void {
        for (let name in this.mapping) {
            let def = this.mapping[name]
            this.columns[name].push(def.map ? def.map(row[name]) : row[name])
        }
    }

    addMany(rows: E[]): void {
        for (let i = 0; i < rows.length; i++) {
            this.add(rows[i])
        }
    }

    get size(): number {
        for (let key in this.columns) {
            let col = this.columns[key]
            return col.length
        }
        return 0
    }

    take(): Insert<E> {
        let insert = new Insert(this.table, this.mapping, undefined, this.sql, this.columns)
        this.columns = this.makeColumns()
        return insert
    }

    private makeColumns(): Record<string, unknown[]> {
        let columns: Record<string, unknown[]> = {}
        for (let name in this.mapping) {
            columns[name] = []
        }
        return columns
    }
}


export interface WritableSinkOptions {
    writable: WritableStream
    speed?: Speed
    progress?: Progress
}


export class WritableSink implements Sink {
    private writable: WritableStream
    private speed?: Speed
    private progress?: Progress
    private error?: Error
    private drainHandle?: {resolve: () => void, reject: (err: Error) => void}

    constructor(options: WritableSinkOptions) {
        this.writable = options.writable
        this.speed = options.speed
        this.progress = options.progress
        this.writable.on('error', this.onError)
        this.writable.on('drain', this.onDrain)
    }

    close(): void {
        this.error = this.error || new Error('Closed')
        this.writable.off('error', this.onError)
        this.writable.off('drain', this.onDrain)
        if (this.drainHandle) {
            this.drainHandle.reject(this.error)
            this.drainHandle = undefined
        }
    }

    async write(block: BlockData): Promise<void> {
        if (this.error) throw this.error
        this.speed?.start()
        this.writable.write(toJsonString(block))
        let wait = !this.writable.write('\n')
        if (wait) {
            await this.drain()
        }
        if (this.speed || this.progress) {
            let time = process.hrtime.bigint()
            this.speed?.stop(1, time)
            this.progress?.setCurrentValue(block.header.height, time)
        }
    }

    private drain(): Promise<void> {
        assert(this.drainHandle == null)
        return new Promise((resolve, reject) => {
            this.drainHandle = {resolve, reject}
        })
    }

    private onDrain = () => {
        if (this.drainHandle) {
            this.drainHandle.resolve()
            this.drainHandle = undefined
        }
    }

    private onError = (err: Error) => {
        this.error = err
        this.close()
    }
}
