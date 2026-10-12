import * as fs from 'node:fs'
import * as Path from 'node:path'
import {describe, expect, it} from 'vitest'
import {
    type CallFrame,
    checkConsensusAnchors,
    CONSENSUS_ANCHOR_RULES,
    type ConsensusAnchorInput,
    type ConsensusAnchorRule,
    SYSTEM_ADDRESS,
    systemBalanceDeltaFromPrestate,
    systemBalanceDeltaFromReplay,
    systemValueFlow,
} from '../src/verification'

// BSC mainnet transactions captured from an archive node, trimmed to the fields the
// rules read: call frames without input/output/logs, and state diffs reduced to the
// system address. Each one is correct, and several are shapes a naive check gets wrong.
interface Case {
    description: string
    block: number
    transactionIndex: number
    miner: string
    transaction: {hash: string; from: string; gasPrice?: string | null; input: string}
    receipt: {
        status: string
        gasUsed: string
        effectiveGasPrice?: string | null
        blobGasUsed?: string | null
        blobGasPrice?: string | null
    }
    callFrame: CallFrame
    replayStateDiff: Record<string, any>
    prestateDiff: {pre: Record<string, any>; post: Record<string, any>}
}

const CASES: Case[] = JSON.parse(
    fs.readFileSync(Path.join(__dirname, 'fixtures/bsc/consensus-anchor-transactions.json'), 'utf-8'),
)

const ALL_RULES: ReadonlySet<ConsensusAnchorRule> = new Set(CONSENSUS_ANCHOR_RULES)

function caseAt(block: number, transactionIndex: number): Case {
    let c = CASES.find((c) => c.block === block && c.transactionIndex === transactionIndex)
    if (c == null) throw new Error(`no fixture for ${block}/${transactionIndex}`)
    return structuredClone(c)
}

function input(c: Case, stateDiff: 'replay' | 'prestate'): ConsensusAnchorInput {
    return {
        miner: c.miner,
        transaction: c.transaction,
        receipt: {...c.receipt, status: Number.parseInt(c.receipt.status)},
        root: c.callFrame,
        systemBalanceDelta:
            stateDiff === 'replay'
                ? systemBalanceDeltaFromReplay(c.replayStateDiff)
                : systemBalanceDeltaFromPrestate(c.prestateDiff),
    }
}

function rulesViolated(i: ConsensusAnchorInput): ConsensusAnchorRule[] {
    return checkConsensusAnchors(i, ALL_RULES).map((v) => v.rule)
}

describe('consensus anchors on correct data', () => {
    for (let c of CASES) {
        for (let shape of ['replay', 'prestate'] as const) {
            it(`${c.description} (${c.block}/${c.transactionIndex}, ${shape} state diff)`, () => {
                expect(rulesViolated(input(c, shape))).toEqual([])
            })
        }
    }
})

describe('consensus anchors on damaged data', () => {
    it('flags a successful transaction whose root frame reverted', () => {
        let c = caseAt(35774034, 1)
        c.callFrame.error = 'execution reverted'
        expect(rulesViolated(input(c, 'replay'))).toContain('status')
    })

    it('flags a failed transaction whose root frame succeeded', () => {
        let c = caseAt(35774034, 1)
        c.receipt.status = '0x0'
        expect(rulesViolated(input(c, 'replay'))).toContain('status')
    })

    it('flags a root gasUsed that differs from the receipt', () => {
        let c = caseAt(120000000, 5)
        c.callFrame.gasUsed = `0x${(BigInt(c.receipt.gasUsed) + 2800n).toString(16)}`
        expect(rulesViolated(input(c, 'replay'))).toEqual(['gas'])
    })

    it('flags a system transaction whose calls are missing', () => {
        let c = caseAt(40502146, 57)
        let calldata = (c.transaction.input.length - 2) / 2
        expect(c.callFrame.calls?.length).toBeGreaterThan(0)
        c.callFrame.calls = []
        c.callFrame.gasUsed = `0x${(21000 + 16 * calldata).toString(16)}`
        expect(rulesViolated(input(c, 'replay'))).toContain('system-gas')
    })

    it('does not compare system transactions exactly', () => {
        // The receipt of slash() exceeds its execution gas on a correct node.
        let c = caseAt(4532502, 41)
        expect(BigInt(c.callFrame.gasUsed!)).not.toBe(BigInt(c.receipt.gasUsed))
        expect(rulesViolated(input(c, 'replay'))).toEqual([])
    })

    for (let shape of ['replay', 'prestate'] as const) {
        it(`flags a state diff whose system-address credit is not the fee (${shape})`, () => {
            let c = caseAt(120000000, 5)
            if (shape === 'replay') {
                let diff = c.replayStateDiff[SYSTEM_ADDRESS].balance['*']
                diff.to = `0x${(BigInt(diff.to) + 1n).toString(16)}`
            } else {
                let post = c.prestateDiff.post[SYSTEM_ADDRESS]
                post.balance = `0x${(BigInt(post.balance) - 1n).toString(16)}`
            }
            expect(rulesViolated(input(c, shape))).toEqual(['system-fee'])
        })

        it(`flags a state diff without the system-address credit (${shape})`, () => {
            let c = caseAt(120000000, 5)
            c.replayStateDiff = {}
            c.prestateDiff = {pre: {}, post: {}}
            expect(rulesViolated(input(c, shape))).toEqual(['system-fee'])
        })
    }

    it('reports expected and actual values', () => {
        let c = caseAt(120000000, 5)
        c.callFrame.gasUsed = '0x1'
        let [v] = checkConsensusAnchors(input(c, 'replay'), new Set(['gas']))
        expect(v).toEqual({
            rule: 'gas',
            expected: `root gasUsed ${BigInt(c.receipt.gasUsed)}`,
            actual: 'root gasUsed 1',
        })
    })

    it('applies only the selected rules', () => {
        let c = caseAt(120000000, 5)
        c.callFrame.error = 'execution reverted'
        c.callFrame.gasUsed = '0x1'
        expect(checkConsensusAnchors(input(c, 'replay'), new Set(['gas'])).map((v) => v.rule)).toEqual(['gas'])
    })

    it('flags a missing call frame or a root STOP under the first selected trace rule', () => {
        let c = caseAt(120000000, 5)
        let missing = checkConsensusAnchors({...input(c, 'replay'), root: undefined}, new Set(['gas']))
        expect(missing).toEqual([{rule: 'gas', expected: 'a call or create root frame', actual: 'no call frame'}])
        let stop = checkConsensusAnchors(
            {...input(c, 'replay'), root: {type: 'STOP', from: c.transaction.from}},
            ALL_RULES,
        )
        expect(stop.map((v) => [v.rule, v.actual])).toEqual([['status', 'root STOP frame']])
    })

    it('flags a root frame without gasUsed', () => {
        let c = caseAt(120000000, 5)
        c.callFrame.gasUsed = undefined
        expect(rulesViolated(input(c, 'replay'))).toEqual(['gas'])
        let s = caseAt(363, 2)
        s.callFrame.gasUsed = undefined
        expect(rulesViolated(input(s, 'replay'))).toEqual(['system-gas'])
    })

    it('does not take a transaction without a gas price for a system transaction', () => {
        let c = caseAt(4532502, 41)
        c.transaction.gasPrice = undefined
        // compared exactly as a regular transaction: the slash() receipt exceeds its execution gas
        expect(rulesViolated(input(c, 'replay'))).toEqual(['gas'])
    })

    it('skips the fee rule without a state diff', () => {
        let c = caseAt(120000000, 5)
        expect(checkConsensusAnchors({...input(c, 'replay'), systemBalanceDelta: undefined}, ALL_RULES)).toEqual([])
    })
})

describe('systemValueFlow', () => {
    const SENDER = '0x1111111111111111111111111111111111111111'

    it('counts value moved to and from the system address', () => {
        let root: CallFrame = {
            type: 'CALL',
            from: SENDER,
            to: SENDER,
            calls: [
                {type: 'CALL', from: SENDER, to: SYSTEM_ADDRESS, value: '0x64'},
                {type: 'CALL', from: SYSTEM_ADDRESS, to: SENDER, value: '0xa'},
                {type: 'SELFDESTRUCT', from: SENDER, to: SYSTEM_ADDRESS, value: '0x5'},
            ],
        }
        expect(systemValueFlow(root)).toBe(95n)
    })

    it('ignores frames that move no value and frames under a failure', () => {
        let root: CallFrame = {
            type: 'CALL',
            from: SENDER,
            to: SENDER,
            calls: [
                {type: 'DELEGATECALL', from: SENDER, to: SYSTEM_ADDRESS, value: '0x64'},
                {type: 'STATICCALL', from: SENDER, to: SYSTEM_ADDRESS, value: '0x64'},
                {type: 'CALLCODE', from: SENDER, to: SYSTEM_ADDRESS, value: '0x64'},
                {type: 'CALL', from: SENDER, to: SYSTEM_ADDRESS, value: '0x64', error: 'execution reverted'},
                {
                    type: 'CALL',
                    from: SENDER,
                    to: SENDER,
                    error: 'out of gas',
                    calls: [{type: 'CALL', from: SENDER, to: SYSTEM_ADDRESS, value: '0x64'}],
                },
            ],
        }
        expect(systemValueFlow(root)).toBe(0n)
    })
})

describe('system address balance delta', () => {
    it('reads every trace_replay diff kind', () => {
        expect(systemBalanceDeltaFromReplay({[SYSTEM_ADDRESS]: {balance: {'*': {from: '0x5', to: '0x7'}}}})).toBe(2n)
        expect(systemBalanceDeltaFromReplay({[SYSTEM_ADDRESS]: {balance: {'+': '0x7'}}})).toBe(7n)
        expect(systemBalanceDeltaFromReplay({[SYSTEM_ADDRESS]: {balance: {'-': '0x7'}}})).toBe(-7n)
        expect(systemBalanceDeltaFromReplay({[SYSTEM_ADDRESS]: {balance: '='}})).toBe(0n)
        expect(systemBalanceDeltaFromReplay({})).toBe(0n)
        expect(systemBalanceDeltaFromReplay(null)).toBe(0n)
    })

    it('reads a prestate diff', () => {
        let address = SYSTEM_ADDRESS
        expect(
            systemBalanceDeltaFromPrestate({pre: {[address]: {balance: '0x5'}}, post: {[address]: {balance: '0x7'}}}),
        ).toBe(2n)
        // absent from pre: the account started from zero
        expect(systemBalanceDeltaFromPrestate({pre: {}, post: {[address]: {balance: '0x7'}}})).toBe(7n)
        // balance absent from post: unchanged
        expect(systemBalanceDeltaFromPrestate({pre: {[address]: {balance: '0x5'}}, post: {[address]: {}}})).toBe(0n)
        expect(systemBalanceDeltaFromPrestate({pre: {}, post: {}})).toBe(0n)
    })

    it('matches the address case-insensitively', () => {
        let upper = `0x${SYSTEM_ADDRESS.slice(2).toUpperCase()}`
        expect(systemBalanceDeltaFromReplay({[upper]: {balance: {'+': '0x7'}}})).toBe(7n)
    })
})
