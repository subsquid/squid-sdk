import {SubstrateProcessor, toHex} from '@subsquid/substrate-processor'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import * as erc20 from './erc20'
import {Transaction} from './model'
import {toJSON} from '@subsquid/util-internal-json'
import {getTransaction} from '@subsquid/substrate-frontier-evm'


const processor = new SubstrateProcessor(new TypeormDatabase())


processor.setDataSource({
    archive: 'https://astar.archive.subsquid.io/graphql',
    chain: 'wss://public-rpc.pinknode.io/astar'
})


processor.addEthereumTransactionHandler(
    ['0x6a2d262D56735DbA19Dd70682B39F6bE9a931D98', '0x3795C36e7D12A8c252A20C5a7B455f7c57b60283'],
    async ctx => {
        let transaction = getTransaction(ctx, ctx.call)

        let input = decodeInput(transaction.input)
        if (!input) return

        await ctx.store.save(new Transaction({
            id: ctx.call.id,
            block: ctx.block.height,
            timestamp: new Date(ctx.block.timestamp),
            txHash: transaction.hash,
            from: transaction.from,
            to: transaction.to,
            type: transaction.type || 0,
            input: toJSON(input)
        }))
    }
)


function decodeInput(input: string): {method: string, args: any[]} | undefined {
    let sighash = input.slice(0, 10)

    switch (sighash) {
        case erc20.functions['approve(address,uint256)'].sighash: {
            const decoded = erc20.functions['approve(address,uint256)'].decode(input)
            return {
                method: 'approve',
                args: [decoded[0], decoded[1].toBigInt()]
            }
        }
        case erc20.functions['transfer(address,uint256)'].sighash: {
            const decoded = erc20.functions['transfer(address,uint256)'].decode(input)
            return {
                method: 'transfer',
                args: [decoded[0], decoded[1].toBigInt()]
            }
        }
        case erc20.functions['transferFrom(address,address,uint256)'].sighash: {
            const decoded = erc20.functions['transferFrom(address,address,uint256)'].decode(input)
            return {
                method: 'transferFrom',
                args: [decoded[0], decoded[0], decoded[2].toBigInt()]
            }
        }
        default:
            return undefined
    }
}


processor.run()
