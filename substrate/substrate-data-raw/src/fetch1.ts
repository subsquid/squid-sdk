import {RpcCall} from '@subsquid/rpc-client/lib/interfaces'
import {last} from '@subsquid/util-internal'
import {
    assertIsValid,
    BlockConsistencyError,
    HashAndHeight,
    setInvalid,
    trimInvalid
} from '@subsquid/util-internal-ingest-tools'
import assert from 'assert'
import {BlockData, DataRequest, DataRequest0, Hash, PartialBlockData} from './interfaces'
import {captureMissingBlock, Rpc} from './rpc'
import {qty2Int, toQty} from './util'


export class Fetch1 {
    constructor(private rpc: Rpc) {}

    async getColdSplit0(from: number, to: number | HashAndHeight, req: DataRequest0): Promise<BlockData[]> {
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

    async getColdSplit(from: number, to: number | HashAndHeight, req: DataRequest): Promise<BlockData[]> {
        let blocks = await this.getColdSplit0(from, to, req)
        await this.addRequestedData(blocks, req)
        assertIsValid(blocks)
        return blocks
    }

    async getHotSplit(from: number, to: number | PartialBlockData, req: DataRequest): Promise<BlockData[]> {
        let heads = await this.getHotHeads(from, to)

        await Promise.all([
            this.addBlock(heads, req),
            this.addRequestedData(heads, req)
        ])

        let blocks = trimInvalid(heads) as BlockData[]

        for (let i = 1; i < blocks.length; i++) {
            if (blocks[i].block.block.header.parentHash !== blocks[i-1].hash) return blocks.slice(0, i)
        }

        return blocks
    }

    private async addBlock(blocks: PartialBlockData[], req: DataRequest): Promise<void> {
        if (blocks.length == 0) return
        let last = blocks.length - 1
        let lastBlock = blocks[last]
        if (lastBlock.block && (lastBlock.block.block.extrinsics || !req.extrinsics)) {
            last -= 1
        }

        let call: RpcCall[] = []
        for (let i = 0; i <= last; i++) {
            let block = blocks[i]
            if (req.extrinsics) {
                call.push({
                    method: 'chain_getBlock',
                    params: [block.hash]
                })
            } else {
                call.push({
                    method: 'chain_getHeader',
                    params: [block.hash]
                })
            }
        }

        let batch = await this.rpc.batchCall(call)

        for (let i = 0; i < batch.length; i++) {
            let block = batch[i]
            if (block == null) return setInvalid(blocks, i)
            if (req.extrinsics) {
                blocks[i].block = block
            } else {
                blocks[i].block = {
                    block: {header: block}
                }
            }
        }
    }

    private async getHotHeads(from: number, to: number | PartialBlockData): Promise<PartialBlockData[]> {
        let top = typeof to == 'number' ? to: to.height
        if (from > top) {
            from = top
        }

        let blocks: PartialBlockData[]
        if (typeof to == 'object') {
            if (to.block) {
                let missingHashHeight = to.height - 2
                if (missingHashHeight - from >= 0) {
                    blocks = await this.getHashes(from, missingHashHeight)
                } else {
                    blocks = []
                }
                if (from < to.height) blocks.push({
                    height: to.height - 1,
                    hash: to.block.block.header.parentHash
                })
                blocks.push(to)
            } else {
                let missingHashHeight = to.height - 1
                if (missingHashHeight - from >= 0) {
                    blocks = await this.getHashes(from, missingHashHeight)
                } else {
                    blocks = []
                }
                blocks.push(to)
            }
        } else {
            blocks = await this.getHashes(from, to)
        }

        for (let i = 1; i < blocks.length; i++) {
            if (blocks[i].height - blocks[i-1].height != 1) return blocks.slice(0, i)
        }

        return blocks
    }

    private async getHashes(from: number, to: number): Promise<HashAndHeight[]> {
        let call: RpcCall[] = []
        for (let height = from; height <= to; height++) {
            call.push({
                method: 'chain_getBlockHash',
                params: [toQty(height)]
            })
        }
        let hashes: (Hash | null)[] = await this.rpc.batchCall(call)
        let heads: HashAndHeight[] = []
        for (let i = 0; i < hashes.length; i++) {
            let height = from + i
            let hash = hashes[i]
            if (hash == null) return heads
            heads.push({hash, height})
        }
        return heads
    }

    async addRequestedData(blocks: PartialBlockData[], req: DataRequest): Promise<void> {
        if (blocks.length == 0) return

        let tasks: Promise<void>[] = []

        if (req.events) {
            tasks.push(this.addEvents(blocks))
        }

        if (req.trace != null) {
            tasks.push(this.addTrace(blocks, req.trace))
        }

        if (req.runtimeVersion) {
            let block = last(blocks)
            tasks.push(
                this.rpc.getRuntimeVersion(block.hash).then(v => {
                    if (v == null) {
                        block._isInvalid = true
                    } else {
                        block.runtimeVersion = v
                    }
                })
            )
        }

        await Promise.all(tasks)
    }

    private async addEvents(blocks: PartialBlockData[]): Promise<void> {
        let events = await this.rpc.getStorageMany(blocks.map(b => {
            return [
                '0x26aa394eea5630e07c48ae0c9558cef780d41e5e16056765bc8461851072c9d7',
                b.hash
            ]
        }))

        for (let i = 0; i < blocks.length; i++) {
            let bytes = events[i]
            if (bytes === undefined) {
                blocks[i]._isInvalid = true
            } else {
                blocks[i].events = bytes
            }
        }
    }

    private async addTrace(blocks: PartialBlockData[], targets: string): Promise<void> {
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
