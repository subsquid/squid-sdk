import {assertIsValid, BlockConsistencyError} from '@subsquid/util-internal-ingest-tools'
import assert from 'assert'
import {BlockData, DataRequest0, DataRequest1, Hash, HashAndHeight} from './interfaces'
import {captureMissingBlock, Rpc} from './rpc'
import {qty2Int} from './util'


export class Fetch1 {
    constructor(private rpc: Rpc) {}

    async getSplit0(from: number, to: number | HashAndHeight, req: DataRequest0): Promise<BlockData[]> {
        let top = typeof to == 'number' ? to : to.height
        assert(from <= top)

        let hash: Hash
        if (typeof to == 'number') {
            hash = await this.rpc.getBlockHash(top).then(hash => {
                if (hash == null) throw new BlockConsistencyError({height: top})
                return hash
            })
        } else {
            hash = to.hash
        }

        let blocks: BlockData[] = new Array(top - from + 1)
        for (let i = blocks.length - 1; i >= 0; i--) {
            let block = await this.getBlock0(hash, req)
            if (block == null) throw new BlockConsistencyError({hash, height: from + i})
            blocks[i] = block
            hash = block.block.block.header.parentHash
        }

        return blocks
    }

    async getBlock0(blockHash: Hash, req: DataRequest0): Promise<BlockData | undefined> {
        if (req.extrinsics) {
            let block = await this.rpc.getBlock(blockHash)
            if (block == null) return
            return {
                height: qty2Int(block.block.header.number),
                hash: blockHash,
                block
            }
        } else {
            let header = await this.rpc.getBlockHeader(blockHash)
            if (header == null) return
            return {
                height: qty2Int(header.number),
                hash: blockHash,
                block: {
                    block: {header}
                }
            }
        }
    }

    async getSplit(from: number, to: number | HashAndHeight, req: DataRequest1): Promise<BlockData[]> {
        let blocks = await this.getSplit0(from, to, req)
        await this.addRequestedData(blocks, req)
        assertIsValid(blocks)
        return blocks
    }

    async addRequestedData(blocks: BlockData[], req: DataRequest1): Promise<void> {
        if (blocks.length == 0) return

        let tasks: Promise<void>[] = []

        if (req?.events) {
            tasks.push(this.addEvents(blocks))
        }

        if (req?.trace != null) {
            tasks.push(this.addTrace(blocks, req.trace))
        }

        await Promise.all(tasks)
    }

    private async addEvents(blocks: BlockData[]): Promise<void> {
        let events = await this.rpc.getStorageMany(blocks.map(b => {
            return [
                '0x26aa394eea5630e07c48ae0c9558cef780d41e5e16056765bc8461851072c9d7',
                b.hash
            ]
        }))

        for (let i = 0; i < blocks.length; i++) {
            let bytes = events[i]
            if (bytes == null) {
                blocks[i]._isInvalid = true
            } else {
                blocks[i].events = bytes
            }
        }
    }

    private async addTrace(blocks: BlockData[], targets: string): Promise<void> {
        let tasks = []
        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            if (block.height != 0) {
                tasks.push(this.rpc.call('state_traceBlock', [
                    block.hash,
                    targets,
                    '',
                    ''
                ], {
                    validateError: captureMissingBlock
                }).then(trace => {
                    if (trace === undefined) {
                        block._isInvalid = true
                    } else {
                        block.trace = trace
                    }
                }))
            }
        }
        await Promise.all(tasks)
    }
}
