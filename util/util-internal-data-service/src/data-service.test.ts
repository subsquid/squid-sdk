import {describe, expect, it} from 'vitest'
import {DataSource} from '@subsquid/util-internal-data-source'
import {DataService} from './data-service'
import {Block, DataResponse, InvalidBaseBlock} from './types'


const HEAD = 200


function mkBlock(number: number): Block {
    return {
        number,
        hash: `h${number}`,
        parentNumber: number - 1,
        parentHash: `h${number - 1}`,
        timestamp: Date.now(),
        jsonLineZstd: new Uint8Array(0)
    }
}


interface StreamCounters {
    opened: number
    closed: number
}


// Mirrors the data services' setup (e.g. solana-data-service/src/main.ts),
// where each getFinalizedStream() call spawns a dedicated worker thread
// and relies on the generator's finally block to close it.
// `counters.closed` stands for worker.close().
function mkSource(counters: StreamCounters): DataSource<Block> {
    return {
        async getHead() {
            return {number: HEAD, hash: `h${HEAD}`}
        },
        async getFinalizedHead() {
            return {number: HEAD, hash: `h${HEAD}`}
        },
        async *getFinalizedStream(req) {
            counters.opened += 1
            try {
                for (let number = req.from; number <= (req.to ?? req.from); number++) {
                    yield {blocks: [mkBlock(number)]}
                }
            } finally {
                counters.closed += 1
            }
        },
        async *getStream(req) {
            yield {blocks: [mkBlock(req.from)]}
        }
    }
}


// Creates a service holding a single block (HEAD) in its cache,
// so that queries below HEAD trigger the below-query (backfill) code path.
async function setup(): Promise<{service: DataService, counters: StreamCounters}> {
    let counters = {opened: 0, closed: 0}
    let service = new DataService(mkSource(counters), 10)
    await service.init()
    // init() fully consumes one finalized stream
    expect(counters).toEqual({opened: 1, closed: 1})
    counters.opened = 0
    counters.closed = 0
    return {service, counters}
}


async function belowQuery(service: DataService): Promise<DataResponse> {
    let res = await service.query(HEAD - 10)
    expect(res).not.toBeInstanceOf(InvalidBaseBlock)
    return res as DataResponse
}


describe('DataService below query resource management', () => {
    it('closes the source stream on full consumption', async () => {
        let {service, counters} = await setup()

        let res = await belowQuery(service)
        let blocks: Block[] = []
        for await (let batch of res.head!) {
            blocks.push(...batch)
        }
        await res.close?.()

        expect(blocks.map(b => b.number)).toEqual([190, 191, 192, 193, 194, 195, 196, 197, 198, 199])
        expect(res.tail?.map(b => b.number)).toEqual([HEAD])
        expect(counters).toEqual({opened: 1, closed: 1})
    })

    it('closes the source stream when the consumer stops at the first batch', async () => {
        // Regression test: the first yield of the below-query head generator
        // used to sit outside its try/finally block, so terminating the consumer
        // during the first batch skipped the cleanup and leaked the source stream
        // (a whole set of worker threads in the real services)
        let {service, counters} = await setup()

        let res = await belowQuery(service)
        for await (let _batch of res.head!) {
            break
        }
        await res.close?.()

        expect(counters).toEqual({opened: 1, closed: 1})
    })

    it('closes the source stream when the consumer stops at a later batch', async () => {
        let {service, counters} = await setup()

        let res = await belowQuery(service)
        let batches = 0
        for await (let _batch of res.head!) {
            batches += 1
            if (batches >= 2) break
        }
        await res.close?.()

        expect(counters).toEqual({opened: 1, closed: 1})
    })

    it('closes the source stream via close() when head is never iterated', async () => {
        // .return() on a never started generator does not execute its body,
        // so the head generator alone can't guarantee cleanup - close() must
        let {service, counters} = await setup()

        let res = await belowQuery(service)
        expect(res.close).toBeDefined()
        await res.close!()

        expect(counters).toEqual({opened: 1, closed: 1})
    })
})
