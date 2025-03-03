import {assertNotNull, last} from '@subsquid/util-internal'
import {applyRangeBound, mapRangeRequestList, RangeRequestList} from '@subsquid/util-internal-range'
import {array, cast} from '@subsquid/util-internal-validation'
import assert from 'assert'
import {PartialBlock} from '../data/partial'
import {DataRequest} from '../data/request'
import {getDataSchema} from './schema'
import {PortalClient, isForkException as isPortalForkException} from '@subsquid/portal-client'
import {BlockRef, DataSource, ForkException, DataSourceStreamOptions, DataSourceStream} from '@subsquid/util-internal-data-source'
import {BlockHeader} from '../data/model'

export class PortalDataSource implements DataSource<PartialBlock> {
    constructor(private client: PortalClient, private requests: RangeRequestList<DataRequest>) {}

    getHead(): Promise<BlockRef | undefined> {
        return this.client.getHead()
    }
    getFinalizedHead(): Promise<BlockRef | undefined> {
        return this.client.getFinalizedHead()
    }

    async getBlockHash(height: number): Promise<string | undefined> {
        let blocks = await this.client.getQuery({
            type: 'solana',
            fromBlock: height,
            toBlock: height,
            fields: {
                block: {
                    number: true,
                    hash: true,
                },
            },
            includeAllBlocks: true,
        })
        assert(blocks.length == 1)
        return blocks[0].header.hash
    }

    async getFinalizedHeight() {
        const r = await this.client.getFinalizedHead()
        return r?.number ?? -1
    }

    async getBlockHeader(height: number): Promise<BlockHeader> {
        let blocks = await this.client.getQuery({
            type: 'solana',
            fromBlock: height,
            toBlock: height,
            includeAllBlocks: true,
            fields: {
                block: {
                    hash: true,
                    number: true,
                    height: true,
                    // parentNumber: true,
                    parentHash: true,
                    timestamp: true,
                },
            },
        })
        assert(blocks.length == 1)
        return blocks[0].header as BlockHeader
    }

    getFinalizedStream(req: DataSourceStreamOptions): DataSourceStream<PartialBlock> {
        throw new Error('Method not implemented.')
    }

    async *getStream(opts?: DataSourceStreamOptions) {
        let requests = applyRangeBound(this.requests, opts?.range)

        let archiveRequests = mapRangeRequestList(requests, (req) => {
            let {fields, includeAllBlocks, ...items} = req
            let archiveItems: Record<string, any> = {}
            let key: keyof typeof items
            for (key in items) {
                archiveItems[key] = items[key]?.map((it) => ({...it.where, ...it.include}))
            }
            return {
                type: 'solana',
                fields: {
                    block: {...fields?.block, number: true, hash: true, parentHash: true},
                    transaction: {...fields?.transaction, transactionIndex: true},
                    instruction: {...fields?.instruction, transactionIndex: true, instructionAddress: true},
                    log: {...fields?.log, instructionAddress: true, logIndex: true, transactionIndex: true},
                    balance: {...fields?.balance, transactionIndex: true, account: true},
                    tokenBalance: {...fields?.tokenBalance, transactionIndex: true, account: true},
                    reward: {...fields?.reward, pubkey: true},
                },
                includeAllBlocks,
                ...archiveItems,
            }
        })

        try {
            let parentBlockNumber = (opts?.range?.from ?? 0) - 1
            let parentBlockHash = opts?.parentHash

            for (let req of archiveRequests) {
                // if ranges have gaps, we need to ensure continuaty
                if (parentBlockHash != null && parentBlockNumber + 1 < req.range.from) {
                    let endBlock = req.range.from - 1
                    let q = {
                        type: 'solana',
                        fromBlock: parentBlockNumber,
                        toBlock: endBlock,
                        parentBlockHash,
                        fields: {
                            block: {number: true, hash: true},
                        },
                    }

                    for await (let data of this.client.getStream(q)) {
                        let finalizedHead = data.finalizedHead
                        if (finalizedHead != null && finalizedHead.number >= parentBlockNumber) {
                            // the gap is already finalized, we can skip it
                            parentBlockNumber = endBlock
                            parentBlockHash = undefined
                            break
                        } else if (data.blocks.length > 0) {
                            let lastBlock = last(data.blocks).header
                            parentBlockNumber = lastBlock.number
                            parentBlockHash = lastBlock.hash
                        }
                    }
                }

                let stream = this.client.getStream(
                    {
                        ...req.request,
                        fromBlock: req.range.from,
                        toBlock: req.range.to,
                        parentBlockHash: parentBlockHash,
                    },
                    {stopOnHead: opts?.stopOnHead}
                )

                let fields = assertNotNull(req?.request.fields)
                let schema = array(getDataSchema(fields))
                for await (let batch of stream) {
                    let blocks = cast(schema, batch.blocks).map((b) => {
                        let {header, ...items} = b
                        return {
                            header,
                            transactions: items.transactions || [],
                            instructions: items.instructions || [],
                            logs: items.logs || [],
                            balances: items.balances || [],
                            tokenBalances: items.tokenBalances || [],
                            rewards: items.rewards || [],
                        }
                    })

                    yield {
                        blocks,
                        finalizedHead: batch.finalizedHead,
                    }

                    if (blocks.length > 0) {
                        let lastBlock = last(blocks).header
                        parentBlockNumber = lastBlock.number
                        parentBlockHash = lastBlock.hash
                    }
                }

                // FIXME: don't like this solution
                if (!stream[PortalClient.completed]) {
                    assert(opts?.stopOnHead, 'unexpected end of stream')
                    break
                }
            }
        } catch (e: unknown) {
            if (isPortalForkException(e)) {
                throw new ForkException(e.query.parentBlockHash, e.query.fromBlock, e.lastBlocks)
            }

            throw e
        }
    }
}
