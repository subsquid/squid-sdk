import {last} from '@subsquid/util-internal'
import {SplitRequest} from '@subsquid/util-internal-range'
import assert from 'assert'
import {BlockData, Bytes, DataRequest, RuntimeVersion} from './interfaces'
import {Rpc} from './rpc'
import {Prev, runtimeVersionEquals} from './util'


export interface Stride extends SplitRequest<DataRequest> {
    lastBlock?: BlockData
}


export class Fetcher {
    private prevRuntimeVersion = new Prev<RuntimeVersion>()

    constructor(private rpc: Rpc) {}

    async getStride1(s: Stride): Promise<BlockData[]> {
        let blocks = await this.getStride0(s)
        await this.fetch1(blocks, s.request)
        return blocks
    }

    async getStride0(s: Stride): Promise<BlockData[]> {
        let blocks: BlockData[] = new Array(s.range.to - s.range.from + 1)
        if (s.lastBlock) {
            assert(s.range.to === s.lastBlock.height)
            if (matchesRequest0(s.lastBlock, s.request)) {
                blocks[blocks.length - 1] = s.lastBlock
            } else {
                blocks[blocks.length - 1] = await this.rpc.getBlock0(s.lastBlock.hash, s.request)
            }
        } else {
            let hash = await this.rpc.getBlockHash(s.range.to)
            blocks[blocks.length - 1] = await this.rpc.getBlock0(hash, s.request)
        }
        for (let i = blocks.length - 2; i >= 0; i--) {
            blocks[i] = await this.rpc.getBlock0(blocks[i + 1].block.block.header.parentHash, s.request)
        }
        return blocks
    }

    async fetch1(blocks: BlockData[], req: DataRequest): Promise<void> {
        let tasks: Promise<void>[] = []

        if (req.events) {
            tasks.push(this.fetchEvents(blocks))
        }

        if (req.trace != null) {
            tasks.push(this.fetchTrace(blocks, req.trace))
        }

        await Promise.all(tasks)
    }

    private async fetchEvents(blocks: BlockData[]): Promise<void> {
        let call = blocks.map(b => ({
            method: 'state_getStorage',
            params: [
                '0x26aa394eea5630e07c48ae0c9558cef780d41e5e16056765bc8461851072c9d7',
                b.hash
            ]
        }))

        let events: Bytes[] = await this.rpc.batchCall(call)

        for (let i = 0; i < blocks.length; i++) {
            blocks[i].events = events[i]
        }
    }

    private fetchTrace(blocks: BlockData[], targets: string): Promise<void> {
        return Promise.all(blocks.map(b => {
            return this.rpc.call('state_traceBlock', [
                b.hash,
                targets,
                '',
                ''
            ])
        })).then()
    }

    async fetchRuntimeVersion(blocks: BlockData[]): Promise<void> {
        if (blocks.length == 0) return

        let prev = this.prevRuntimeVersion.get(blocks[0].height)
        if (prev == null) {
            prev = blocks[0].runtimeVersion = await this.rpc.getRuntimeVersion(blocks[0].hash)
            this.prevRuntimeVersion.set(blocks[0].height, prev)
        }

        let lastBlock = last(blocks)
        if (lastBlock.runtimeVersion == null) {
            lastBlock.runtimeVersion = await this.rpc.getRuntimeVersion(lastBlock.hash)
        }

        for (let block of blocks) {
            if (block.runtimeVersion == null) {
                block.runtimeVersion = runtimeVersionEquals(prev, lastBlock.runtimeVersion)
                    ? prev
                    : await this.rpc.getRuntimeVersion(block.hash)
            }
            if (runtimeVersionEquals(prev, block.runtimeVersion)) {
                block.runtimeVersion = prev
            } else {
                prev = block.runtimeVersion
                this.prevRuntimeVersion.set(block.height, prev)
            }
        }
    }
}

export function matchesRequest0(block: BlockData, request?: DataRequest): boolean {
    return !!block.block.block.extrinsics || !request?.extrinsics
}
