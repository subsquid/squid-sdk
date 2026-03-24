import {last, wait} from '@subsquid/util-internal'
import assert from 'assert'
import {Commitment, RpcApi} from '../rpc'
import {Block, DataRequest} from '../types'
import {eliminateContradictions, requestMissingSlots, Slot} from './fetch'


export interface PollStreamOptions {
    rpc: RpcApi
    commitment: Commitment
    from: number
    req?: DataRequest
    strideSize: number
    validateChainContinuity: boolean
    maxConfirmationAttempts: number
    confirmationPauseMs: number
}


export class PollStream {
    private rpc: RpcApi
    private commitment: Commitment
    private req: DataRequest
    private strideSize: number
    private validateChainContinuity: boolean
    private maxConfirmationAttempts: number
    private confirmationPause: number
    private slots: Slot[]

    constructor(options: PollStreamOptions) {
        this.rpc = options.rpc
        this.commitment = options.commitment
        this.req = options.req ?? {}
        assert(options.strideSize > 0)
        this.strideSize = options.strideSize
        this.validateChainContinuity = options.validateChainContinuity
        this.maxConfirmationAttempts = options.maxConfirmationAttempts
        this.confirmationPause = options.confirmationPauseMs
        this.slots = [{slot: options.from}]
    }

    position(): number {
        return this.slots[0].slot
    }

    reset(slot: number): void {
        this.slots = [{slot}]
    }

    async next(): Promise<Block[]> {
        let blocks = await this.fetchBlocks()
        if (blocks.length > 0) return blocks

        let confirmationAttempt = 1
        while (this.slots.some(s => s.block === null)) {
            if (confirmationAttempt >= this.maxConfirmationAttempts) throw new Error(
                `failed to fetch slot ${this.slots[0].slot} ` +
                `with ${this.commitment} commitment ${confirmationAttempt} times in a row`
            )

            if (this.confirmationPause > 0) {
                await wait(this.confirmationPause)
            }

            confirmationAttempt += 1
            let blocks = await this.fetchBlocks()
            if (blocks.length > 0) return blocks
        }

        return []
    }

    private async fetchBlocks(): Promise<Block[]> {
        this.fillSlotsTail()

        await requestMissingSlots(
            this.rpc,
            this.commitment,
            this.req,
            this.slots
        )

        eliminateContradictions(this.slots, this.validateChainContinuity)

        let blocks: Block[] = []
        let slots: Slot[] = []

        for (let s of this.slots) {
            if (s.block === 'skipped') {
                continue
            }
            if (s.block && slots.length == 0) {
                blocks.push(s as Block)
            } else {
                slots.push(s)
            }
        }

        if (slots.length < this.strideSize) {
            slots.push({slot: last(this.slots).slot + 1})
        }

        this.slots = slots
        return blocks
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
}
