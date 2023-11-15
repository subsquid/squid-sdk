import {Hash, Prev, PrevItem, Rpc, runtimeVersionEquals, RuntimeVersionId} from '@subsquid/substrate-data-raw'
import {Runtime} from '@subsquid/substrate-runtime'
import {OldSpecsBundle, OldTypesBundle} from '@subsquid/substrate-runtime/lib/metadata'
import {annotateAsyncError} from '@subsquid/util-internal'
import {HashAndHeight, setInvalid} from '@subsquid/util-internal-ingest-tools'


interface Header extends HashAndHeight {
    parentHash: Hash
}


export interface WithRuntime {
    runtime?: Runtime
    runtimeOfPrevBlock?: Runtime
    _isInvalid?: boolean
}


export class RuntimeTracker<B extends WithRuntime> {
    private prev = new Prev<Runtime>()

    constructor(
        private rpc: Rpc,
        private getBlockHeader: (block: B) => Header,
        private getBlockRuntimeVersion: (block: B) => RuntimeVersionId,
        private typesBundle?: OldTypesBundle | OldSpecsBundle
    ) {
    }

    async setRuntime(blocks: B[]): Promise<void> {
        if (blocks.length == 0 || blocks[0]._isInvalid) return

        let prev: PrevItem<Runtime>
        let parentParentHeight = Math.max(0, this.getBlockHeader(blocks[0]).height - 2)
        let maybePrev = this.prev.getItem(parentParentHeight)
        if (maybePrev == null) {
            let parentParentRef = await this.getParent(getParent(this.getBlockHeader(blocks[0])))
            if (parentParentRef == null) return setInvalid(blocks)
            maybePrev = await this.fetchRuntime(parentParentRef)
            if (maybePrev == null) return setInvalid(blocks)
            prev = maybePrev
        } else {
            prev = maybePrev
        }

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            if (block._isInvalid) return
            let header = this.getBlockHeader(block)
            let parentParentHeight = Math.max(0, header.height - 2)
            let parentHeight = Math.max(0, header.height - 1)
            let rtv = this.getBlockRuntimeVersion(block)

            if (runtimeVersionEquals(prev.value, rtv) || prev.height == parentParentHeight) {
                block.runtimeOfPrevBlock = prev.value
            } else {
                let parentParentRef = await this.getParent(getParent(header))
                if (parentParentRef == null) return setInvalid(blocks, i)
                let maybePrev = await this.fetchRuntime(parentParentRef)
                if (maybePrev == null) return setInvalid(blocks, i)
                prev = maybePrev
                block.runtimeOfPrevBlock = prev.value
            }

            if (runtimeVersionEquals(prev.value, rtv)) {
                block.runtime = prev.value
                prev = {
                    height: parentHeight,
                    value: prev.value
                }
            } else {
                let maybePrev = await this.fetchRuntime(getParent(header))
                if (maybePrev == null) return setInvalid(blocks, i)
                prev = maybePrev
                block.runtime = prev.value
            }
        }
    }

    @annotateAsyncError(getRefCtx)
    private async fetchRuntime(
        ref: HashAndHeight
    ): Promise<{height: number, value: Runtime} | undefined> {
        let [runtimeVersion, metadata] = await Promise.all([
            this.rpc.getRuntimeVersion(ref.hash),
            this.rpc.getMetadata(ref.hash)
        ])
        if (runtimeVersion == null || metadata == null) return undefined
        let runtime = new Runtime(runtimeVersion, metadata, this.typesBundle, this.rpc.client)
        this.prev.set(ref.height, runtime)
        return {height: ref.height, value: runtime}
    }

    private async getParent(ref: HashAndHeight): Promise<HashAndHeight | null> {
        if (ref.height == 0) return ref
        let header = await this.rpc.getBlockHeader(ref.hash)
        if (header == null) return null
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
