import {describe, expect, it} from 'vitest'
import {mapRawBlock} from './mapping'


// Minimal raw block carrying a single SELFDESTRUCT debug frame. The header/tx
// fields are only what `mapRawBlock` touches on the trace path.
function selfdestructBlock(frame: Record<string, unknown>): any {
    return {
        number: '0x1',
        hash: '0xblock',
        parentHash: '0x0',
        timestamp: '0x0',
        transactionsRoot: '0x',
        receiptsRoot: '0x',
        stateRoot: '0x',
        logsBloom: '0x',
        sha3Uncles: '0x',
        extraData: '0x',
        miner: '0x',
        size: '0x0',
        gasLimit: '0x0',
        gasUsed: '0x0',
        transactions: [
            {
                transactionIndex: '0x0',
                hash: '0xtx',
                nonce: '0x0',
                from: '0xe22a1e72591acb61ec32a9a1d2a1d0818c2f53e0',
                gas: '0x0',
                debugFrame_: {result: frame},
            },
        ],
    }
}


describe('mapDebugFrame SELFDESTRUCT', () => {
    // Regression: a self-referential SELFDESTRUCT where callTracer omits `to`
    // used to crash the ingest with `assertNotNull(frame.to)`.
    it('tolerates a missing `to` by falling back to the account itself', () => {
        let block = mapRawBlock(
            selfdestructBlock({
                type: 'SELFDESTRUCT',
                from: '0xe22a1e72591acb61ec32a9a1d2a1d0818c2f53e0',
                gas: '0x0',
                gasUsed: '0x0',
                input: '0x',
                value: '0x0',
            }),
            {withTraces: true}
        )

        expect(block.traces).toHaveLength(1)
        let trace = block.traces![0]
        expect(trace.type).toBe('selfdestruct')
        expect((trace.action as any).refundAddress).toBe(
            '0xe22a1e72591acb61ec32a9a1d2a1d0818c2f53e0'
        )
    })

    it('keeps an explicit `to` as the refund address', () => {
        let block = mapRawBlock(
            selfdestructBlock({
                type: 'SELFDESTRUCT',
                from: '0xe22a1e72591acb61ec32a9a1d2a1d0818c2f53e0',
                to: '0x1111111111111111111111111111111111111111',
                gas: '0x0',
                gasUsed: '0x0',
                input: '0x',
                value: '0x0',
            }),
            {withTraces: true}
        )

        expect((block.traces![0].action as any).refundAddress).toBe(
            '0x1111111111111111111111111111111111111111'
        )
    })
})
