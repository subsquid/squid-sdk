import {concurrentMap, last, Throttler} from '@subsquid/util-internal'
import {RangeRequestList} from '@subsquid/util-internal-range'
import assert from 'assert'
import {Batch} from './interfaces'


export interface Block {
    header: {
        number: number
        hash: string
    }
}


export interface ArchiveQuery {
    fromBlock: number
    toBlock?: number
}


export interface ArchiveClient {
    getHeight(): Promise<number>
    query<B extends Block = Block, Q extends ArchiveQuery = ArchiveQuery>(query: Q): Promise<B[]>
    stream?<B extends Block = Block, Q extends ArchiveQuery = ArchiveQuery>(query: Q): AsyncIterable<B[]>
}


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
        pollInterval = 20_000,
    } = args

    let height = new Throttler(() => client.getHeight(), pollInterval)

    async function *ingest(): AsyncIterable<Batch<B>> {
        let top = await height.get()
        for (let req of requests) {
            let beg = req.range.from
            let end = req.range.to ?? Infinity
            if (client.stream) {
                let stream = client.stream?.<B>({
                    fromBlock: req.range.from,
                    toBlock: req.range.to,
                    ...req.request
                })
    
                top = await height.get()

                for await (let blocks of stream) {
                    if (blocks.length == 0) continue
    
                    let lastBlock = last(blocks).header.number
                    assert(beg <= lastBlock && lastBlock <= end, 'blocks are out of range')
                    beg = lastBlock + 1
    
                    // FIXME: is it needed here at all? Used only for `isHead`
                    top = await height.get()

                    yield {
                        blocks,
                        isHead: lastBlock >= top
                    }
                }
    
                if (beg < end && stopOnHead) break
                
                assert(beg === end + 1, 'boundary blocks are expected to be included')
            } else {
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
    }

    return concurrentMap(
        2,
        ingest(),
        batch => Promise.resolve(batch)
    )
}
