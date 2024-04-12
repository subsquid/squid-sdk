import {createLogger} from '@subsquid/logger'
import {last} from '@subsquid/util-internal'
import assert from 'assert'
import {HeightAndSlot} from './fetch'
import {Rpc} from './rpc'


const log = createLogger('sqd:solana-data')


export function findSlot(rpc: Rpc, height: number, bottom: HeightAndSlot, top: HeightAndSlot): Promise<number> {
    return new SlotSearch(rpc, height).search(bottom, top)
}


class SlotSearch {
    constructor(
        private rpc: Rpc,
        private height: number
    ) {}

    async search(bottom: HeightAndSlot, top: HeightAndSlot): Promise<number> {
        if (bottom.height == this.height) return bottom.slot
        if (top.height == this.height) return top.slot
        if (top.slot - bottom.slot == top.height - bottom.height) return bottom.slot + this.height - bottom.height

        log.debug({
            height: this.height,
            bottom,
            top,
            distance: top.slot - bottom.slot
        }, 'block search')

        assert(bottom.height < this.height)
        assert(this.height < top.height)
        assert(top.slot - bottom.slot > top.height - bottom.height)

        if (this.height - bottom.height < 100) {
            let blocks = await this.rpc.getBlocksWithLimit('finalized', bottom.slot + 1, this.height - bottom.height)
            assert(blocks.length == this.height - bottom.height)
            return last(blocks)
        }

        let middle: number

        if (this.height - bottom.height < top.height - this.height) {
            middle = bottom.slot + Math.ceil(
                (top.slot - bottom.slot) * Math.max((this.height - bottom.height) / (top.height - bottom.height), 0.01)
            )
            if (middle - bottom.slot < 100) {
                let end = Math.min(bottom.slot + 100, top.slot)
                let blocks = await this.rpc.getBlocks('finalized', bottom.slot + 1, end)
                if (blocks.length >= this.height - bottom.height) return blocks[this.height - bottom.height - 1]
                return this.search(
                    {
                        height: bottom.height + blocks.length,
                        slot: end
                    },
                    top
                )
            }
        } else {
            middle = top.slot - Math.ceil(
                (top.slot - bottom.slot) * Math.max((top.height - this.height) / (top.height - bottom.height), 0.01)
            )
            if (top.slot - middle < 100) {
                let beg = Math.max(bottom.slot + 1, top.slot - 100)
                let blocks = await this.rpc.getBlocks('finalized', beg, top.slot - 1)
                if (blocks.length >= top.height - this.height) return blocks[this.height - (top.height - blocks.length)]
                return this.search(
                    bottom,
                    {
                        height: top.height - blocks.length,
                        slot: beg
                    }
                )
            }
        }

        let slot = await this.getFilledSlot(middle)
        let height = await this.getBlockHeight(slot)

        if (height == 'TRIMMED') {
            return this.searchNearTrimHorizon(bottom, top, slot)
        }

        if (height == this.height) return slot
        if (height > this.height) {
            return this.search(bottom, {height, slot: middle})
        } else {
            return this.search({height, slot}, top)
        }
    }

    private async searchNearTrimHorizon(
        bottom: HeightAndSlot,
        top: HeightAndSlot,
        trimmedSlot: number
    ): Promise<number> {
        if (top.slot - trimmedSlot <= top.height - this.height) throw new Error(
            `Seems that block with height ${this.height} is not available on RPC node`
        )

        let middle = trimmedSlot + Math.ceil((top.slot - trimmedSlot) / 2)
        assert(middle > trimmedSlot)

        let slot = await this.getFilledSlot(middle)
        let height = await this.getBlockHeight(slot)

        if (height == 'TRIMMED') return this.searchNearTrimHorizon(bottom, top, slot)

        if (height <= this.height) {
            return this.search({height, slot}, top)
        } else {
            return this.search(bottom, {height, slot: middle})
        }
    }

    private async getFilledSlot(startSlot: number): Promise<number> {
        let blocks = await this.rpc.getBlocksWithLimit('finalized', startSlot, 1)
        assert(blocks.length == 1)
        return blocks[0]
    }

    private async getBlockHeight(slot: number): Promise<number | 'TRIMMED'> {
        let info = await this.rpc.getBlockInfo('finalized', slot).catch((err: Error) => {
            if (/first available block/i.test(err.message)) return 'TRIMMED' as const
            throw err
        })

        if (info == 'TRIMMED') return 'TRIMMED'

        if (info == null) throw new Error(
            `Slot ${slot} should be already finalized and contain a valid block`
        )

        // We can hit this even when we are looking for a block with a valid `.blockHeight`
        if (info.blockHeight == null) throw new Error(
            `Search for block height ${this.height} is not possible, try to start with a higher block`
        )

        return info.blockHeight
    }
}
