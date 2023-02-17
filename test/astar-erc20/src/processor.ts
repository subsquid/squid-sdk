import {getTransaction, getTransactionResult} from '@subsquid/frontier'
import {assertNotNull, SubstrateBatchProcessor} from '@subsquid/substrate-processor'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import {toJSON} from '@subsquid/util-internal-json'
import * as erc20 from './abi/erc20'
import {Transaction} from './model'


const processor = new SubstrateBatchProcessor()
    .setDataSource({
        chain: 'wss://public-rpc.pinknode.io/astar',
        archive: 'https://astar.archive.subsquid.io/graphql',
    })
    .addEthereumTransaction([
        '0x6a2d262D56735DbA19Dd70682B39F6bE9a931D98',
        '0x3795C36e7D12A8c252A20C5a7B455f7c57b60283',
    ])


processor.run(new TypeormDatabase(), async (ctx) => {
    let transactions = []

    for (let block of ctx.blocks) {
        for (let item of block.items) {
            if (item.name == 'Ethereum.Executed') {
                let result = getTransactionResult(ctx, item.event)
                if (result.status !== 'Succeed') {
                    ctx.log.warn(result, `failed transaction`)
                    continue
                }

                let call = assertNotNull(item.event.call)
                let transaction = getTransaction(ctx, call)

                let input = decodeTxInput(transaction.input)
                if (input) transactions.push(
                    new Transaction({
                        id: call.id,
                        block: block.header.height,
                        timestamp: new Date(block.header.timestamp),
                        txHash: transaction.hash,
                        from: transaction.from,
                        to: transaction.to,
                        method: input.method,
                        args: toJSON(input.args)
                    })
                )
            }
        }
    }

    await ctx.store.save(transactions)
})


function decodeTxInput(input: string): {method: string; args: any} | undefined {
    let sighash = input.slice(0, 10)
    switch (sighash) {
        case erc20.functions.approve.sighash: {
            let [spender, value] = erc20.functions.approve.decode(input)
            return {
                method: 'approve',
                args: {
                    spender,
                    value: value.toBigInt()
                }
            }
        }
        case erc20.functions.transfer.sighash: {
            let [to, value] = erc20.functions.transfer.decode(input)
            return {
                method: 'transfer',
                args: {
                    to,
                    value: value.toBigInt()
                }
            }
        }
        case erc20.functions.transferFrom.sighash: {
            let [from, to, value] = erc20.functions.transferFrom.decode(input)
            return {
                method: 'transferFrom',
                args: {
                    from,
                    to,
                    value: value.toBigInt()
                }
            }
        }
        default:
            return undefined
    }
}
