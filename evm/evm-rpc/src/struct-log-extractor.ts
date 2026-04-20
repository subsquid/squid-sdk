import {RLP} from '@ethereumjs/rlp'
import {hexToBytes} from '@ethereumjs/util'
import {keccak256} from 'ethereum-cryptography/keccak'
import {Bytes20, Bytes32} from './types'


/**
 * Computes the address of a contract deployed by a top-level CREATE
 * transaction: `keccak256(rlp([sender, nonce]))[12:]`. Used to derive the
 * frame-0 address for CREATE txs, which callTracer does not report when the
 * creation ultimately failed.
 */
export function computeCreateAddress(sender: Bytes20, nonce: number): Bytes20 {
    let nonceBytes: Uint8Array
    if (nonce === 0) {
        nonceBytes = new Uint8Array(0)
    } else {
        let hex = nonce.toString(16)
        if (hex.length % 2) hex = '0' + hex
        nonceBytes = hexToBytes(`0x${hex}`)
    }
    let senderBytes = hexToBytes(sender.toLowerCase() as `0x${string}`)
    let hash = keccak256(RLP.encode([senderBytes, nonceBytes]))
    return '0x' + Buffer.from(hash.slice(-20)).toString('hex')
}


// Minimal shape of a single geth-style struct-log entry. Only the fields we
// use are declared — the response carries many more (gas, memory, storage…)
// that we explicitly don't need.
export interface StructLog {
    pc: number
    op: string
    depth: number
    stack?: string[]
}


// Minimal shape of a callTracer frame. Matches the `DebugFrame` validator in
// `rpc-data.ts` but kept local so this module stays independent.
export interface CallFrame {
    type: string
    from: string
    to?: string | null
    calls?: CallFrame[] | null
}


export interface ExtractedLog {
    address: Bytes20
    topics: Bytes32[]
}


/**
 * Reconstructs the logs emitted by `LOG0..LOG4` opcodes in a transaction,
 * *including ones inside frames that later reverted*. Used as a fallback when
 * `callTracer` with `withLog: true` drops logs from reverted frames (notably
 * reverted CREATE frames on older Ethermint).
 *
 * The struct-log stream gives us the exact stack at each LOG opcode (topics
 * come from the stack) but not the executing contract's address. We pull
 * those addresses from the `callTracer` tree, flattened into a list in the
 * order frames are entered — each time the struct-log's depth increases we
 * take the next address off that list.
 *
 * The top-level address (for depth 1) is provided by the caller and is either
 * `tx.to` for CALL-type txs or the computed CREATE address for contract-
 * deployment txs.
 */
export function extractLogsFromStructLog(
    structLogs: StructLog[],
    callTree: CallFrame,
    topLevelAddress: Bytes20
): ExtractedLog[] {
    let topAddress = topLevelAddress.toLowerCase()
    let subFrameAddresses = collectSubFrameAddresses(callTree, topAddress)

    let frameStack: Bytes20[] = [topAddress]
    let out: ExtractedLog[] = []
    let prevDepth = 1
    let nextSubFrameIdx = 0

    for (let entry of structLogs) {
        if (entry.depth > prevDepth) {
            if (nextSubFrameIdx >= subFrameAddresses.length) {
                throw new Error(
                    `struct-log walker: depth increased to ${entry.depth} at pc ${entry.pc} (${entry.op}) but the call tree has no more sub-frames to consume`
                )
            }
            frameStack.push(subFrameAddresses[nextSubFrameIdx++])
        } else if (entry.depth < prevDepth) {
            while (frameStack.length > entry.depth) frameStack.pop()
        }
        prevDepth = entry.depth

        let logMatch = entry.op.match(/^LOG([0-4])$/)
        if (logMatch && entry.stack) {
            let nTopics = parseInt(logMatch[1])
            let topics: Bytes32[] = []
            // LOG opcodes pop (offset, size, topic1 ... topicN). So the first
            // topic sits at stack[len-3] (len-1 is offset, len-2 is size).
            for (let i = 0; i < nTopics; i++) {
                topics.push(toTopic32(entry.stack[entry.stack.length - 3 - i]))
            }
            out.push({
                address: frameStack[frameStack.length - 1],
                topics
            })
        }
    }

    return out
}


/**
 * Depth-first pre-order walk of the call tree (skipping the root), collecting
 * the executing-contract address of every sub-frame. For DELEGATECALL and
 * CALLCODE the executing address is the parent's; for every other frame type
 * (CALL, STATICCALL, CREATE, CREATE2) it's the frame's `to` field.
 */
function collectSubFrameAddresses(root: CallFrame, rootAddress: Bytes20): Bytes20[] {
    let out: Bytes20[] = []

    function dfs(frame: CallFrame, parentAddress: Bytes20): void {
        let executingAddress: Bytes20
        if (frame.type === 'DELEGATECALL' || frame.type === 'CALLCODE') {
            executingAddress = parentAddress
        } else {
            if (!frame.to) {
                throw new Error(
                    `call tree walker: frame of type ${frame.type} has no "to" address - cannot resolve executing contract`
                )
            }
            executingAddress = frame.to.toLowerCase()
        }
        out.push(executingAddress)
        if (Array.isArray(frame.calls)) {
            for (let sub of frame.calls) dfs(sub, executingAddress)
        }
    }

    if (Array.isArray(root.calls)) {
        for (let sub of root.calls) dfs(sub, rootAddress)
    }

    return out
}


function toTopic32(val: string): Bytes32 {
    let h = (val.startsWith('0x') ? val.slice(2) : val).toLowerCase()
    return '0x' + h.padStart(64, '0')
}
