import {concurrentMap, last, Throttler} from '@subsquid/util-internal'
import type {ArchiveClient, Block} from '@subsquid/util-internal-archive-client'
import {RangeRequestList} from '@subsquid/util-internal-range'
import assert from 'assert'
import {Batch} from './interfaces'


export interface ArchiveIngestOptions {
    client: ArchiveClient
    requests: RangeRequestList<any>
    stopOnHead?: boolean
    pollInterval?: number
}


export function archiveIngest<B extends Block>(args: ArchiveIngestOptions): AsyncIterable<Batch<B>> {
    let {
        client,
        requests,
        stopOnHead = false,
        pollInterval = 20_000
    } = args

    let height = new Throttler(() => client.getHeight(), pollInterval)

    async function *ingest(): AsyncIterable<Batch<B>> {
        let top = await height.get()
        for (let req of requests) {
            let beg = req.range.from
            let end = req.range.to ?? Infinity
            while (beg <= end) {
                if (top < beg) {
                    top = await height.get()
                }
                while (top < beg) {
                    if (stopOnHead) return
                    top = await height.call()
                }
                let blocks = await client.query<B>({
                    fromBlock: beg,
                    toBlock: req.range.to,
                    ...req.request
                })
                assert(blocks.length > 0, 'boundary blocks are expected to be included')
                let lastBlock = last(blocks).header.number
                assert(lastBlock >= beg)
                beg = lastBlock + 1
                if (beg > top) {
                    top = await height.get()
                }
                yield {
                    blocks,
                    isHead: beg > top
                }
            }
        }
    }

    return concurrentMap(
        2,
        ingest(),
        batch => Promise.resolve(batch)
    )
}
