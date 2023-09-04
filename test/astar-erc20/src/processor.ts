import {getTransaction, getTransactionResult} from '@subsquid/frontier'
import {assertNotNull, SubstrateBatchProcessor} from '@subsquid/substrate-processor'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import {toJSON} from '@subsquid/util-internal-json'
import * as erc20 from './abi/erc20'
import {Transaction} from './model'


const CONTRACTS = [
    '0x6a2d262D56735DbA19Dd70682B39F6bE9a931D98'.toLowerCase(),
    '0x3795C36e7D12A8c252A20C5a7B455f7c57b60283'.toLowerCase(),
]


const processor = new SubstrateBatchProcessor()
    .setDataSource({
        chain: 'https://rpc.astar.network/',
        // archive: 'https://v2.archive.subsquid.io/network/astar-substrate'
    })
    .setBlockRange({
        from: 4_021_130
    })
    .setFields({
        block: {
            timestamp: true
        }
    })
    .addEthereumTransaction({
        to: CONTRACTS,
        events: true
    })


processor.run(new TypeormDatabase(), async (ctx) => {
    let transactions = []

    for (let block of ctx.blocks) {
        for (let event of block.events) {
            if (event.name == 'Ethereum.Executed' && event.call) {
                let result = getTransactionResult(event)
                if (!CONTRACTS.includes(result.to)) continue

                if (result.status !== 'Succeed') {
                    ctx.log.warn(result, `failed transaction`)
                    continue
                }

                let transaction = getTransaction(event.call)
                let input = decodeTxInput(transaction.input)
                if (input) transactions.push(
                    new Transaction({
                        id: event.call.id,
                        block: block.header.height,
                        timestamp: new Date(assertNotNull(block.header.timestamp)),
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
                    value
                }
            }
        }
        case erc20.functions.transfer.sighash: {
            let [to, value] = erc20.functions.transfer.decode(input)
            return {
                method: 'transfer',
                args: {
                    to,
                    value
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
                    value
                }
            }
        }
        default:
            return undefined
    }
}
