import {GetBlock} from '@subsquid/solana-rpc-data'
import {last, wait} from '@subsquid/util-internal'
import {Commitment, Rpc} from '../rpc'
import {Block, DataRequest} from '../types'
import {requestSlotBatch} from './get-blocks'


export interface PollStreamOptions {
    rpc: Rpc
    commitment: Commitment
    from: number
    req?: DataRequest
    strideSize?: number
    maxConfirmationAttempts?: number
    confirmationPauseMs?: number
}


interface Slot {
    slot: number
    block?: GetBlock | undefined | null
}


export class PollStream {
    private rpc: Rpc
    private commitment: Commitment
    private req: DataRequest
    private strideSize: number
    private maxConfirmationAttempts: number
    private confirmationPause: number
    private slots: Slot[]
    private isOnHead: boolean

    constructor(options: PollStreamOptions) {
        this.rpc = options.rpc
        this.commitment = options.commitment
        this.req = options.req ?? {}
        this.strideSize = options.strideSize || 5
        this.maxConfirmationAttempts = options.maxConfirmationAttempts ?? 10
        this.confirmationPause = options.confirmationPauseMs ?? 100
        this.isOnHead = false
        this.slots = [{slot: options.from}]
    }

    position(): number {
        return this.slots[0].slot
    }

    reset(slot: number): void {
        this.slots = [{slot}]
    }

    async next(): Promise<Block[]> {
        let isOnHead = this.isOnHead
        while (true) {
            if (isOnHead) {
                this.isOnHead = await this.fetchSlots()
                if (this.isOnHead) return []
            }

            let blocks = await this.fetchBlocks()
            if (blocks.length > 0) return blocks

            let confirmationAttempt = 0
            while (this.slots[0].block === null) {
                confirmationAttempt += 1
                if (confirmationAttempt >= this.maxConfirmationAttempts) throw new Error(
                    `failed to fetch slot ${this.slots[0].slot} ` +
                    `with ${this.commitment} commitment ${confirmationAttempt} times in a row`
                )
                let blocks = await this.fetchBlocks()
                if (blocks.length > 0) return blocks
                if (this.confirmationPause > 0) {
                    await wait(this.confirmationPause)
                }
            }

            isOnHead = true
        }
    }

    private async fetchSlots(): Promise<boolean> {
        let slots = await this.rpc.getBlocksWithLimit(this.commitment, this.position(), this.strideSize)
        if (slots.length == 0) return true
        this.slots = slots.map(slot => ({slot}))
        return false
    }

    private fillSlotsTail(): void {
        let left = this.strideSize - this.slots.length
        let pos = last(this.slots).slot + 1
        for (let i = 0; i < left; i++) {
            this.slots.push({
                slot: pos + i
            })
        }
    }

    private async fetchBlocks(): Promise<Block[]> {
        this.fillSlotsTail()

        let index = []
        for (let i = 0; i < this.slots.length; i++) {
            let slot = this.slots[i]
            if (slot.block == null) {
                index.push(i)
            }
        }

        let batch = await requestSlotBatch(
            this.rpc,
            this.commitment,
            this.req,
            index.map(i => this.slots[i].slot)
        )

        for (let i = 0; i < batch.length; i++) {
            this.slots[index[i]].block = batch[i]
        }

        let blocks: Block[] = []
        let slots: Slot[] = []

        for (let s of this.slots) {
            if (s.block) {
                if (slots.length == 0) {
                    blocks.push({block: s.block, slot: s.slot})
                } else {
                    slots.push(s)
                }
            } else if (s.block === null) {
                slots.push(s)
            }
        }

        if (slots.length > 0) {
            this.slots = slots
        } else {
            let pos = blocks.length ? last(blocks).slot + 1 : this.position()
            this.slots = [{slot: pos}]
        }

        return blocks
    }
}
