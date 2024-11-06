import {addErrorContext, last, Throttler} from '@subsquid/util-internal'
import {Batch, DataSource} from '@subsquid/util-internal-processor-tools'
import {getRequestAt, RangeRequest} from '@subsquid/util-internal-range'
import assert from 'assert'
import {Bytes32} from '../interfaces/base'
import {DataRequest} from '../interfaces/data-request'
import {Block} from '../mapping/entities'
import {mapBlock} from './mapping'
import {PortalClient} from '@subsquid/portal-client'


const NO_FIELDS = {}


export class EvmPortal implements DataSource<Block, DataRequest> {
    constructor(private client: PortalClient) {}

    getFinalizedHeight(): Promise<number> {
        return this.client.getHeight()
    }

    async getBlockHash(height: number): Promise<Bytes32> {
        let blocks = await this.client.query({
            fromBlock: height,
            toBlock: height,
            includeAllBlocks: true
        })
        assert(blocks.length == 1)
        return blocks[0].header.hash
    }

    async *getFinalizedBlocks(requests: RangeRequest<DataRequest>[], stopOnHead?: boolean | undefined): AsyncIterable<Batch<Block>> {
        let height = new Throttler(() => this.client.getHeight(), 20_000)
    
        let top = await height.get()
        for (let req of requests) {
            let beg = req.range.from
            let fields = getRequestAt(requests, beg)?.fields || NO_FIELDS

            if (top < beg && stopOnHead) return

            for await (let batch of this.client.stream({
                fromBlock: req.range.from,
                toBlock: req.range.to,
                ...req.request
            }, stopOnHead)) {
                assert(batch.length > 0, 'boundary blocks are expected to be included')
                let lastBlock = last(batch).header.number
                assert(lastBlock >= beg)
                beg = lastBlock + 1

                let blocks = batch.map(b => {
                    try {
                        return mapBlock(b, fields)
                    } catch(err: any) {
                        throw addErrorContext(err, {
                            blockHeight: b.header.number,
                            blockHash: b.header.hash
                        })
                    }
                })

                yield {
                    blocks,
                    isHead: beg > top
                }

                top = await height.get()
            }
        }
    }
}

