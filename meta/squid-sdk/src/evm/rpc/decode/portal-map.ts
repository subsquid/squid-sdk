import {Block, FieldSelection} from '@subsquid/evm-stream'
import {evm} from '@subsquid/portal-client'

/**
 * Copied verbatim from `@subsquid/evm-stream` `portal/source.ts` (`mapFieldSelection`,
 * `mapBlock`) — both are module-internal there (not re-exported), so we copy these ~30 lines
 * rather than widening evm-stream's public API. Keeping
 * them identical is what makes the RPC source's output match the Portal source's by reusing
 * the exact same decoder + post-cast mapping.
 */

export function mapFieldSelection(fields: FieldSelection) {
    return {
        block: fields.block,
        transaction: {...fields.transaction, transactionIndex: true},
        log: {...fields.log, logIndex: true, transactionIndex: true},
        trace: {...fields.trace, transactionIndex: true, traceAddress: true},
        stateDiff: {...fields.stateDiff, transactionIndex: true, key: true, address: true},
    } satisfies evm.FieldSelection
}

export type MapFieldSelection = ReturnType<typeof mapFieldSelection>

export function mapBlock<F extends FieldSelection>(rawBlock: evm.Block<MapFieldSelection>): Block<F> {
    let {number, hash, ...hdr} = rawBlock.header
    let header = {
        number,
        hash,
        height: number,
        ...hdr,
    }
    if ('timestamp' in header && typeof header.timestamp === 'number') {
        header.timestamp = header.timestamp * 1000 // convert to ms
    }

    let block: Block<F> = {
        header: header as any,
        transactions: [],
        logs: [],
        traces: [],
        stateDiffs: [],
    }

    for (let {transactionIndex, ...props} of rawBlock.transactions) {
        block.transactions.push({...props, transactionIndex} as any)
    }

    for (let {logIndex, transactionIndex, ...props} of rawBlock.logs) {
        block.logs.push({logIndex, transactionIndex, ...props} as any)
    }

    for (let {transactionIndex, traceAddress, type, ...props} of rawBlock.traces) {
        block.traces.push({transactionIndex, traceAddress, type, ...props} as any)
    }

    for (let {transactionIndex, address, key, kind, ...props} of rawBlock.stateDiffs) {
        block.stateDiffs.push({transactionIndex, address, key, kind, ...props} as any)
    }

    return block
}
