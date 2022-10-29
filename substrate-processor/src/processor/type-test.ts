import {EventHandlerContext} from '../interfaces/dataHandlers'
import {BatchContext, SubstrateBatchProcessor} from './batchProcessor'


const db: any = {}


function getItem<I>(cb: (item: I) => void) {
    return async function(ctx: BatchContext<any, I>) {
    }
}


new SubstrateBatchProcessor()
    .addEvent('*')
    .run(db, getItem(item => {
        if (item.kind == 'event') {
            console.log(item.event.args)
            console.log(item.event.call?.parent)
        }
    }))


new SubstrateBatchProcessor()
    .addCall('*')
    .run(db, getItem(item => {
        if (item.kind == 'call') {
            console.log(item.call.origin)
            console.log(item.extrinsic.fee)
        }
    }))


new SubstrateBatchProcessor()
    .addEvent('Balances.Transfer', {data: {event: {extrinsic: {signature: true}}}} as const)
    .run(db, getItem(item => {
        if (item.name == 'Balances.Transfer') {
            console.log(item.event.extrinsic?.signature)
        }
    }))


new SubstrateBatchProcessor()
    .addEvent('Balances.Transfer', {data: {event: {extrinsic: {signature: true}}}} as const)
    .addEvent('Balances.Transfer', {data: {event: {extrinsic: {}}}} as const)
    .run(db, getItem(item => {
        if (item.name == 'Balances.Transfer') {
            console.log(item.event.extrinsic?.signature)
        }
    }))


new SubstrateBatchProcessor()
    .addEvmLog('0x')
    .run(db, getItem(item => {
        if (item.name == 'EVM.Log') {
            const address: string = item.event.args.address
        }
    }))


new SubstrateBatchProcessor()
    .addEvmLog('0x00')
    .addEvmLog('*')
    .run(db, getItem(item => {
        if (item.name == 'EVM.Log') {
            const address: string = item.event.args.address
        }
    }))


new SubstrateBatchProcessor()
    .addEvent('Staking.Rewarded', {
        data: {
            event: {
                args: true,
                call: {args: true},
                extrinsic: {hash: true}
            }
        } as const
    })
    .run(db, getItem(item => {
        type Reward = EventHandlerContext<unknown, {
            event: {
                args: true,
                call: {args: true},
                extrinsic: {hash: true},
            }
        }>['event']
        if (item.name == 'Staking.Rewarded') {
            let reward: Reward = item.event
            if (reward.call) {
                console.log(reward.call.success)
                console.log(reward.extrinsic.hash)
            }
        }
    }))
