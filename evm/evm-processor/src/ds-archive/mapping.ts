import {assertNotNull, unexpectedCase} from '@subsquid/util-internal'
import {cast, type GetCastType} from '@subsquid/util-internal-validation'
import {FieldSelection} from '../interfaces/data'
import {
    Block,
    BlockHeader,
    Log,
    StateDiff,
    StateDiffAdd,
    StateDiffChange,
    StateDiffDelete,
    StateDiffNoChange,
    Trace,
    TraceCall,
    TraceCreate,
    TraceReward,
    TraceSuicide,
    Transaction,
} from '../mapping/entities'
import {setUpRelations} from '../mapping/relations'
import {getBlockValidator} from './schema'

export function mapBlock(rawBlock: unknown, fields: FieldSelection, forPortal?: boolean): Block {
    let validator = getBlockValidator(fields)

    let src = forPortal ? rawBlock as GetCastType<typeof validator> : cast(validator, rawBlock)

    let {number, hash, parentHash, ...hdr} = src.header
    if (hdr.timestamp) {
        hdr.timestamp = hdr.timestamp * 1000 // convert to ms
    }

    let header = new BlockHeader(number, hash, parentHash)
    Object.assign(header, hdr)

    let block = new Block(header)

    if (src.transactions) {
        for (let {transactionIndex, ...props} of src.transactions) {
            let tx = new Transaction(header, transactionIndex)
            Object.assign(tx, props)
            block.transactions.push(tx)
        }
    }

    if (src.logs) {
        for (let {logIndex, transactionIndex, ...props} of src.logs) {
            let log = new Log(header, logIndex, transactionIndex)
            Object.assign(log, props)
            block.logs.push(log)
        }
    }

    if (src.traces) {
        for (let {transactionIndex, traceAddress, type, ...props} of src.traces) {
            transactionIndex = assertNotNull(transactionIndex)
            let trace: Trace
            switch (type) {
                case 'create':
                    trace = new TraceCreate(header, transactionIndex, traceAddress)
                    break
                case 'call':
                    trace = new TraceCall(header, transactionIndex, traceAddress)
                    break
                case 'suicide':
                    trace = new TraceSuicide(header, transactionIndex, traceAddress)
                    break
                case 'reward':
                    trace = new TraceReward(header, transactionIndex, traceAddress)
                    break
                default:
                    throw unexpectedCase()
            }
            Object.assign(trace, props)
            block.traces.push(trace)
        }
    }

    if (src.stateDiffs) {
        for (let {transactionIndex, address, key, kind, ...props} of src.stateDiffs) {
            let diff: StateDiff
            switch (kind) {
                case '=':
                    diff = new StateDiffNoChange(header, transactionIndex, address, key)
                    break
                case '+':
                    diff = new StateDiffAdd(header, transactionIndex, address, key)
                    break
                case '*':
                    diff = new StateDiffChange(header, transactionIndex, address, key)
                    break
                case '-':
                    diff = new StateDiffDelete(header, transactionIndex, address, key)
                    break
                default:
                    throw unexpectedCase()
            }
            Object.assign(diff, props)
            block.stateDiffs.push(diff)
        }
    }

    setUpRelations(block)

    return block
}
