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

function getFields(fields?: FieldSelection): FieldSelection {
    return {
        block: {...fields?.block, ...ALWAYS_SELECTED_FIELDS.block},
        transaction: {...fields?.transaction, ...ALWAYS_SELECTED_FIELDS.transaction},
        log: {...fields?.log, ...ALWAYS_SELECTED_FIELDS.log},
        trace: {...fields?.trace, ...ALWAYS_SELECTED_FIELDS.trace},
        stateDiff: {...fields?.stateDiff, ...ALWAYS_SELECTED_FIELDS.stateDiff, kind: true},
    }
}

function makeQuery(req: RangeRequest<DataRequest>) {
    let {fields, ...request} = req.request

    return {
        type: 'evm',
        fromBlock: req.range.from,
        toBlock: req.range.to,
        fields: getFields(fields),
        ...request,
    }
}

export class EvmPortal implements DataSource<Block, DataRequest> {
    constructor(private client: PortalClient) {}

    getFinalizedHeight(): Promise<number> {
        return this.client.getHeight()
    }

    async getBlockHash(height: number): Promise<Bytes32> {
        let query = makeQuery({
            range: {from: height, to: height},
            request: {includeAllBlocks: true},
        })
        let blocks = await this.client.query(query)
        assert(blocks.length == 1)
        return blocks[0].header.hash
    }

    async *getFinalizedBlocks(
        requests: RangeRequest<DataRequest>[],
        stopOnHead?: boolean | undefined
    ): AsyncIterable<Batch<Block>> {
        let height = new Throttler(() => this.client.getHeight(), 20_000)

        let top = await height.get()
        for (let req of requests) {
            let from = req.range.from
            let to = req.range.to
            if (top < from && stopOnHead) return

            let query = makeQuery({
                ...req,
                range: {from, to},
            })
            for await (let batch of this.client.stream(query, stopOnHead)) {
                assert(batch.length > 0, 'boundary blocks are expected to be included')
                let lastBlock = last(batch).header.number
                assert(lastBlock >= from)
                from = lastBlock + 1

                let blocks = batch.map((b) => {
                    try {
                        return mapBlock(b, req.request.fields || {})
                    } catch (err: any) {
                        throw addErrorContext(err, {
                            blockHeight: b.header.number,
                            blockHash: b.header.hash,
                        })
                    }
                })

                yield {
                    blocks,
                    isHead: from > top,
                }

                top = await height.get()
            }
        }
    }
}
