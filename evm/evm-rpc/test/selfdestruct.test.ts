import * as fs from 'fs'
import * as Path from 'path'
import {describe, expect, it} from 'vitest'
import {
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
// `recovery/` holds opcode-tracer answers; `complete/` holds traces that must not
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

    // A selfdestruct-to-self of a contract created in the same transaction, and
    // selfdestructs that fail under STATICCALL or for gas, traced by both a
    // revm-based node and geth. A failed selfdestruct gets no frame of its own.
    it('matches nothing in complete or failed selfdestructs', () => {
        let names = fixtureFiles('complete').filter(name => !name.includes('legitimate-repeat'))
        expect(names).toEqual([
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
})


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
