import {RpcClient, SubscriptionHandle} from '@subsquid/rpc-client'
import {GetBlock} from '@subsquid/solana-rpc-data'
import {addErrorContext, ensureError} from '@subsquid/util-internal'
import {ANY_OBJECT, assertValidity, NAT, nullable, object} from '@subsquid/util-internal-validation'
import {Commitment} from './rpc'
import {DataRequest, Block} from './types'


const BlockNotification = object({
    value: object({
        slot: NAT,
        block: nullable(GetBlock),
        err: nullable(ANY_OBJECT)
    })
})


export function subscribeNewBlocks(
    client: RpcClient,
    commitment: Commitment,
    req: DataRequest,
    cb: (msg: Error | Block) => void
): SubscriptionHandle
{
    return client.subscribe({
        method: 'blockSubscribe',
        params: [
            'all',
            {
                commitment,
                showRewards: req.rewards,
                transactionDetails: req.transactions ? 'full' : 'none',
                maxSupportedTransactionVersion: 0,
                encoding: 'json'
            }
        ],
        unsubscribe: 'blockUnsubscribe',
        notification: 'blockNotification',
        onMessage: (msg: unknown) => {
            try {
                let block = checkBlockNotification(req, msg)
                if (block) {
                    cb(block)
                }
            } catch(err: any) {
                cb(ensureError(err))
            }
        },
        onError: err => cb(ensureError(err)),
        resubscribeOnConnectionLoss: true
    })
}


function checkBlockNotification(req: DataRequest, msg: unknown): Block | undefined {
    assertValidity(BlockNotification, msg)
    let {slot, err, block} = msg.value

    if (err) {
        throw addErrorContext(new Error(`Got a block notification error at slot ${slot}`), {
            blockNotificationError: err
        })
    }

    if (block == null) return

    if (block.transactions == null && req.transactions) {
        throw new Error(`Transactions are missing in block notification at slot ${slot} although where requested`)
    }

    if (block.rewards == null && req.rewards) {
        throw new Error(`Rewards are missing in block notification at slot ${slot} although where requested`)
    }

    return {
        slot,
        block
    }
}
