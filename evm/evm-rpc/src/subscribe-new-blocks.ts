// import {RpcClient, SubscriptionHandle} from '@subsquid/rpc-client'
// import {GetBlock} from '@subsquid/solana-rpc-data'
// import {addErrorContext, ensureError} from '@subsquid/util-internal'
// import {ANY, assertValidity, NAT, nullable, object} from '@subsquid/util-internal-validation'
// import {Commitment} from './rpc'
// import {Block, DataRequest} from './types'


// const BlockNotification = object({
//     value: object({
//         slot: NAT,
//         block: nullable(GetBlock),
//         err: nullable(ANY)
//     })
// })


// export function subscribeNewBlocks(
//     client: RpcClient,
//     commitment: Commitment,
//     req: DataRequest,
//     cb: (msg: Error | Block) => void
// ): SubscriptionHandle
// {
//     return client.subscribe({
//         method: 'blockSubscribe',
//         params: [
//             'all',
//             {
//                 commitment,
//                 showRewards: req.rewards,
//                 transactionDetails: req.transactions ? 'full' : 'none',
//                 maxSupportedTransactionVersion: 0,
//                 encoding: 'json'
//             }
//         ],
//         unsubscribe: 'blockUnsubscribe',
//         notification: 'blockNotification',
//         onMessage: (msg: unknown) => {
//             let block: Block | undefined
//             try {
//                 block = checkBlockNotification(req, msg)
//             } catch(err: any) {
//                 cb(ensureError(err))
//                 return
//             }
//             if (block) cb(block)
//         },
//         onError: err => cb(ensureError(err)),
//         resubscribeOnConnectionLoss: true
//     })
// }


// function checkBlockNotification(req: DataRequest, msg: unknown): Block | undefined {
//     assertValidity(BlockNotification, msg)
//     let {slot, err, block} = msg.value

//     if (err != null) {
//         throw addErrorContext(new Error(`block notification error`), {
//             blockSlot: slot,
//             blockNotificationError: err
//         })
//     }

//     if (block == null) return

//     if (block.transactions == null && req.transactions) {
//         throw new Error(`Transactions are missing in block notification at slot ${slot} although where requested`)
//     }

//     if (block.rewards == null && req.rewards) {
//         throw new Error(`Rewards are missing in block notification at slot ${slot} although where requested`)
//     }

//     return {
//         slot,
//         block
//     }
// }


// export type BlockNotificationError = Error & {
//     blockSlot: number
//     blockNotificationError: any
// }


// export function isBlockNotificationError(err: unknown): err is BlockNotificationError {
//     return err instanceof Error && 'blockNotificationError' in err
// }
