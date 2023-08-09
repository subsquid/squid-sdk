import {Hash, HashAndHeight, Prev, Rpc, runtimeVersionEquals, RuntimeVersionId} from '@subsquid/substrate-data-raw'
import {OldSpecsBundle, OldTypesBundle} from '@subsquid/substrate-metadata'
import {annotateAsyncError} from '@subsquid/util-internal'
import {Runtime} from './runtime'


interface Header extends HashAndHeight {
    parentHash: Hash
}


export interface WithRuntime {
    runtime?: Runtime
    runtimeOfPrevBlock?: Runtime
}


export class RuntimeTracker<B extends WithRuntime> {
    private prev = new Prev<Runtime>()

    constructor(
        private getBlockHeader: (block: B) => Header,
        private getBlockRuntimeVersion: (block: B) => RuntimeVersionId,
        private rpc: Rpc,
        private typesBundle?: OldTypesBundle | OldSpecsBundle
    ) {
    }

    async setRuntime(blocks: B[]): Promise<void> {
        if (blocks.length == 0) return

        let parentParentHeight = Math.max(0, this.getBlockHeader(blocks[0]).height - 2)
        let prev = this.prev.getItem(parentParentHeight)
        if (prev == null) {
            prev = await this.fetchRuntime(await this.getParent(getParent(this.getBlockHeader(blocks[0]))))
        }

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            let header = this.getBlockHeader(block)
            let parentParentHeight = Math.max(0, header.height - 2)
            let parentHeight = Math.max(0, header.height - 1)
            let rtv = this.getBlockRuntimeVersion(block)

            if (runtimeVersionEquals(prev.value, rtv) || prev.height == parentParentHeight) {
                block.runtimeOfPrevBlock = prev.value
            } else {
                prev = await this.fetchRuntime(await this.getParent(getParent(header)))
                block.runtimeOfPrevBlock = prev.value
            }

            if (runtimeVersionEquals(prev.value, rtv)) {
                block.runtime = prev.value
                prev = {
                    height: parentHeight,
                    value: prev.value
                }
            } else {
                prev = await this.fetchRuntime(getParent(header))
                block.runtime = prev.value
            }
        }
    }

    @annotateAsyncError(getRefCtx)
    private async fetchRuntime(
        ref: HashAndHeight
    ): Promise<{height: number, value: Runtime}> {
        let [runtimeVersion, metadata] = await Promise.all([
            this.rpc.getRuntimeVersion(ref.hash),
            this.rpc.getMetadata(ref.hash)
        ])
        let runtime = new Runtime(runtimeVersion, metadata, this.typesBundle)
        this.prev.set(ref.height, runtime)
        return {height: ref.height, value: runtime}
    }

    private async getParent(ref: HashAndHeight): Promise<HashAndHeight> {
        if (ref.height == 0) return ref
        let header = await this.rpc.getBlockHeader(ref.hash)
        return {
            height: ref.height - 1,
            hash: header.parentHash
        }
    }
}


function getParent(header: Header): HashAndHeight {
    if (header.height == 0) return header
    return {
        height: header.height - 1,
        hash: header.parentHash
    }
}


function getRefCtx(ref: HashAndHeight) {
    return {
        blockHeight: ref.height,
        blockHash: ref.hash
    }
}
