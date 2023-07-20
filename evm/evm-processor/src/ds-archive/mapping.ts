import {addErrorContext} from '@subsquid/util-internal'
import {
    AllFields,
    BlockData,
    BlockHeader,
    DEFAULT_FIELDS,
    FieldSelection,
    Log,
    StateDiff,
    Trace,
    TraceCall,
    TraceCallAction,
    TraceCallResult,
    TraceCreate,
    TraceCreateAction,
    TraceCreateResult,
    TraceReward,
    TraceRewardAction,
    TraceSuicide,
    TraceSuicideAction,
    Transaction
} from '../interfaces/data'
import {formatId} from '../util'
import * as gw from './gateway'


export const NO_LOGS_BLOOM = '0x'+Buffer.alloc(256).toString('hex')


export function mapGatewayBlock(src: gw.BlockData): BlockData<AllFields> {
    try {
        return tryMapGatewayBlock(src)
    } catch(e: any) {
        throw addErrorContext(e, {
            blockHeight: src.header.number,
            blockHash: src.header.hash
        })
    }
}


function tryMapGatewayBlock(src: gw.BlockData): BlockData<AllFields> {
    let header = mapBlockHeader(src.header)

    let block: BlockData<AllFields> = {
        header,
        transactions: [],
        logs: [],
        traces: [],
        stateDiffs: []
    }

    let txIndex = new Map<Transaction['transactionIndex'], Transaction<AllFields>>()

    for (let go of src.transactions || []) {
        let transaction = mapTransaction(header, go)
        txIndex.set(transaction.transactionIndex, transaction)
        block.transactions.push(transaction)
    }

    for (let go of src.logs || []) {
        let log: Log<AllFields> = {
            id: formatId(header.height, header.hash, go.logIndex),
            ...go,
            block: header
        }
        let transaction = txIndex.get(log.transactionIndex)
        if (transaction) {
            log.transaction = transaction
        }
        block.logs.push(log)
    }

    for (let go of src.traces || []) {
        let trace = mapTrace(go)
        trace.block = header
        let transaction = txIndex.get(go.transactionIndex)
        if (transaction) {
            trace.transaction = transaction
        }
        block.traces.push(trace as Trace<AllFields>)
    }

    for (let go of src.stateDiffs || []) {
        let diff: StateDiff<AllFields> = {
            ...go,
            block: header
        }
        let transaction = txIndex.get(go.transactionIndex)
        if (transaction) {
            diff.transaction = transaction
        }
        block.stateDiffs.push(diff)
    }

    return block
}


function mapBlockHeader(src: gw.Block): BlockHeader<AllFields> {
    let header: Partial<BlockHeader<AllFields>> = {
        id: formatId(src.number, src.hash)
    }

    let key: keyof gw.Block
    for (key in src) {
        if (src[key] == null) continue
        switch(key) {
            case 'number':
                header.height = src.number
                break
            case 'timestamp':
                header.timestamp = src.timestamp * 1000
                break
            case 'difficulty':
            case 'totalDifficulty':
            case 'size':
            case 'gasUsed':
            case 'gasLimit':
            case 'baseFeePerGas':
                header[key] = BigInt(src[key]!)
                break
            default:
                header[key] = src[key]
        }
    }

    return header as BlockHeader<AllFields>
}


function mapTransaction(block: BlockHeader<AllFields>, src: gw.Transaction): Transaction<AllFields> {
    let tx: Partial<Transaction<AllFields>> = {
        id: formatId(block.height, block.hash, src.transactionIndex)
    }

    let key: keyof gw.Transaction
    for (key in src) {
        if (src[key] == null) continue
        switch(key) {
            case 'gas':
            case 'gasPrice':
            case 'gasUsed':
            case 'cumulativeGasUsed':
            case 'effectiveGasPrice':
            case 'value':
            case 'v':
            case 'maxFeePerGas':
            case 'maxPriorityFeePerGas':
                tx[key] = BigInt(src[key]!)
                break
            case 'transactionIndex':
            case 'chainId':
            case 'yParity':
            case 'nonce':
            case 'type':
            case 'status':
                tx[key] = src[key]
                break
            default:
                tx[key] = src[key]
        }
    }

    tx.block = block

    return tx as Transaction<AllFields>
}


function mapTrace(src: gw.Trace): Partial<Trace<AllFields>> {
    switch(src.type) {
        case 'create': {
            let {action, result, ...common} = src
            let tr: Partial<TraceCreate<AllFields>> = common
            if (action) {
                tr.action = {} as TraceCreateAction<AllFields>
                let key: keyof TraceCreateAction<AllFields>
                for (key in action) {
                    switch(key) {
                        case 'value':
                        case 'gas':
                            tr.action[key] = BigInt(action[key])
                            break
                        default:
                            tr.action[key] = action[key]
                    }
                }
            }
            if (result) {
                tr.result = {} as TraceCreateResult<AllFields>
                let key: keyof TraceCreateResult<AllFields>
                for (key in result) {
                    switch(key) {
                        case 'gasUsed':
                            tr.result.gasUsed = BigInt(result.gasUsed)
                            break
                        default:
                            tr.result[key] = result[key]
                    }
                }
            }
            return tr
        }
        case 'call': {
            let {action, result, ...common} = src
            let tr: Partial<TraceCall<AllFields>> = common
            if (action) {
                tr.action = {} as TraceCallAction<AllFields>
                let key: keyof TraceCallAction<AllFields>
                for (key in action) {
                    switch(key) {
                        case 'gas':
                            tr.action[key] = BigInt(action[key])
                            break
                        case 'value':
                            let val = action[key]
                            if (val != null) {
                                tr.action[key] = BigInt(val)
                            }
                            break
                        default:
                            tr.action[key] = action[key]
                    }
                }
            }
            if (result) {
                tr.result = {} as TraceCallResult<AllFields>
                let key: keyof TraceCallResult<AllFields>
                for (key in result) {
                    switch(key) {
                        case 'gasUsed':
                            tr.result.gasUsed = BigInt(result.gasUsed)
                            break
                        default:
                            tr.result[key] = result[key]
                    }
                }
            }
            return tr
        }
        case 'reward': {
            let {action, ...common} = src
            let tr: Partial<TraceReward<AllFields>> = common
            if (action) {
                tr.action = {} as TraceRewardAction<AllFields>
                let key: keyof TraceRewardAction<AllFields>
                for (key in action) {
                    switch(key) {
                        case 'value':
                            tr.action.value = BigInt(action.value)
                            break
                        default:
                            tr.action[key] = action[key]
                    }
                }
            }
            return tr
        }
        case 'suicide': {
            let {action, ...common} = src
            let tr: Partial<TraceSuicide<AllFields>> = common
            if (action) {
                tr.action = {} as TraceSuicideAction<AllFields>
                let key: keyof TraceSuicideAction<AllFields>
                for (key in action) {
                    switch(key) {
                        case 'balance':
                            tr.action.balance = BigInt(action.balance)
                            break
                        default:
                            tr.action[key] = action[key]
                    }
                }
            }
            return tr
        }
    }
}


export function withDefaultFields(fields?: FieldSelection): FieldSelection {
    return {
        block: mergeDefaultFields(DEFAULT_FIELDS.block, fields?.block),
        transaction: mergeDefaultFields(DEFAULT_FIELDS.transaction, fields?.transaction),
        log: mergeDefaultFields(DEFAULT_FIELDS.log, fields?.log),
        trace: mergeDefaultFields(DEFAULT_FIELDS.trace, fields?.trace),
        stateDiff: mergeDefaultFields(DEFAULT_FIELDS.stateDiff, fields?.stateDiff)
    }
}


type Selector<Props extends string> = {
    [P in Props]?: boolean
}


function mergeDefaultFields<Props extends string>(
    defaults: Selector<Props>,
    selection?: Selector<Props>
): Selector<Props> {
    let result: Selector<Props> = {...defaults}
    for (let key in selection) {
        if (selection[key] != null) {
            if (selection[key]) {
                result[key] = true
            } else {
                delete result[key]
            }
        }
    }
    return result
}
