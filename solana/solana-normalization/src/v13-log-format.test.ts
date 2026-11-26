import type * as rpc from '@subsquid/solana-rpc-data'
import {describe, expect, it} from 'vitest'
import {Block, Instruction, LogMessage} from './data'
import {MessageStream} from './instruction-parser'
import {getBlockLogFormat, Journal, mapRpcBlock, MapRpcBlockOptions} from './mapping'


const SYSTEM = '11111111111111111111111111111111'
const TOKEN = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
const PROG = 'EUqojwWA2rd19FZrzeBncJsm38Jm1hEhE3zsmX3bRc2o'
const PROG2 = '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin'


interface Ins {
    program: string
    inner?: string[]
}


interface TxSpec {
    instructions: Ins[]
    logs: string[] | null
    err?: unknown
    /**
     * Set `stackHeight` of inner instructions (modern data has it, old data doesn't)
     */
    stackHeights?: number[][]
}


function tx(spec: TxSpec, index: number): rpc.Transaction {
    let accountKeys = ['payer' + index, SYSTEM, TOKEN, PROG, PROG2]
    let acc = (program: string) => {
        let i = accountKeys.indexOf(program)
        if (i < 0) throw new Error(`unknown program ${program}`)
        return i
    }
    return {
        version: 'legacy',
        transaction: {
            signatures: ['sig' + index],
            message: {
                accountKeys,
                header: {numReadonlySignedAccounts: 0, numReadonlyUnsignedAccounts: 4, numRequiredSignatures: 1},
                recentBlockhash: 'hash',
                instructions: spec.instructions.map(ins => ({
                    accounts: [0],
                    data: '1',
                    programIdIndex: acc(ins.program),
                    stackHeight: null
                }))
            }
        },
        meta: {
            err: spec.err ?? null,
            fee: 5000,
            preBalances: accountKeys.map(() => 1),
            postBalances: accountKeys.map(() => 1),
            logMessages: spec.logs,
            innerInstructions: spec.instructions.flatMap((ins, i) => {
                if (!ins.inner?.length) return []
                return [{
                    index: i,
                    instructions: ins.inner.map((program, j) => ({
                        accounts: [0],
                        data: '1',
                        programIdIndex: acc(program),
                        stackHeight: spec.stackHeights?.[i][j] ?? null
                    }))
                }]
            })
        }
    } as rpc.Transaction
}


interface Journaled {
    block: Block
    warnings: string[]
    errors: string[]
}


function map(...txs: TxSpec[]): Journaled {
    return mapWith({}, ...txs)
}


function mapWith(options: MapRpcBlockOptions, ...txs: TxSpec[]): Journaled {
    let warnings: string[] = []
    let errors: string[] = []
    let journal: Journal = {
        warn(props: any, msg: string) {
            warnings.push(msg)
        },
        error(props: any, msg: string) {
            errors.push(msg)
        }
    }
    let src: rpc.GetBlock = {
        blockHeight: 1,
        blockTime: 1,
        blockhash: 'hash',
        parentSlot: 0,
        previousBlockhash: 'parent',
        transactions: txs.map(tx)
    }
    let block = mapRpcBlock(1, src, journal, options)
    return {block, warnings, errors}
}


function instructions(block: Block, transactionIndex = 0) {
    return block.instructions.filter(i => i.transactionIndex == transactionIndex).map((i: Instruction) => ({
        address: i.instructionAddress,
        program: i.programId,
        error: i.error,
        cu: i.computeUnitsConsumed,
        dropped: i.hasDroppedLogMessages
    }))
}


function logs(block: Block, transactionIndex = 0) {
    return block.logs.filter(l => l.transactionIndex == transactionIndex).map((l: LogMessage) => ({
        logIndex: l.logIndex,
        address: l.instructionAddress,
        program: l.programId,
        kind: l.kind,
        message: l.message
    }))
}


const NESTED_CPI_LOGS = [
    `Call BPF program ${PROG}`,
    `Call BPF program ${TOKEN}`,
    'Program log: Instruction: Transfer',
    'BPF program consumed 4759 of 189901 units',
    `BPF program ${TOKEN} success`,
    `Call BPF program ${TOKEN}`,
    'Program log: Instruction: Transfer',
    'BPF program consumed 4759 of 183090 units',
    `BPF program ${TOKEN} success`,
    'BPF program consumed 22411 of 200000 units',
    `BPF program ${PROG} success`,
]


describe('v1.3 log format', () => {
    it('detects the format and restores stack heights from bracket depth', () => {
        let stream = new MessageStream(NESTED_CPI_LOGS)
        expect(stream.format).toBe('v1.3')
        expect(stream.nativeProgramsAreSilent).toBe(true)
        expect(new MessageStream([`Program ${PROG} invoke [1]`, `Program ${PROG} success`]).format).toBe('modern')
        expect(new MessageStream([]).format).toBe('unknown')
    })

    it('nested CPI', () => {
        let {block, warnings, errors} = map({
            instructions: [{program: PROG, inner: [TOKEN, TOKEN]}],
            logs: NESTED_CPI_LOGS
        })
        expect(warnings).toEqual([])
        expect(errors).toEqual([])
        expect(instructions(block)).toEqual([
            {address: [0], program: PROG, error: undefined, cu: 22411n, dropped: false},
            {address: [0, 0], program: TOKEN, error: undefined, cu: 4759n, dropped: false},
            {address: [0, 1], program: TOKEN, error: undefined, cu: 4759n, dropped: false},
        ])
        expect(logs(block)).toEqual([
            {logIndex: 2, address: [0, 0], program: TOKEN, kind: 'log', message: 'Instruction: Transfer'},
            {logIndex: 6, address: [0, 1], program: TOKEN, kind: 'log', message: 'Instruction: Transfer'},
        ])
        expect(block.transactions[0].hasDroppedLogMessages).toBe(false)
    })

    it('failed call with error', () => {
        let {block, warnings, errors} = map({
            instructions: [{program: PROG, inner: [TOKEN]}],
            logs: [
                `Call BPF program ${PROG}`,
                'Program log: swap',
                `Call BPF program ${TOKEN}`,
                'Program log: Instruction: Transfer',
                'Program log: Error: insufficient funds',
                'BPF program consumed 3000 of 190000 units',
                `BPF program ${TOKEN} failed: custom program error: 0x1`,
                'BPF program consumed 13000 of 200000 units',
                `BPF program ${PROG} failed: custom program error: 0x1`,
            ],
            err: {InstructionError: [0, {Custom: 1}]}
        })
        expect(warnings).toEqual([])
        expect(errors).toEqual([])
        expect(instructions(block)).toEqual([
            {address: [0], program: PROG, error: 'custom program error: 0x1', cu: 13000n, dropped: false},
            {address: [0, 0], program: TOKEN, error: 'custom program error: 0x1', cu: 3000n, dropped: false},
        ])
        expect(logs(block).map(l => [l.address, l.message])).toEqual([
            [[0], 'swap'],
            [[0, 0], 'Instruction: Transfer'],
            [[0, 0], 'Error: insufficient funds'],
        ])
    })

    it('missing compute units messages', () => {
        let {block, warnings, errors} = map({
            instructions: [{program: PROG, inner: [TOKEN]}, {program: PROG2}],
            logs: [
                `Call BPF program ${PROG}`,
                `Call BPF program ${TOKEN}`,
                'Program log: Instruction: Transfer',
                `BPF program ${TOKEN} success`,
                `BPF program ${PROG} success`,
                `Call BPF program ${PROG2}`,
                'Program log: hello',
                `BPF program ${PROG2} success`,
            ]
        })
        expect(warnings).toEqual([])
        expect(errors).toEqual([])
        expect(instructions(block)).toEqual([
            {address: [0], program: PROG, error: undefined, cu: undefined, dropped: false},
            {address: [0, 0], program: TOKEN, error: undefined, cu: undefined, dropped: false},
            {address: [1], program: PROG2, error: undefined, cu: undefined, dropped: false},
        ])
        expect(logs(block).map(l => [l.address, l.program, l.message])).toEqual([
            [[0, 0], TOKEN, 'Instruction: Transfer'],
            [[1], PROG2, 'hello'],
        ])
    })

    it('native program instructions and inner instructions have no log messages', () => {
        let {block, warnings, errors} = map({
            instructions: [
                {program: SYSTEM},
                {program: PROG, inner: [SYSTEM, TOKEN, SYSTEM]},
                {program: SYSTEM},
            ],
            logs: [
                `Call BPF program ${PROG}`,
                'Program log: before',
                `Call BPF program ${TOKEN}`,
                'Program log: Instruction: InitializeAccount',
                'BPF program consumed 3000 of 190000 units',
                `BPF program ${TOKEN} success`,
                'Program log: after',
                'BPF program consumed 20000 of 200000 units',
                `BPF program ${PROG} success`,
            ]
        })
        expect(warnings).toEqual([])
        expect(errors).toEqual([])
        expect(instructions(block)).toEqual([
            {address: [0], program: SYSTEM, error: undefined, cu: undefined, dropped: false},
            {address: [1], program: PROG, error: undefined, cu: 20000n, dropped: false},
            {address: [1, 0], program: SYSTEM, error: undefined, cu: undefined, dropped: false},
            {address: [1, 1], program: TOKEN, error: undefined, cu: 3000n, dropped: false},
            {address: [1, 2], program: SYSTEM, error: undefined, cu: undefined, dropped: false},
            {address: [2], program: SYSTEM, error: undefined, cu: undefined, dropped: false},
        ])
        expect(logs(block).map(l => [l.address, l.message])).toEqual([
            [[1], 'before'],
            [[1, 1], 'Instruction: InitializeAccount'],
            [[1], 'after'],
        ])
    })

    it('failed transaction, whose failed call never logged', () => {
        let {block, warnings, errors} = map({
            instructions: [{program: PROG}, {program: PROG2}, {program: PROG}],
            logs: [
                `Call BPF program ${PROG}`,
                'BPF program consumed 1000 of 200000 units',
                `BPF program ${PROG} success`,
            ],
            err: {InstructionError: [1, 'InvalidAccountData']}
        })
        expect(warnings).toEqual([])
        expect(errors).toEqual([])
        expect(instructions(block)).toEqual([
            {address: [0], program: PROG, error: undefined, cu: 1000n, dropped: false},
            {address: [1], program: PROG2, error: undefined, cu: undefined, dropped: false},
            // was not executed
            {address: [2], program: PROG, error: undefined, cu: undefined, dropped: false},
        ])
    })

    it('transaction without log messages inherits the format of the block', () => {
        let {block, warnings, errors} = map(
            {
                instructions: [{program: PROG}],
                logs: [`Call BPF program ${PROG}`, `BPF program ${PROG} success`]
            },
            {
                instructions: [{program: SYSTEM}, {program: SYSTEM}],
                logs: []
            },
            {
                instructions: [{program: SYSTEM}],
                logs: [],
                err: {InstructionError: [0, {Custom: 1}]}
            }
        )
        expect(warnings).toEqual([])
        expect(errors).toEqual([])
        expect(instructions(block, 1).map(i => i.dropped)).toEqual([false, false])
        expect(instructions(block, 2).map(i => i.dropped)).toEqual([false])
    })

    it('transaction without log messages does not get v1.3 rules outside of a v1.3 block', () => {
        let {block, warnings} = map({
            instructions: [{program: SYSTEM}],
            logs: []
        })
        expect(warnings).toEqual(['unexpected end of message log'])
        expect(instructions(block).map(i => i.dropped)).toEqual([true])
    })

    it('compute units message outside of any call is a parsing error', () => {
        let {block, warnings, errors} = map({
            instructions: [{program: PROG}],
            logs: [
                'BPF program consumed 1000 of 200000 units',
                `Call BPF program ${PROG}`,
                `BPF program ${PROG} success`,
            ]
        })
        // PROG logs its calls, so its call without a leading invoke message is reported as in the modern format
        expect(warnings).toEqual(['missing invoke message'])
        expect(errors).toEqual(['not all log messages where consumed'])
        expect(block.transactions[0].hasDroppedLogMessages).toBe(true)
        expect(block.logs).toEqual([])
    })

    it('mismatched brackets is a parsing error', () => {
        let {block, errors} = map({
            instructions: [{program: PROG, inner: [TOKEN]}],
            logs: [
                `Call BPF program ${PROG}`,
                `Call BPF program ${TOKEN}`,
                `BPF program ${PROG} success`,
                `BPF program ${TOKEN} success`,
            ]
        })
        expect(errors).toEqual(['invoke result message and instruction program ids don\'t match'])
        expect(block.transactions[0].hasDroppedLogMessages).toBe(true)
    })

    it('block with a modern transaction does not lend v1.3 rules to log-less transactions', () => {
        let {warnings} = map(
            {
                instructions: [{program: PROG}],
                logs: [`Call BPF program ${PROG}`, `BPF program ${PROG} success`]
            },
            {
                instructions: [{program: PROG}],
                logs: [`Program ${PROG} invoke [1]`, `Program ${PROG} success`]
            },
            {
                instructions: [{program: SYSTEM}],
                logs: []
            }
        )
        expect(warnings).toEqual(['unexpected end of message log'])
    })

    it('a block without any format uses the caller\'s hint', () => {
        // a native-only block (e.g. votes only): no structural messages anywhere
        let spec = {instructions: [{program: SYSTEM}], logs: []}
        let plain = map(spec)
        expect(plain.warnings).toEqual(['unexpected end of message log'])
        expect(instructions(plain.block).map(i => i.dropped)).toEqual([true])

        let hinted = mapWith({logFormat: 'v1.3'}, spec)
        expect(hinted.warnings).toEqual([])
        expect(instructions(hinted.block).map(i => i.dropped)).toEqual([false])
    })

    it('the block\'s own format wins over the hint', () => {
        let {warnings, block} = mapWith(
            {logFormat: 'v1.3'},
            {instructions: [{program: SYSTEM}], logs: []},
            {
                instructions: [{program: PROG}],
                logs: [`Program ${PROG} invoke [1]`, `Program ${PROG} success`]
            }
        )
        expect(warnings).toEqual(['unexpected end of message log'])
        expect(instructions(block, 0).map(i => i.dropped)).toEqual([true])
    })

    it('getBlockLogFormat', () => {
        let block = (...logs: (string[] | null)[]) => ({
            blockHeight: 1, blockTime: 1, blockhash: 'h', parentSlot: 0, previousBlockhash: 'p',
            transactions: logs.map((l, i) => tx({instructions: [{program: SYSTEM}], logs: l}, i))
        }) as rpc.GetBlock
        expect(getBlockLogFormat(block([], null))).toBeUndefined()
        expect(getBlockLogFormat(block([], NESTED_CPI_LOGS))).toBe('v1.3')
        expect(getBlockLogFormat(block(NESTED_CPI_LOGS, [`Program ${PROG} invoke [1]`, `Program ${PROG} success`]))).toBe('modern')
    })

    it('a program, that logs its calls in the block, is not silent where its log is missing', () => {
        let {block, warnings} = map(
            {instructions: [{program: PROG, inner: [TOKEN, TOKEN]}], logs: NESTED_CPI_LOGS},
            // the same BPF program, its log lost entirely
            {instructions: [{program: PROG}], logs: []},
            // a native program stays silent
            {instructions: [{program: SYSTEM}], logs: []}
        )
        expect(warnings).toEqual(['unexpected end of message log'])
        expect(instructions(block, 1).map(i => i.dropped)).toEqual([true])
        expect(instructions(block, 2).map(i => i.dropped)).toEqual([false])
    })

    it('a missing inner call of a logging program is reported', () => {
        let {block, warnings} = map({
            instructions: [{program: PROG, inner: [TOKEN, TOKEN]}],
            logs: [
                `Call BPF program ${PROG}`,
                `Call BPF program ${TOKEN}`,
                `BPF program ${TOKEN} success`,
                // the second Token call is not logged
                `BPF program ${PROG} success`,
            ]
        })
        expect(warnings).toEqual(['missing invoke message for inner instruction'])
        expect(instructions(block).map(i => i.dropped)).toEqual([false, false, true])
    })

    it('inner instructions under a call without log messages share its flag', () => {
        // the top-level call failed before it was invoked: nothing logged, inner instructions follow it
        let silent = map(
            {instructions: [{program: PROG2, inner: [SYSTEM]}], logs: [], err: {InstructionError: [0, {Custom: 1}]}},
            {instructions: [{program: PROG}], logs: [`Call BPF program ${PROG}`, `BPF program ${PROG} success`]}
        )
        expect(silent.warnings).toEqual([])
        expect(instructions(silent.block, 0).map(i => i.dropped)).toEqual([false, false])

        // the same with a program known to log its calls: a missing log, the inner instruction is flagged too
        let lost = map(
            {instructions: [{program: PROG, inner: [SYSTEM]}], logs: []},
            {instructions: [{program: PROG}], logs: [`Call BPF program ${PROG}`, `BPF program ${PROG} success`]}
        )
        expect(lost.warnings).toEqual(['unexpected end of message log'])
        expect(instructions(lost.block, 0).map(i => i.dropped)).toEqual([true, true])
    })

    it('a call without an instruction left to match falls back instead of throwing', () => {
        let {block, errors} = map({
            instructions: [{program: PROG}],
            logs: [
                `Call BPF program ${PROG}`,
                `Call BPF program ${TOKEN}`,
                `BPF program ${TOKEN} success`,
                `BPF program ${PROG} success`,
            ]
        })
        expect(errors).toEqual(['invoke message without a matching instruction'])
        expect(block.transactions[0].hasDroppedLogMessages).toBe(true)
        expect(instructions(block).map(i => i.address)).toEqual([[0]])
    })

    it('depth limitation: a native call after a nested BPF call is placed under the top-level call', () => {
        // A (PROG) -> B (PROG2) -> [Token, System]. Old inner instructions have no stackHeight,
        // and System never logs, so nothing places it under B: it is put at depth 2, under A.
        let {block, warnings} = map({
            instructions: [{program: PROG, inner: [PROG2, TOKEN, SYSTEM]}],
            logs: [
                `Call BPF program ${PROG}`,
                `Call BPF program ${PROG2}`,
                `Call BPF program ${TOKEN}`,
                `BPF program ${TOKEN} success`,
                `BPF program ${PROG2} success`,
                `BPF program ${PROG} success`,
            ]
        })
        expect(warnings).toEqual([])
        expect(instructions(block).map(i => [i.program, i.address])).toEqual([
            [PROG, [0]],
            [PROG2, [0, 0]],
            [TOKEN, [0, 0, 0]],
            [SYSTEM, [0, 1]],
        ])
    })
})


describe('modern log format (regression)', () => {
    it('nested invoke', () => {
        let {block, warnings, errors} = map({
            instructions: [{program: PROG, inner: [TOKEN, SYSTEM]}],
            logs: [
                `Program ${PROG} invoke [1]`,
                'Program log: swap',
                `Program ${TOKEN} invoke [2]`,
                'Program log: Instruction: Transfer',
                `Program ${TOKEN} consumed 4759 of 189901 compute units`,
                `Program ${TOKEN} success`,
                `Program ${SYSTEM} invoke [2]`,
                `Program ${SYSTEM} success`,
                'Program data: AQID',
                `Program ${PROG} consumed 22411 of 200000 compute units`,
                `Program ${PROG} success`,
            ],
            stackHeights: [[2, 2]]
        })
        expect(warnings).toEqual([])
        expect(errors).toEqual([])
        expect(instructions(block)).toEqual([
            {address: [0], program: PROG, error: undefined, cu: 22411n, dropped: false},
            {address: [0, 0], program: TOKEN, error: undefined, cu: 4759n, dropped: false},
            {address: [0, 1], program: SYSTEM, error: undefined, cu: undefined, dropped: false},
        ])
        expect(logs(block)).toEqual([
            {logIndex: 1, address: [0], program: PROG, kind: 'log', message: 'swap'},
            {logIndex: 3, address: [0, 0], program: TOKEN, kind: 'log', message: 'Instruction: Transfer'},
            {logIndex: 8, address: [0], program: PROG, kind: 'data', message: 'AQID'},
        ])
    })

    it('failed invoke', () => {
        let {block, warnings, errors} = map({
            instructions: [{program: PROG}],
            logs: [
                `Program ${PROG} invoke [1]`,
                `Program ${PROG} consumed 100 of 200000 compute units`,
                `Program ${PROG} failed: custom program error: 0x1`,
            ],
            err: {InstructionError: [0, {Custom: 1}]}
        })
        expect(warnings).toEqual([])
        expect(errors).toEqual([])
        expect(instructions(block)).toEqual([
            {address: [0], program: PROG, error: 'custom program error: 0x1', cu: 100n, dropped: false},
        ])
    })

    it('missing invoke message is still reported', () => {
        let {block, warnings} = map({
            instructions: [{program: SYSTEM}, {program: PROG}],
            logs: [
                `Program ${PROG} invoke [1]`,
                `Program ${PROG} success`,
            ]
        })
        expect(warnings).toEqual(['missing invoke message'])
        expect(instructions(block).map(i => i.dropped)).toEqual([true, false])
    })

    it('missing inner invoke message is still reported', () => {
        let {block, warnings} = map({
            instructions: [{program: PROG, inner: [SYSTEM]}],
            logs: [
                `Program ${PROG} invoke [1]`,
                `Program ${PROG} success`,
            ],
            stackHeights: [[2]]
        })
        expect(warnings).toEqual(['missing invoke message for inner instruction'])
        expect(instructions(block).map(i => i.dropped)).toEqual([false, true])
    })

    it('v1.3-looking lines in a modern log are plain messages', () => {
        let {block, warnings, errors} = map({
            instructions: [{program: PROG}],
            logs: [
                `Program ${PROG} invoke [1]`,
                `Call BPF program ${TOKEN}`,
                'BPF program consumed 1 of 2 units',
                `BPF program ${TOKEN} success`,
                `Program ${PROG} success`,
            ]
        })
        expect(warnings).toEqual([])
        expect(errors).toEqual([])
        expect(logs(block).map(l => [l.kind, l.message])).toEqual([
            ['other', `Call BPF program ${TOKEN}`],
            ['other', 'BPF program consumed 1 of 2 units'],
            ['other', `BPF program ${TOKEN} success`],
        ])
        expect(instructions(block)[0].cu).toBe(undefined)
    })
})
