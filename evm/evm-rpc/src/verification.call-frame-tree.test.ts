import {describe, expect, it} from 'vitest'
import {
    type CallFrame,
    checkCallFrameTree,
    checkDebugFrameStructure
} from './verification'


// Ethereum Sepolia block 11319411, transaction 17
// (0xf6c6e39b79667c78858e4c5b924a22d834427d7287e8a3b26219fe5dce180065): a contract that
// self-destructs into itself. Some providers return the frame with `from` zeroed and
// `to` dropped, which cost ethereum-sepolia a week of stalled ingestion - the block is
// consensus-valid, so nothing else rejects it, and once written to the raw archive the
// failure is permanent.
const SENDER = '0xb31fb3fd1b61e571a9709bc59413950e1abc9926'
const CONTRACT = '0xe22a1e72591acb61ec32a9a1d2a1d0818c2f53e0'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const TX = {from: SENDER, to: CONTRACT}

const INTACT: CallFrame = {
    type: 'CALL',
    from: SENDER,
    to: CONTRACT,
    input: '0x',
    calls: [
        {
            type: 'SELFDESTRUCT',
            from: CONTRACT,
            to: CONTRACT
        }
    ]
}


describe('checkDebugFrameStructure', () => {
    it('accepts every field normalization needs', () => {
        expect(checkDebugFrameStructure(INTACT)).toBeUndefined()
    })

    it('requires targets and inputs for call frames', () => {
        expect(checkDebugFrameStructure({
            type: 'CALL',
            from: SENDER,
            input: '0x'
        })).toBe('root call frame has no target')

        expect(checkDebugFrameStructure({
            type: 'CALL',
            from: SENDER,
            to: CONTRACT
        })).toBe('root call frame has no input')

        expect(checkDebugFrameStructure({
            ...INTACT,
            calls: [{
                type: 'STATICCALL',
                from: CONTRACT,
                to: CONTRACT
            }]
        })).toBe('call frame 0 has no input')
    })

    it('allows a failed create without a resulting address', () => {
        expect(checkDebugFrameStructure({
            ...INTACT,
            calls: [{
                type: 'CREATE',
                from: CONTRACT,
                input: '0x6000'
            }]
        })).toBeUndefined()
    })

    it('requires complete create results and selfdestruct beneficiaries', () => {
        expect(checkDebugFrameStructure({
            type: 'CREATE',
            from: SENDER
        })).toBe('root create frame has no init code')

        expect(checkDebugFrameStructure({
            type: 'CREATE',
            from: SENDER,
            to: CONTRACT,
            input: '0x6000'
        })).toBe('root create frame has a result but no gas used')

        // the mapper reads these fields by truthiness, so a present-but-empty
        // gasUsed aborts normalization exactly like a missing one
        expect(checkDebugFrameStructure({
            type: 'CREATE',
            from: SENDER,
            to: CONTRACT,
            input: '0x6000',
            gasUsed: ''
        })).toBe('root create frame has a result but no gas used')

        expect(checkDebugFrameStructure({
            type: 'CREATE',
            from: SENDER,
            input: '0x6000',
            output: '0x6000',
            gasUsed: ''
        })).toBe('root create frame has a result but no gas used')

        expect(checkDebugFrameStructure({
            ...INTACT,
            calls: [{
                type: 'SELFDESTRUCT',
                from: CONTRACT
            }]
        })).toBe('selfdestruct frame 0 has no beneficiary')
    })

    it('requires 20-byte addresses', () => {
        expect(checkDebugFrameStructure({
            ...INTACT,
            from: '0x1234'
        })).toBe('root frame has invalid from address 0x1234')

        expect(checkDebugFrameStructure({
            ...INTACT,
            to: '0x1234'
        })).toBe('root frame has invalid to address 0x1234')
    })

    it('rejects frame types normalization cannot map', () => {
        expect(checkDebugFrameStructure({
            type: 'STOP',
            from: '0x'
        })).toBeUndefined()

        expect(checkDebugFrameStructure({
            type: 'STOP',
            from: '0x',
            calls: [{...INTACT}]
        })).toBe('root STOP frame has subcalls')

        expect(checkDebugFrameStructure({
            ...INTACT,
            calls: [{
                type: 'STOP',
                from: CONTRACT
            }]
        })).toBe('frame 0 has unsupported type STOP')
    })
})


describe('checkCallFrameTree', () => {
    it('accepts the intact tree', () => {
        expect(checkCallFrameTree(TX, INTACT)).toBeUndefined()
    })

    // Both gates run on every frame, so a shape one accepts and the other rejects
    // would stall ingestion under `reject` - the failure this check exists to prevent.
    it('agrees with the structural check about a root STOP', () => {
        let root: CallFrame = {type: 'STOP', from: SENDER, to: CONTRACT}

        expect(checkDebugFrameStructure(root)).toBeUndefined()
        expect(checkCallFrameTree(TX, root)).toBeUndefined()
        expect(checkCallFrameTree({from: SENDER, to: null}, root)).toBeUndefined()
    })

    it('accepts a root frame that halted on an invalid opcode', () => {
        let root: CallFrame = {type: 'INVALID', from: SENDER, to: CONTRACT, input: '0x'}

        expect(checkDebugFrameStructure(root)).toBeUndefined()
        expect(checkCallFrameTree(TX, root)).toBeUndefined()
    })

    it('still rejects nested-only call types at the root', () => {
        expect(checkCallFrameTree(TX, {...INTACT, type: 'DELEGATECALL'})).toBe(
            `root frame has type DELEGATECALL, but the transaction calls ${CONTRACT}`
        )
    })

    it('rejects a frame executed by nobody', () => {
        let tree: CallFrame = {
            ...INTACT,
            calls: [{type: 'SELFDESTRUCT', from: ZERO_ADDRESS}]
        }

        expect(checkCallFrameTree(TX, tree)).toBe(
            `frame 0 is executed by ${ZERO_ADDRESS}, but ${CONTRACT} is on top of the call stack`
        )
    })

    it('rejects a selfdestruct without a beneficiary', () => {
        let tree: CallFrame = {
            ...INTACT,
            calls: [{type: 'SELFDESTRUCT', from: CONTRACT}]
        }

        expect(checkCallFrameTree(TX, tree)).toBe('selfdestruct frame 0 has no beneficiary')
    })

    it('rejects a root frame that disagrees with the transaction', () => {
        expect(checkCallFrameTree({from: CONTRACT, to: CONTRACT}, INTACT)).toBe(
            `root frame is executed by ${SENDER}, but the transaction is sent by ${CONTRACT}`
        )
        expect(checkCallFrameTree({from: SENDER, to: SENDER}, INTACT)).toBe(
            `root frame calls ${CONTRACT}, but the transaction calls ${SENDER}`
        )
        expect(checkCallFrameTree(TX, {...INTACT, to: undefined})).toBe(
            `root frame calls nothing, but the transaction calls ${CONTRACT}`
        )
    })

    it('requires the root type to agree with contract creation', () => {
        expect(checkCallFrameTree({from: SENDER, to: null}, INTACT)).toBe(
            'root frame has type CALL, but the transaction creates a contract'
        )

        expect(checkCallFrameTree(
            {from: SENDER, to: null},
            {
                type: 'CREATE',
                from: SENDER,
                to: CONTRACT,
                input: '0x6000'
            }
        )).toBeUndefined()

        expect(checkCallFrameTree(TX, {...INTACT, type: 'CREATE'})).toBe(
            `root frame has type CREATE, but the transaction calls ${CONTRACT}`
        )
    })

    it('keeps the caller across DELEGATECALL and CALLCODE', () => {
        let library = '0x1111111111111111111111111111111111111111'

        for (let type of ['DELEGATECALL', 'delegateCall', 'CALLCODE']) {
            let tree: CallFrame = {
                type: 'CALL',
                from: SENDER,
                to: CONTRACT,
                calls: [
                    {
                        type,
                        from: CONTRACT,
                        to: library,
                        // executed in CONTRACT's context, so the nested frame is still its own
                        calls: [{type: 'STATICCALL', from: CONTRACT, to: library}]
                    }
                ]
            }
            expect(checkCallFrameTree(TX, tree), type).toBeUndefined()

            tree.calls![0].calls = [{type: 'STATICCALL', from: library, to: library}]
            expect(checkCallFrameTree(TX, tree), type).toBe(
                `frame 0/0 is executed by ${library}, but ${CONTRACT} is on top of the call stack`
            )
        }
    })

    it('follows the callee through CALL, STATICCALL and CREATE', () => {
        let created = '0x2222222222222222222222222222222222222222'

        for (let type of ['CALL', 'STATICCALL', 'CREATE', 'CREATE2']) {
            let tree: CallFrame = {
                type: 'CALL',
                from: SENDER,
                to: CONTRACT,
                calls: [
                    {
                        type,
                        from: CONTRACT,
                        to: created,
                        calls: [{type: 'CALL', from: created, to: CONTRACT}]
                    }
                ]
            }
            expect(checkCallFrameTree(TX, tree), type).toBeUndefined()

            tree.calls![0].calls = [{type: 'CALL', from: CONTRACT, to: CONTRACT}]
            expect(checkCallFrameTree(TX, tree), type).toBe(
                `frame 0/0 is executed by ${CONTRACT}, but ${created} is on top of the call stack`
            )
        }
    })

    it('reports the deepest frame by its trace address', () => {
        let tree: CallFrame = {
            type: 'CALL',
            from: SENDER,
            to: CONTRACT,
            calls: [
                {type: 'STATICCALL', from: CONTRACT, to: CONTRACT},
                {
                    type: 'CALL',
                    from: CONTRACT,
                    to: CONTRACT,
                    calls: [{type: 'SELFDESTRUCT', from: ZERO_ADDRESS}]
                }
            ]
        }

        expect(checkCallFrameTree(TX, tree)).toBe(
            `frame 1/0 is executed by ${ZERO_ADDRESS}, but ${CONTRACT} is on top of the call stack`
        )
    })

    it('flags ArbOS system frames, which is why the check is opt-in', () => {
        // Observed on arbitrum-one: 5 of 17 sampled transactions attribute an inner
        // frame to the system address instead of the enclosing callee. The tree is
        // not corrupt, the chain just does not follow the rule - so networks have to
        // be observed before `callFrameValidation: 'reject'` is turned on for them.
        let arbosSystemAddress = '0xfffffffffffffffffffffffffffffffffffffffe'
        let arbosPrecompile = '0x00000000000000000000000000000000000a4b05'

        let tree: CallFrame = {
            type: 'CALL',
            from: SENDER,
            to: arbosPrecompile,
            calls: [{type: 'CALL', from: arbosSystemAddress, to: arbosPrecompile}]
        }

        expect(checkCallFrameTree({from: SENDER, to: arbosPrecompile}, tree)).toBe(
            `frame 0 is executed by ${arbosSystemAddress}, but ${arbosPrecompile} is on top of the call stack`
        )
    })

    it('does not let an unmodelled frame suppress independent checks', () => {
        let tree: CallFrame = {
            type: 'SOMETHING_NEW',
            from: ZERO_ADDRESS,
            to: CONTRACT
        }

        expect(checkCallFrameTree(TX, tree)).toBe(
            `root frame is executed by ${ZERO_ADDRESS}, but the transaction is sent by ${SENDER}`
        )
    })

    it('skips an edge whose parent has no callee', () => {
        // a failed CREATE has no resulting address, so there is nothing to check against
        let tree: CallFrame = {
            type: 'CALL',
            from: SENDER,
            to: CONTRACT,
            calls: [
                {
                    type: 'CREATE',
                    from: CONTRACT,
                    calls: [{type: 'CALL', from: ZERO_ADDRESS, to: CONTRACT}]
                }
            ]
        }

        expect(checkCallFrameTree(TX, tree)).toBeUndefined()
    })
})
