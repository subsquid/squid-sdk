import {BlockHeader} from '@subsquid/solana-normalization'
import {Base58Bytes} from '@subsquid/solana-rpc-data'
import {assertNotNull, last} from '@subsquid/util-internal'
import {mapRangeRequestList, RangeRequestList} from '@subsquid/util-internal-range'
import {array, cast} from '@subsquid/util-internal-validation'
import assert from 'assert'
import {PartialBlock} from '../data/partial'
import {DataRequest} from '../data/request'
import {getDataSchema} from './schema'
import {PortalClient} from '@subsquid/portal-client'

export class SolanaPortal {
    constructor(private client: PortalClient) {}

    getFinalizedHeight(): Promise<number> {
        return this.client.getFinalizedHeight()
    }

    async getBlockHash(height: number): Promise<Base58Bytes | undefined> {
        let blocks = await this.client.getFinalizedQuery({
            type: 'solana',
            fromBlock: height,
            toBlock: height,
            fields: {
                block: {
                    hash: true,
                },
            },
            includeAllBlocks: true,
        })
        assert(blocks.length == 1)
        return blocks[0].header.hash
    }

    async getBlockHeader(height: number): Promise<BlockHeader> {
        let blocks = await this.client.getFinalizedQuery({
            type: 'solana',
            fromBlock: height,
            toBlock: height,
            includeAllBlocks: true,
            fields: {
                block: {
                    hash: true,
                    number: true,
                    slot: true,
                    parentSlot: true,
                    parentHash: true,
                    timestamp: true,
                },
            },
        })
        assert(blocks.length == 1)
        let {number, ...rest} = blocks[0].header
        return {
            height: number,
            ...rest,
        } as BlockHeader
    }

    async *getBlockStream(
        requests: RangeRequestList<DataRequest>,
        stopOnHead?: boolean | undefined
    ): AsyncIterable<PartialBlock[]> {
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

        for (let req of archiveRequests) {
            let lastBlock = req.range.from - 1
            let endBlock = req.range.to || Infinity
            let query = {
                fromBlock: lastBlock + 1,
                toBlock: endBlock,
                ...req.request,
            }

            for await (let {blocks: batch} of this.client.getFinalizedStream(query, {stopOnHead})) {
                assert(batch.length > 0, 'boundary blocks are expected to be included')
                lastBlock = last(batch).header.number

                let blocks = cast(array(getDataSchema(assertNotNull(req?.request.fields))), batch).map((b) => {
                    let {
                        header: {number, ...hdr},
                        ...items
                    } = b
                    return {
                        header: {height: number, ...hdr},
                        transactions: items.transactions || [],
                        instructions: items.instructions || [],
                        logs: items.logs || [],
                        balances: items.balances || [],
                        tokenBalances: items.tokenBalances || [],
                        rewards: items.rewards || [],
                    }
                })

                yield blocks
            }

            // stream ended before requested range,
            // which means we reached the last available block
            // should not happen if stopOnHead is set to false
            if (lastBlock < endBlock) {
                assert(stopOnHead, 'unexpected end of stream')
                break
            }
        }
    }
}
