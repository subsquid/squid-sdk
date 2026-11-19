import * as fs from 'fs'
import * as Path from 'path'
import {describe, expect, it} from 'vitest'
import {
    builtinSelfdestructEvents,
    type CallFrame,
    checkDebugFrameStructure,
    type DefectiveSelfdestruct,
    findDefectiveSelfdestructs,
    repairDefectiveSelfdestruct,
    type SelfdestructDefect,
    selfdestructEvents
} from '../src/verification'


// Recorded node output, not constructed. `defective/` pairs each transaction as a
// revm-based node traced it with a complete trace of the same transaction;
// `recovery/` holds opcode-tracer answers; `builtin/` holds the SELFDESTRUCT steps of
// built-in opcode logs and prestate answers (`builtin-intact/` with the call tree
// of a transaction whose frames are correct); `complete/` holds traces that must not
// be rewritten.
const FIXTURES = Path.resolve(__dirname, 'fixtures/selfdestruct')


function readJson(path: string): any {
    return JSON.parse(fs.readFileSync(path, 'utf-8'))
}


function fixtureFiles(dir: string): string[] {
    return fs.readdirSync(Path.join(FIXTURES, dir)).sort()
}


function frameAt(root: CallFrame, traceAddress: number[]): CallFrame {
    return traceAddress.reduce((frame, index) => frame.calls![index], root)
}


function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value))
}


interface RecordedCase {
    name: string
    defect: string
    traceAddress: number[]
    defective: CallFrame
    complete: CallFrame
}


function recordedCases(): RecordedCase[] {
    return fixtureFiles('defective').map(name => {
        let recorded = readJson(Path.join(FIXTURES, 'defective', name))
        return {
            name,
            defect: recorded.defect,
            traceAddress: recorded.traceAddress,
            defective: recorded.defective,
            complete: recorded.complete
        }
    })
}


interface RecordedTrace {
    name: string
    traceAddress: number[]
    frame: string
    events: unknown[]
}


function recordedTraces(): RecordedTrace[] {
    return fixtureFiles('recovery').map(name => {
        let recorded = readJson(Path.join(FIXTURES, 'recovery', name))
        return {
            name,
            traceAddress: recorded.traceAddress,
            frame: recorded.frame,
            events: recorded.events
        }
    })
}


function expectedDefect(c: RecordedCase): {defect: SelfdestructDefect, structureViolation?: string} {
    let frame = frameAt(c.defective, c.traceAddress)
    switch (c.defect) {
        case 'incomplete':
            return {
                defect: {kind: 'incomplete'},
                structureViolation: `selfdestruct frame ${c.traceAddress.join('/')} has no beneficiary`
            }
        case 'stale-entry':
            // A stale entry leaves a structurally sound frame: only the opcode can
            // tell it apart from a genuine one.
            return {
                defect: {
                    kind: 'stale-entry',
                    reportedFrom: frame.from.toLowerCase(),
                    reportedTo: frame.to!.toLowerCase()
                }
            }
        default:
            throw new Error(`${c.name}: unknown defect ${c.defect}`)
    }
}


describe('findDefectiveSelfdestructs', () => {
    it('finds every recorded defective frame and nothing in its complete counterpart', () => {
        let cases = recordedCases()
        expect(cases.map(c => c.name)).toEqual([
            '19481732-131.json',
            '25644439-503.json',
            '25644459-203.json',
            '25684856-74.json',
            '25735294-98.json',
            'devnet-call-with-value.json',
            'devnet-callcode.json',
            'devnet-delegatecall.json',
            'devnet-direct-with-value.json',
            'devnet-reverted-parent.json',
            'devnet-stale-transfer-other-frame.json',
            'devnet-stale-transfer-same-frame.json',
            'devnet-zero-balance-entry.json',
        ])

        for (let c of cases) {
            let reported = frameAt(c.complete, c.traceAddress)
            expect(reported.to?.toLowerCase(), `${c.name}: selfdestruct-to-self`).toBe(reported.from.toLowerCase())

            let {defect, structureViolation} = expectedDefect(c)
            expect(findDefectiveSelfdestructs(c.defective), c.name).toEqual([{
                traceAddress: c.traceAddress,
                executor: reported.from.toLowerCase(),
                defect
            }])
            expect(checkDebugFrameStructure(c.defective), c.name).toBe(structureViolation)

            expect(findDefectiveSelfdestructs(c.complete), c.name).toEqual([])
            expect(checkDebugFrameStructure(c.complete), c.name).toBeUndefined()
        }
    })

    // A selfdestruct-to-self of a contract created in the same transaction,
    // selfdestructs that fail under STATICCALL or for gas, and a BSC selfdestruct
    // that repeats a value call which reverted (binance-mainnet 123911217,
    // 2026-09-25), traced by both a revm-based node and geth. A failed
    // selfdestruct gets no frame of its own.
    it('matches nothing in complete or failed selfdestructs', () => {
        let names = fixtureFiles('complete').filter(name => !name.includes('legitimate-repeat'))
        expect(names).toEqual([
            'bsc-reverted-call-then-selfdestruct-geth.json',
            'devnet-created-in-tx-anvil.json',
            'devnet-created-in-tx-geth.json',
            'devnet-out-of-gas-anvil.json',
            'devnet-out-of-gas-geth.json',
            'devnet-staticcall-anvil.json',
            'devnet-staticcall-geth.json',
        ])

        for (let name of names) {
            let trace: CallFrame = readJson(Path.join(FIXTURES, 'complete', name)).trace
            expect(findDefectiveSelfdestructs(trace), name).toEqual([])
            expect(checkDebugFrameStructure(trace), name).toBeUndefined()
        }
    })

    // A value call that reverted moved nothing, so a selfdestruct that sends the
    // same amount to the same receiver afterwards is the account's genuine
    // balance, not a stale journal entry. The same holds for a call that
    // succeeded inside a frame that later reverted. But a selfdestruct inside
    // that frame runs before the revert and can still read those entries.
    it('forgets transfers when the frame that made them fails', () => {
        const receiver = '0x0000000000be226afde21672a5e4adc45692e69d'
        const account = '0xf5f902e1bb971b4e5bc695101aa9a59e0ea1d739'
        const sender = '0x0000000000322e7acef3e4f81e36f3c2224bb597'
        const value = '0x7709d21aa6396'
        const frame = (type: string, from: string, to: string, value: string, extra: Partial<CallFrame> = {}): CallFrame =>
            ({type, from, to, value, input: '0x', ...extra})

        let revertedCall: CallFrame = {
            type: 'CALL', from: sender, to: account, value: '0x0', input: '0x',
            calls: [
                frame('CALL', account, receiver, value, {error: 'execution reverted'}),
                frame('SELFDESTRUCT', account, receiver, value),
            ]
        }
        expect(findDefectiveSelfdestructs(revertedCall)).toEqual([])

        let revertedParent: CallFrame = {
            type: 'CALL', from: sender, to: account, value: '0x0', input: '0x',
            calls: [
                frame('CALL', account, account, '0x0', {
                    error: 'execution reverted',
                    calls: [frame('CALL', account, receiver, value)]
                }),
                frame('SELFDESTRUCT', account, receiver, value),
            ]
        }
        expect(findDefectiveSelfdestructs(revertedParent)).toEqual([])

        let completed: CallFrame = {
            type: 'CALL', from: sender, to: account, value: '0x0', input: '0x',
            calls: [
                frame('CALL', account, receiver, value),
                frame('SELFDESTRUCT', account, receiver, value),
            ]
        }
        expect(findDefectiveSelfdestructs(completed)).toHaveLength(1)

        // Inside a frame that reverts later: the transfer's entry is still in
        // the journal when the selfdestruct runs, so a repeat stays suspect.
        let repeatInsideReverted: CallFrame = {
            type: 'CALL', from: sender, to: account, value: '0x0', input: '0x',
            calls: [
                frame('CALL', account, account, '0x0', {
                    error: 'execution reverted',
                    calls: [
                        frame('CALL', account, receiver, '0x1'),
                        frame('SELFDESTRUCT', account, receiver, '0x1'),
                    ]
                }),
            ]
        }
        let defects = findDefectiveSelfdestructs(repeatInsideReverted)
        expect(defects).toHaveLength(1)
        expect(defects[0].traceAddress).toEqual([0, 1])

        // The failed call's own transfer is visible to its children until it
        // exits: a stale frame under it carries the call's parties.
        let repeatOfFailedCall: CallFrame = {
            type: 'CALL', from: sender, to: account, value: '0x0', input: '0x',
            calls: [
                frame('CALL', account, receiver, '0x1', {
                    error: 'execution reverted',
                    calls: [frame('SELFDESTRUCT', account, receiver, '0x1')]
                }),
            ]
        }
        expect(findDefectiveSelfdestructs(repeatOfFailedCall)).toHaveLength(1)
    })

    // A contract created and destroyed inside one transaction records its entry
    // even with nothing to hand over, and a later frame can repeat that entry.
    it('keeps a zero-balance selfdestruct entry matchable', () => {
        let recorded = readJson(Path.join(FIXTURES, 'defective/devnet-zero-balance-entry.json'))
        let complete: CallFrame = recorded.complete

        let child = frameAt(complete, [0, 0])
        expect(child.value).toBe('0x0')
        expect(findDefectiveSelfdestructs(complete)).toEqual([])

        let repeated = clone(complete)
        let parent = repeated.calls![1]
        parent.from = child.from
        parent.to = child.to
        parent.value = child.value

        expect(findDefectiveSelfdestructs(repeated)).toEqual([{
            traceAddress: [1],
            executor: frameAt(complete, [1]).from.toLowerCase(),
            defect: {
                kind: 'stale-entry',
                reportedFrom: child.from.toLowerCase(),
                reportedTo: child.to!.toLowerCase()
            }
        }])
    })
})


describe('selfdestructEvents', () => {
    it('binds each recorded opcode event to its frame trace address', () => {
        let traces = recordedTraces()
        expect(traces.map(t => t.name)).toEqual([
            '19481732-131.json',
            '25644439-503.json',
            '25644459-203.json',
            '25684856-74.json',
            '25735294-633-complete.json',
            '25735294-98.json',
            'geth-dev-legitimate-repeat.json',
        ])

        for (let trace of traces) {
            let events = selfdestructEvents(trace.events)
            expect(events, trace.name).toHaveLength(1)
            expect(events[0].traceAddress, trace.name).toEqual(trace.traceAddress)
        }
    })

    // reth 2.10 enters and exits each SELFDESTRUCT frame before stepping the
    // opcode; counted apart, every event would land one index past its frame.
    it('binds events that follow their own selfdestruct frame', () => {
        let recorded = readJson(Path.join(FIXTURES, 'complete/mainnet-legitimate-repeat-reth.json'))
        let trace: CallFrame = recorded.trace

        let events = selfdestructEvents(recorded.events)

        expect(events.map(e => e.traceAddress)).toEqual([[0, 0], [1, 0], [2, 0], [3]])
        for (let event of events) {
            let frame = frameAt(trace, event.traceAddress)
            expect(frame.type).toBe('SELFDESTRUCT')
            expect(event.account).toBe(frame.from.toLowerCase())
            expect(event.beneficiary).toBe(frame.to!.toLowerCase())
        }
    })

    it('binds an event to the selfdestruct frame entered right after it', () => {
        let events = selfdestructEvents([
            {t: 'enter', type: 'CALL'},
            {t: 'exit'},
            sdItem(),
            {t: 'enter', type: 'SELFDESTRUCT'},
            {t: 'exit'},
            {t: 'enter', type: 'CALL'},
            sdItem(),
            {t: 'enter', type: 'SELFDESTRUCT'},
            {t: 'exit'},
            {t: 'exit'}
        ])

        expect(events.map(e => e.traceAddress)).toEqual([[1], [2, 0]])
    })

    it('never pairs an event with a frame of another type or one it did not follow out of', () => {
        let events = selfdestructEvents([
            // a genuine call right before the opcode is a sibling, not its frame
            {t: 'enter', type: 'CALL'},
            {t: 'exit'},
            sdItem(),
            // nor is a call entered right after it
            {t: 'enter', type: 'CALL'},
            {t: 'exit'},
            // an event inside a selfdestruct frame belongs to that frame's children
            {t: 'enter', type: 'SELFDESTRUCT'},
            sdItem(),
            {t: 'exit'}
        ])

        expect(events.map(e => e.traceAddress)).toEqual([[1], [3, 0]])
    })
})


function sdItem(): Record<string, string> {
    return {
        t: 'sd',
        from: '0x00000000000000000000000000000000000000aa',
        to: '0x00000000000000000000000000000000000000bb',
        bal: '0x0',
        preBalance: '0x1'
    }
}


describe('repairDefectiveSelfdestruct', () => {
    // Only the mainnet cases carry an opcode trace of their own chain; the devnet
    // pairs come from two separate chains.
    it('repairs each recorded defective frame into the complete tracer answer', () => {
        let repaired = 0
        for (let trace of recordedTraces()) {
            if (trace.frame !== 'defective') continue

            let pair = readJson(Path.join(FIXTURES, 'defective', trace.name))
            let defective: CallFrame = pair.defective

            let defects = findDefectiveSelfdestructs(defective)
            expect(defects, trace.name).toHaveLength(1)

            let outcome = repairDefectiveSelfdestruct(defective, defects[0], selfdestructEvents(trace.events))

            expect(outcome, trace.name).toEqual({repair: 'applied'})
            expect(defective, trace.name).toEqual(pair.complete)
            expect(findDefectiveSelfdestructs(defective), trace.name).toEqual([])
            repaired += 1
        }
        expect(repaired).toBe(5)
    })

    // This contract pays an account and then selfdestructs to it, leaving exactly
    // what it paid: a genuine frame that looks like a stale entry.
    it('confirms a legitimate selfdestruct that repeats a transfer without rewriting it', () => {
        let recorded = readJson(Path.join(FIXTURES, 'complete/devnet-legitimate-repeat-geth.json'))
        let trace: CallFrame = recorded.trace
        let before = clone(trace)

        let defects = findDefectiveSelfdestructs(trace)
        expect(defects).toHaveLength(1)
        expect(checkDebugFrameStructure(trace)).toBeUndefined()

        let outcome = repairDefectiveSelfdestruct(trace, defects[0], selfdestructEvents(recorded.events))

        expect(outcome).toEqual({repair: 'confirmed'})
        expect(trace).toEqual(before)
    })

    // An existing contract sweeps two equal deposits to the same account: the second
    // sweep repeats the first. reth traced it, so the opcode events follow their frames.
    it('confirms a legitimate repeat that a reth opcode trace reports', () => {
        let recorded = readJson(Path.join(FIXTURES, 'complete/mainnet-legitimate-repeat-reth.json'))
        let trace: CallFrame = recorded.trace
        let before = clone(trace)

        let defects = findDefectiveSelfdestructs(trace)
        expect(defects.map(d => d.traceAddress)).toEqual([recorded.traceAddress])
        expect(checkDebugFrameStructure(trace)).toBeUndefined()

        let outcome = repairDefectiveSelfdestruct(trace, defects[0], selfdestructEvents(recorded.events))

        expect(outcome).toEqual({repair: 'confirmed'})
        expect(trace).toEqual(before)
    })

    // The recorded transaction sends its balance elsewhere: the event reports `0x0`
    // after the opcode, which is not the balance it moved.
    it('never repairs a selfdestruct that moves its balance', () => {
        let trace = recordedTraces().find(t => t.frame === 'complete')!
        let events = selfdestructEvents(trace.events)
        expect(events).toHaveLength(1)
        expect(events[0].account).not.toBe(events[0].beneficiary)
        expect(events[0].balance).toBe('0x0')

        let root: CallFrame = {
            type: 'CALL',
            from: '0xb31fb3fd1b61e571a9709bc59413950e1abc9926',
            to: '0xe22a1e72591acb61ec32a9a1d2a1d0818c2f53e0',
            input: '0x',
            calls: [{
                type: 'CALL',
                from: '0xe22a1e72591acb61ec32a9a1d2a1d0818c2f53e0',
                to: '0x1111111111111111111111111111111111111111',
                input: '0x'
            }]
        }
        let defect: DefectiveSelfdestruct = {
            traceAddress: trace.traceAddress,
            executor: events[0].account,
            defect: {kind: 'incomplete'}
        }

        let outcome = repairDefectiveSelfdestruct(root, defect, events)

        expect(outcome).toMatchObject({refused: expect.stringContaining('sends to')})
    })

    it('confirms a selfdestruct that burns its balance', () => {
        let recorded = readJson(Path.join(FIXTURES, 'balance/created-in-tx.json'))
        let trace: CallFrame = recorded.trace
        let before = clone(trace)

        let defects = findDefectiveSelfdestructs(trace)
        expect(defects).toHaveLength(1)
        expect(frameAt(trace, [1]).value).toBe('0x1')

        let events = selfdestructEvents(recorded.events)
        expect(events).toHaveLength(1)
        expect(events[0].account).toBe(events[0].beneficiary)
        expect(events[0].balance).toBe('0x0')

        expect(repairDefectiveSelfdestruct(trace, defects[0], events)).toEqual({repair: 'confirmed'})
        expect(trace).toEqual(before)
    })

    it('refuses a zero balance with no prior observation', () => {
        let recorded = readJson(Path.join(FIXTURES, 'balance/created-in-tx.json'))
        let trace: CallFrame = recorded.trace
        let before = clone(trace)

        let defects = findDefectiveSelfdestructs(trace)
        let events = selfdestructEvents(recorded.events)
        events[0].preBalance = undefined

        let outcome = repairDefectiveSelfdestruct(trace, defects[0], events)

        expect(outcome).toMatchObject({refused: expect.stringContaining('before selfdestruct')})
        expect(trace).toEqual(before)
    })

    // An existing post-Cancun contract retains its balance. An older tracer can
    // instead report a one-wei self-call as its selfdestruct.
    it('repairs a stale self-call balance even when the parties match', () => {
        let recorded = readJson(Path.join(FIXTURES, 'balance/created-in-tx.json'))

        for (let actualBalance of ['0x0', '0xa']) {
            let trace: CallFrame = clone(recorded.trace)
            let defects = findDefectiveSelfdestructs(trace)
            let events = selfdestructEvents(recorded.events)
            events[0].preBalance = actualBalance
            events[0].balance = actualBalance

            expect(repairDefectiveSelfdestruct(trace, defects[0], events)).toEqual({repair: 'applied'})
            expect(frameAt(trace, [1]).value).toBe(actualBalance)
        }
    })

    it('refuses an event attributed to another account than the executor', () => {
        let recorded = readJson(Path.join(FIXTURES, 'defective/25735294-98.json'))
        let trace = recordedTraces().find(t => t.name === '25735294-98.json')!
        let defective: CallFrame = recorded.defective
        let before = clone(defective)

        let defects = findDefectiveSelfdestructs(defective)
        let events = selfdestructEvents(trace.events)
        events[0].account = '0x1111111111111111111111111111111111111111'

        let outcome = repairDefectiveSelfdestruct(defective, defects[0], events)

        expect(outcome).toMatchObject({refused: expect.stringContaining('is on top of the call stack')})
        expect(defective).toEqual(before)
    })
})


describe('builtinSelfdestructEvents', () => {
    const SENDER = '0x00000000000000000000000000000000000000a1'
    const ROUTER = '0x00000000000000000000000000000000000000b2'
    const VICTIM = '0x00000000000000000000000000000000000000c3'
    const OTHER = '0x00000000000000000000000000000000000000d4'

    function step(beneficiary: string): {op: string, stack: string[]} {
        return {op: 'SELFDESTRUCT', stack: ['0x' + beneficiary.slice(2).padStart(64, '0')]}
    }

    // The defective trees were recorded from reth v2.4.0. The opcode steps and the
    // prestate of a transaction do not depend on the client, so they were recorded
    // later from a node that serves both.
    it('repairs each recorded defective frame from built-in tracer evidence alone', () => {
        let repaired = 0
        for (let name of fixtureFiles('builtin')) {
            let evidence = readJson(Path.join(FIXTURES, 'builtin', name))
            let pair = evidence.network === 'mainnet'
                ? readJson(Path.join(FIXTURES, 'defective', name))
                : evidence
            let defective: CallFrame = clone(pair.defective)

            let defects = findDefectiveSelfdestructs(defective)
            expect(defects, name).toHaveLength(1)

            let events = builtinSelfdestructEvents(defective, evidence.steps, evidence.prestate)
            let outcome = repairDefectiveSelfdestruct(defective, defects[0], events)
            expect(outcome, name).toEqual({repair: 'applied'})

            if (evidence.network === 'mainnet') {
                expect(defective, name).toEqual(pair.complete)
            } else {
                let frame = frameAt(defective, evidence.traceAddress)
                expect({from: frame.from, to: frame.to, value: BigInt(frame.value!)}, name).toEqual({
                    from: evidence.complete.from,
                    to: evidence.complete.to,
                    value: BigInt(evidence.complete.value)
                })
            }
            expect(findDefectiveSelfdestructs(defective), name).toEqual([])
            repaired += 1
        }
        expect(repaired).toBe(6)
    })

    it('starts from the prestate and adds the movements before the opcode, the root value included', () => {
        let root: CallFrame = {
            type: 'CALL', from: SENDER, to: ROUTER, value: '0x5',
            calls: [
                {type: 'CALL', from: ROUTER, to: VICTIM, value: '0x7', calls: [
                    {type: 'SELFDESTRUCT', from: '0x' + '0'.repeat(40)}
                ]}
            ]
        }
        let events = builtinSelfdestructEvents(root, [step(VICTIM)], {[VICTIM]: {balance: '0x10'}})
        expect(events).toEqual([{traceAddress: [0, 0], account: VICTIM, beneficiary: VICTIM, balance: '0x17', preBalance: '0x17'}])
    })

    it('reads an omitted balance of a named account as zero', () => {
        let root: CallFrame = {type: 'CALL', from: SENDER, to: VICTIM, value: '0x0', calls: [
            {type: 'SELFDESTRUCT', from: '0x' + '0'.repeat(40)}
        ]}
        let events = builtinSelfdestructEvents(root, [step(VICTIM)], {[VICTIM]: {}})
        expect(events[0].balance).toBe('0x0')
    })

    it('drops the movements of a failed frame', () => {
        let root: CallFrame = {
            type: 'CALL', from: SENDER, to: ROUTER, value: '0x0',
            calls: [
                {type: 'CALL', from: ROUTER, to: VICTIM, value: '0x7', error: 'execution reverted'},
                {type: 'CALL', from: ROUTER, to: VICTIM, value: '0x0', calls: [
                    {type: 'SELFDESTRUCT', from: '0x' + '0'.repeat(40)}
                ]}
            ]
        }
        let events = builtinSelfdestructEvents(root, [step(VICTIM)], {[VICTIM]: {balance: '0x10'}, [ROUTER]: {balance: '0x100'}})
        expect(events[0].balance).toBe('0x10')
    })

    it('moves what the opcode sent, not what an earlier frame claims', () => {
        // The first selfdestruct sends its whole balance to VICTIM, whatever value its
        // frame reports; the second then sees it.
        let root: CallFrame = {
            type: 'CALL', from: SENDER, to: ROUTER, value: '0x0',
            calls: [
                {type: 'CALL', from: ROUTER, to: OTHER, value: '0x0', calls: [
                    {type: 'SELFDESTRUCT', from: OTHER, to: VICTIM, value: '0x1'}
                ]},
                {type: 'CALL', from: ROUTER, to: VICTIM, value: '0x0', calls: [
                    {type: 'SELFDESTRUCT', from: '0x' + '0'.repeat(40)}
                ]}
            ]
        }
        let events = builtinSelfdestructEvents(
            root,
            [step(VICTIM), step(VICTIM)],
            {[OTHER]: {balance: '0x20'}, [VICTIM]: {balance: '0x3'}}
        )
        expect(events.map(e => e.balance)).toEqual(['0x20', '0x23'])
    })

    it('runs a DELEGATECALL selfdestruct in the caller', () => {
        let root: CallFrame = {
            type: 'CALL', from: SENDER, to: VICTIM, value: '0x0',
            calls: [
                {type: 'DELEGATECALL', from: VICTIM, to: OTHER, calls: [
                    {type: 'SELFDESTRUCT', from: '0x' + '0'.repeat(40)}
                ]}
            ]
        }
        let events = builtinSelfdestructEvents(root, [step(VICTIM)], {[VICTIM]: {balance: '0x9'}, [OTHER]: {balance: '0x1'}})
        expect(events[0]).toMatchObject({account: VICTIM, beneficiary: VICTIM, balance: '0x9'})
    })

    it('burns the balance of a contract created in the same transaction', () => {
        let root: CallFrame = {
            type: 'CALL', from: SENDER, to: ROUTER, value: '0x0',
            calls: [
                {type: 'CREATE', from: ROUTER, to: VICTIM, value: '0x4', calls: [
                    {type: 'SELFDESTRUCT', from: '0x' + '0'.repeat(40)}
                ]},
                {type: 'CALL', from: ROUTER, to: VICTIM, value: '0x0', calls: [
                    {type: 'SELFDESTRUCT', from: '0x' + '0'.repeat(40)}
                ]}
            ]
        }
        let events = builtinSelfdestructEvents(
            root,
            [step(VICTIM), step(VICTIM)],
            {[VICTIM]: {}, [ROUTER]: {balance: '0x100'}}
        )
        expect(events.map(e => e.balance)).toEqual(['0x4', '0x0'])
    })

    it('refuses when the opcode log and the call tree count different selfdestructs', () => {
        let root: CallFrame = {type: 'CALL', from: SENDER, to: VICTIM, value: '0x0', calls: [
            {type: 'SELFDESTRUCT', from: '0x' + '0'.repeat(40)}
        ]}
        expect(() => builtinSelfdestructEvents(root, [], {[VICTIM]: {balance: '0x1'}}))
            .toThrow('the opcode log has 0 SELFDESTRUCT steps for 1 selfdestruct frames')
    })

    it('starts a contract created in the transaction from zero when the prestate leaves it out', () => {
        // Recorded from Geth and reth alike: neither names the CREATE2 account, which
        // was empty before the transaction.
        let rec = JSON.parse(fs.readFileSync(
            Path.join(__dirname, 'fixtures/selfdestruct/builtin-intact/26384923-created-in-tx.json'), 'utf-8'
        ))
        let frame = rec.callFrame.calls[0].calls[4]
        expect(frame.type).toBe('SELFDESTRUCT')
        expect(Object.keys(rec.prestate).map(k => k.toLowerCase())).not.toContain(rec.callFrame.calls[0].to.toLowerCase())
        let events = builtinSelfdestructEvents(rec.callFrame, rec.steps, rec.prestate)
        expect(events).toEqual([{
            traceAddress: [0, 4],
            account: frame.from.toLowerCase(),
            beneficiary: frame.to.toLowerCase(),
            balance: frame.value,
            preBalance: frame.value
        }])
    })

    it('keeps what an unnamed address received before the transaction created a contract at it', () => {
        let root: CallFrame = {
            type: 'CALL', from: SENDER, to: ROUTER, value: '0x0',
            calls: [
                {type: 'CALL', from: ROUTER, to: OTHER, value: '0x5'},
                {type: 'CREATE2', from: ROUTER, to: OTHER, value: '0x2', calls: [
                    {type: 'SELFDESTRUCT', from: OTHER, to: VICTIM, value: '0x7'}
                ]}
            ]
        }
        let events = builtinSelfdestructEvents(root, [step(VICTIM)], {[ROUTER]: {balance: '0x100'}})
        expect(events.map(e => e.balance)).toEqual(['0x7'])
    })

    it('reads a prestate keyed by checksummed addresses', () => {
        let root: CallFrame = {
            type: 'CALL', from: SENDER, to: ROUTER, value: '0x0',
            calls: [{type: 'CALL', from: ROUTER, to: VICTIM, value: '0x0', calls: [
                {type: 'SELFDESTRUCT', from: '0x' + '0'.repeat(40)}
            ]}]
        }
        let checksummed = '0x00000000000000000000000000000000000000C3'
        let events = builtinSelfdestructEvents(root, [step(VICTIM)], {[checksummed]: {balance: '0x9'}, [ROUTER]: {}})
        expect(events.map(e => e.balance)).toEqual(['0x9'])
    })

    it('refuses an executing account the prestate does not name', () => {
        let root: CallFrame = {type: 'CALL', from: SENDER, to: VICTIM, value: '0x0', calls: [
            {type: 'SELFDESTRUCT', from: '0x' + '0'.repeat(40)}
        ]}
        expect(() => builtinSelfdestructEvents(root, [step(VICTIM)], {}))
            .toThrow(`the prestate does not name ${VICTIM}`)
    })

    it('refuses a prestate entry that is not an account', () => {
        let root: CallFrame = {
            type: 'CALL', from: SENDER, to: ROUTER, value: '0x0',
            calls: [{type: 'CALL', from: ROUTER, to: VICTIM, value: '0x0', calls: [
                {type: 'SELFDESTRUCT', from: '0x' + '0'.repeat(40)}
            ]}]
        }
        expect(() => builtinSelfdestructEvents(root, [step(VICTIM)], {[VICTIM]: null as any, [ROUTER]: {}}))
            .toThrow(`the prestate does not name ${VICTIM}`)
    })

    it('refuses a selfdestruct that runs in the transaction sender', () => {
        let root: CallFrame = {type: 'CALL', from: SENDER, to: SENDER, value: '0x0', calls: [
            {type: 'SELFDESTRUCT', from: '0x' + '0'.repeat(40)}
        ]}
        expect(() => builtinSelfdestructEvents(root, [step(SENDER)], {[SENDER]: {balance: '0x1'}}))
            .toThrow('runs in the transaction sender')
    })

    it('refuses a second selfdestruct of an account that selfdestructed to itself, whose balance depends on the fork', () => {
        let root: CallFrame = {
            type: 'CALL', from: SENDER, to: VICTIM, value: '0x0',
            calls: [
                {type: 'SELFDESTRUCT', from: '0x' + '0'.repeat(40)},
                {type: 'CALL', from: VICTIM, to: VICTIM, value: '0x0', calls: [
                    {type: 'SELFDESTRUCT', from: '0x' + '0'.repeat(40)}
                ]}
            ]
        }
        expect(() => builtinSelfdestructEvents(root, [step(VICTIM), step(VICTIM)], {[VICTIM]: {balance: '0x5'}}))
            .toThrow('selfdestructed to itself earlier in the transaction')
    })

    it('refuses when a transfer before the opcode reports no value', () => {
        let root: CallFrame = {
            type: 'CALL', from: SENDER, to: ROUTER, value: '0x0',
            calls: [
                {type: 'CALL', from: ROUTER, to: VICTIM},
                {type: 'CALL', from: ROUTER, to: VICTIM, value: '0x0', calls: [
                    {type: 'SELFDESTRUCT', from: '0x' + '0'.repeat(40)}
                ]}
            ]
        }
        expect(() => builtinSelfdestructEvents(root, [step(VICTIM)], {[VICTIM]: {balance: '0x10'}, [ROUTER]: {}}))
            .toThrow('CALL frame 0 reports no value')
    })

    it('forgets a transfer with no value when the frame that made it fails', () => {
        let root: CallFrame = {
            type: 'CALL', from: SENDER, to: ROUTER, value: '0x0',
            calls: [
                {type: 'CALL', from: ROUTER, to: OTHER, value: '0x0', error: 'execution reverted', calls: [
                    {type: 'CALL', from: OTHER, to: VICTIM}
                ]},
                {type: 'CALL', from: ROUTER, to: VICTIM, value: '0x0', calls: [
                    {type: 'SELFDESTRUCT', from: '0x' + '0'.repeat(40)}
                ]}
            ]
        }
        let events = builtinSelfdestructEvents(root, [step(VICTIM)], {[VICTIM]: {balance: '0x10'}, [ROUTER]: {}})
        expect(events[0].balance).toBe('0x10')
    })

    it('refuses an opcode log that sends an intact selfdestruct elsewhere than its frame', () => {
        // An opcode log from another execution would replay A to C instead of A to B,
        // and the later repair of B would miss what A sent it.
        let root: CallFrame = {
            type: 'CALL', from: SENDER, to: ROUTER, value: '0x0',
            calls: [
                {type: 'CALL', from: ROUTER, to: OTHER, value: '0x0', calls: [
                    {type: 'SELFDESTRUCT', from: OTHER, to: VICTIM, value: '0x20'}
                ]},
                {type: 'CALL', from: ROUTER, to: VICTIM, value: '0x0', calls: [
                    {type: 'SELFDESTRUCT', from: '0x' + '0'.repeat(40)}
                ]}
            ]
        }
        let prestate = {[OTHER]: {balance: '0x20'}, [VICTIM]: {balance: '0x3'}}
        expect(() => builtinSelfdestructEvents(root, [step(SENDER), step(VICTIM)], prestate, [[1, 0]]))
            .toThrow(`the opcode log sends selfdestruct frame 0/0 to ${SENDER}, but the frame names ${VICTIM}`)
        // A suspect frame is the one being repaired, so its own claim is not checked.
        expect(builtinSelfdestructEvents(root, [step(VICTIM), step(VICTIM)], prestate, [[0, 0], [1, 0]])
            .map(e => e.balance)).toEqual(['0x20', '0x23'])
    })
})
