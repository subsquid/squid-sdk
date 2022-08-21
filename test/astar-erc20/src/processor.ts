import {SubstrateProcessor, toHex} from '@subsquid/substrate-processor'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import {ethers, UnsignedTransaction} from 'ethers'
import {SignatureLike} from '@ethersproject/bytes'
import * as erc20 from './erc20'
import {Transaction} from './model'
import {EthereumTransactCall} from './types/calls'
import {CallContext} from './types/support'
import {toJSON} from '@subsquid/util-internal-json'


const processor = new SubstrateProcessor(new TypeormDatabase())


processor.setDataSource({
    archive: 'http://localhost:2938/graphql',
    chain: 'wss://public-rpc.pinknode.io/astar'
})


processor.addEthereumTransactionHandler(
    '0x6a2d262D56735DbA19Dd70682B39F6bE9a931D98',
    async ctx => {
        let data = getTransactionData(ctx)
        let serializedTransaction = ethers.utils.serializeTransaction(data.tx, data.signature)
        let transaction = ethers.utils.parseTransaction(serializedTransaction)

        let input = decodeInput(transaction.data)
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


function getTransactionData(ctx: CallContext): {tx: UnsignedTransaction, signature: SignatureLike} {
    let call = new EthereumTransactCall(ctx)

    if (call.isV1) {
        const data = call.asV1.transaction
        return {
            tx: {
                to: data.action.__kind === 'Call' ? toHex(data.action.value) : undefined,
                nonce: Number(data.nonce[0]),
                gasLimit: data.gasLimit[0],
                gasPrice: data.gasPrice[0],
                value: data.value[0],
                data: data.input,
                type: 0,
            },
            signature: {
                v: Number(data.signature.v),
                r: toHex(data.signature.r),
                s: toHex(data.signature.s),
            }
        }
    } else if (call.isV9) {
        const transaction = call.asV9.transaction
        switch (transaction.__kind) {
            case 'Legacy': {
                const data = transaction.value
                return {
                    tx: {
                        to: data.action.__kind === 'Call' ? toHex(data.action.value) : undefined,
                        nonce: Number(data.nonce[0]),
                        gasLimit: data.gasLimit[0],
                        gasPrice: data.gasPrice[0],
                        value: data.value[0],
                        data: data.input,
                        type: 0,
                    },
                    signature: {
                        v: Number(data.signature.v),
                        r: toHex(data.signature.r),
                        s: toHex(data.signature.s),
                    }
                }
            }
            case 'EIP1559': {
                const data = transaction.value
                return {
                    tx: {
                        to: data.action.__kind === 'Call' ? toHex(data.action.value) : undefined,
                        nonce: Number(data.nonce[0]),
                        gasLimit: data.gasLimit[0],
                        maxFeePerGas: data.maxFeePerGas[0],
                        maxPriorityFeePerGas: data.maxPriorityFeePerGas[0],
                        value: data.value[0],
                        data: data.input,
                        chainId: Number(data.chainId),
                        accessList: data.accessList.map((a) => [
                            toHex(a.address),
                            a.storageKeys.map((k) => toHex(k))
                        ]) as [string, string[]][],
                        type: 2,
                    },
                    signature: {
                        r: toHex(data.r),
                        s: toHex(data.s),
                        v: Number(data.chainId),
                    }
                }
            }
            case 'EIP2930': {
                const data = transaction.value
                return {
                    tx: {
                        to: data.action.__kind === 'Call' ? toHex(data.action.value) : undefined,
                        nonce: Number(data.nonce[0]),
                        gasLimit: data.gasLimit[0],
                        gasPrice: data.gasPrice[0],
                        value: data.value[0],
                        data: data.input,
                        chainId: Number(data.chainId),
                        accessList: data.accessList.map((a) => [
                            toHex(a.address),
                            a.storageKeys.map((k) => toHex(k))
                        ]) as [string, string[]][],
                        type: 1,
                    },
                    signature: {
                        r: toHex(data.r),
                        s: toHex(data.s),
                        v: Number(data.chainId),
                    }
                }
            }
        }
    } else {
        throw new Error()
    }
}


processor.run()
