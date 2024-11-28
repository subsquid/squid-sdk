import {addErrorContext, last, Throttler} from '@subsquid/util-internal'
import {Batch, DataSource} from '@subsquid/util-internal-processor-tools'
import {RangeRequest} from '@subsquid/util-internal-range'
import assert from 'assert'
import {Bytes32} from '../interfaces/base'
import {DataRequest} from '../interfaces/data-request'
import {Block} from '../mapping/entities'
import {mapBlock} from './mapping'
import {PortalClient} from '@subsquid/portal-client'
import {FieldSelection} from '../interfaces/data'


const ALWAYS_SELECTED_FIELDS = {
    block: {
        number: true,
        hash: true,
        parentHash: true,
    },
    transaction: {
        transactionIndex: true,
    },
    log: {
        logIndex: true,
        transactionIndex: true,
    },
    trace: {
        transactionIndex: true,
        traceAddress: true,
        type: true,
    },
    stateDiff: {
        transactionIndex: true,
        address: true,
        key: true,
    },
} as const


function addAlwaysSelectedFields(fields?: FieldSelection): FieldSelection {
    return {
        block: {...fields?.block, ...ALWAYS_SELECTED_FIELDS.block},
        transaction: {...fields?.transaction, ...ALWAYS_SELECTED_FIELDS.transaction},
        log: {...fields?.log, ...ALWAYS_SELECTED_FIELDS.log},
        trace: {...fields?.trace, ...ALWAYS_SELECTED_FIELDS.trace},
        stateDiff: {...fields?.stateDiff, ...ALWAYS_SELECTED_FIELDS.stateDiff, kind: true}
    }
}


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
            let fromBlock = req.range.from
            let toBlock = req.range.to
            let fields = addAlwaysSelectedFields(req.request.fields)

            if (top < fromBlock && stopOnHead) return

            for await (let batch of this.client.stream({
                ...req.request,
                type: 'evm',
                fromBlock,
                toBlock,
                fields,
            }, stopOnHead)) {
                assert(batch.length > 0, 'boundary blocks are expected to be included')
                let lastBlock = last(batch).header.number
                assert(lastBlock >= fromBlock)
                fromBlock = lastBlock + 1

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
                    isHead: fromBlock > top
                }

                top = await height.get()
            }
        }
    }
}

