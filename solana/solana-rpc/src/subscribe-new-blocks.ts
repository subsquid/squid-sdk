import {RpcClient, SubscriptionHandle} from '@subsquid/rpc-client'
import {Block, GetBlock} from '@subsquid/solana-rpc-data'
import {addErrorContext, assertNotNull, AsyncQueue, ensureError, last, maybeLast} from '@subsquid/util-internal'
import {ANY_OBJECT, assertValidity, NAT, nullable, object} from '@subsquid/util-internal-validation'
import assert from 'assert'
import {DataRequest} from './base'


export function subscribeNewBlocks(client: RpcClient, req: DataRequest): AsyncIterable<Block[]> {
    return new BlockSubscription(client, req).getBlocks()
}


class BlockSubscription {
    private blocks: Block[] = []
    private notify = new AsyncQueue<null | Error>(1)
    private handle?: SubscriptionHandle

    constructor(
        private client: RpcClient,
        private req: DataRequest
    ) {
        this.notify.addCloseListener(() => this.handle?.close())
    }

    async *getBlocks(): AsyncIterable<Block[]> {
        assert(this.handle == null, 'subscription is already in use')
        this.handle = this.subscribe()
        for await (let err of this.notify.iterate()) {
            if (err instanceof Error) throw err
            let blocks = this.blocks
            this.blocks = []
            yield blocks
        }
    }

    private subscribe(): SubscriptionHandle {
        return this.client.subscribe({
            method: 'blockSubscribe',
            params: [
                'all',
                {
                    commitment: 'confirmed',
                    showRewards: this.req.rewards,
                    transactionDetails: this.req.transactions ? 'full' : 'none',
                    maxSupportedTransactionVersion: 0,
                    encoding: 'json'
                }
            ],
            unsubscribe: 'blockUnsubscribe',
            notification: 'blockNotification',
            onMessage: (msg: unknown) => {
                try {
                    this.onBlockNotification(msg)
                } catch(err: any) {
                    this.error(err)
                }
            },
            onError: err => this.error(err),
            resubscribeOnConnectionLoss: true
        })
    }

    private error(err: unknown): void {
        this.notify.forcePut(ensureError(err))
        this.notify.close()
    }

    private onBlockNotification(msg: unknown): void {
        assertValidity(BlockNotification, msg)

        let {slot, err, block} = msg.value

        if (err) {
            throw addErrorContext(new Error(`Got a block notification error at slot ${slot}`), {
                blockNotificationError: err
            })
        }

        if (block == null) return

        if (block.transactions == null && this.req.transactions) {
            throw new Error(`Transactions are missing in block notification at slot ${slot} although where requested`)
        }

        if (block.rewards == null && this.req.rewards) {
            throw new Error(`Rewards are missing in block notification at slot ${slot} although where requested`)
        }

        this.push({
            hash: block.blockhash,
            height: assertNotNull(block.blockHeight),
            slot,
            block
        })
    }

    private push(block: Block): void {
        while (this.blocks.length && last(this.blocks).height >= block.height) {
            this.blocks.pop()
        }
        if (maybeLast(this.blocks)?.height === block.height - 1) {
            if (last(this.blocks).hash !== block.block.previousBlockhash) {
                this.blocks.pop()
            }
        }
        if (this.blocks.length < 10) {
            this.blocks.push(block)
            this.notify.forcePut(null)
        }
    }
}


const BlockNotification = object({
    value: object({
        slot: NAT,
        block: nullable(GetBlock),
        err: nullable(ANY_OBJECT)
    })
})
