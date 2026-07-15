import {describe, it} from 'vitest'
import assert from 'assert'
import {RangeRequestList} from '@subsquid/util-internal-range'
import {DataRequest} from '../data/request'
import {PortalEvmDataSource} from './source'

/** A PortalClient stub that records the `[fromBlock, toBlock]` of every query it is asked to stream. */
function recordingClient(queries: {fromBlock: number; toBlock?: number}[]) {
    return {
        async *getStream(query: {fromBlock: number; toBlock?: number}) {
            queries.push({fromBlock: query.fromBlock, toBlock: query.toBlock})
            // Stream nothing — we only care about the range the source asks for.
        },
    } as any
}

describe('PortalEvmDataSource stream bounding', () => {
    const requests: RangeRequestList<DataRequest> = [{range: {from: 0, to: 1000}, request: {}}]

    async function collectQueries(opts: {from: number; to?: number}) {
        let queries: {fromBlock: number; toBlock?: number}[] = []
        let src = new PortalEvmDataSource(recordingClient(queries), {}, requests)
        for await (let _ of src.getFinalizedStream(opts)) {
            // drain
        }
        return queries
    }

    it('honours StreamRequest.to — bounds the streamed range to the caller window', async () => {
        let queries = await collectQueries({from: 100, to: 200})
        // The data range request must terminate at `to`, not run to the configured range end (1000).
        assert.deepStrictEqual(queries[0], {fromBlock: 100, toBlock: 200})
    })

    it('without `to`, streams to the configured range end', async () => {
        let queries = await collectQueries({from: 100})
        assert.deepStrictEqual(queries[0], {fromBlock: 100, toBlock: 1000})
    })
})
