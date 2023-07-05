import {OldSpecsBundle, OldTypesBundle} from '@subsquid/substrate-metadata'
import {Hash, runtimeVersionEquals} from '@subsquid/substrate-raw-data'
import * as raw from '@subsquid/substrate-raw-data'
import {last} from '@subsquid/util-internal'
import {Runtime} from './runtime'


interface Entry {
    height: number
    runtime: Runtime
}


export class RuntimeTracker {
    private cache: Entry[] = []

    constructor(
        private rpc: raw.Rpc,
        private typesBundle?: OldTypesBundle | OldSpecsBundle
    ) {}

    async getRuntime(block: raw.BlockData) {
        if (block.height == 0) {
            let metadata = block.metadata ?? await this.rpc.getMetadata(block.hash)
            let runtimeVersion = block.runtimeVersion ?? await this.rpc.getRuntimeVersion(block.hash)
            let runtime = new Runtime(runtimeVersion, metadata, this.typesBundle)
            this.cache = [{height: 0, runtime}]
            return runtime
        }

        let height = block.height - 1
        while (this.cache.length && last(this.cache).height > height) {
            this.cache.pop()
        }

        if (this.cache.length > 0) {
            let prev = last(this.cache)
            if (prev.height == height) return prev.runtime

            let blockRuntimeVersion = block.runtimeVersion ?? await this.rpc.getRuntimeVersion(block.hash)
            if (runtimeVersionEquals(prev.runtime, blockRuntimeVersion)) return prev.runtime

            let parentHash = block.block.block.header.parentHash
            let parentRuntimeVersion = await this.rpc.getRuntimeVersion(parentHash)
            if (runtimeVersionEquals(parentRuntimeVersion, prev.runtime)) return prev.runtime
        }

        return this.fetchRuntime(height, block.block.block.header.parentHash)
    }

    private async fetchRuntime(height: number, hash: Hash): Promise<Runtime> {
        let metadata = await this.rpc.getMetadata(hash)
        let runtimeVersion = await this.rpc.getRuntimeVersion(hash)
        let runtime = new Runtime(runtimeVersion, metadata, this.typesBundle)
        this.cache.push({height, runtime})
        if (this.cache.length > 2) {
            this.cache.shift()
        }
        return runtime
    }
}
