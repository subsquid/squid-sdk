import {setInvalid} from '@subsquid/util-internal-ingest-tools'
import {BlockData, RuntimeVersion} from './interfaces'
import {Rpc} from './rpc'
import {Prev, runtimeVersionEquals} from './util'


export class RuntimeVersionTracker {
    private prevRuntimeVersion = new Prev<RuntimeVersion>()

    async addRuntimeVersion(rpc: Rpc, blocks: BlockData[]): Promise<void> {
        if (blocks.length == 0) return

        let prev: RuntimeVersion
        let maybePrev = this.prevRuntimeVersion.get(blocks[0].height)
        if (maybePrev == null) {
            let v = blocks[0].runtimeVersion || await rpc.getRuntimeVersion(blocks[0].hash)
            if (v == null) return setInvalid(blocks)
            prev = blocks[0].runtimeVersion = v
            this.prevRuntimeVersion.set(blocks[0].height, prev)
        } else {
            prev = maybePrev
        }

        let last = blocks.length - 1
        let lastRuntimeVersion: RuntimeVersion | undefined
        while (last >= 0) {
            let block = blocks[last]
            if (block.runtimeVersion == null) {
                lastRuntimeVersion = await rpc.getRuntimeVersion(block.hash)
                if (lastRuntimeVersion) {
                    block.runtimeVersion = lastRuntimeVersion
                    break
                } else {
                    last -= 1
                }
            } else {
                lastRuntimeVersion = block.runtimeVersion
                break
            }
        }

        if (lastRuntimeVersion == null) return setInvalid(blocks)

        for (let i = 0; i < last; i++) {
            let block = blocks[i]
            if (block.runtimeVersion == null) {
                if (runtimeVersionEquals(prev, lastRuntimeVersion)) {
                    block.runtimeVersion = prev
                } else {
                    block.runtimeVersion = await rpc.getRuntimeVersion(block.hash)
                    if (block.runtimeVersion == null) return setInvalid(blocks, i)
                }
            }
            if (runtimeVersionEquals(prev, block.runtimeVersion)) {
                // maintain same object reference
                block.runtimeVersion = prev
            } else {
                prev = block.runtimeVersion
                this.prevRuntimeVersion.set(block.height, prev)
            }
        }
    }
}
