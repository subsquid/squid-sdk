import {addErrorContext, groupBy, unexpectedCase} from '@subsquid/util-internal'
import assert from 'assert'
import * as rpc from '../rpc'
import {Block, EvmBlockHeader, EvmTransaction, EvmLog, EvmTrace, EvmStateDiff} from './data'


export function mapRpcBlock(src: rpc.Block): Block {
    let header: EvmBlockHeader = {
        hash: src.hash,
        height: src.height,
        parentHash: src.block.parentHash,
        logsBloom: src.block.logsBloom,
        extraData: src.block.extraData,
        gasLimit: BigInt(src.block.gasLimit),
        gasUsed: BigInt(src.block.gasUsed),
        miner: src.block.miner,
        receiptsRoot: src.block.receiptsRoot,
        sha3Uncles: src.block.sha3Uncles,
        size: BigInt(src.block.size),
        stateRoot: src.block.stateRoot,
        timestamp: parseInt(src.block.timestamp),
        transactionsRoot: src.block.transactionsRoot,
    }

    if (src.block.baseFeePerGas) {
        header.baseFeePerGas = BigInt(src.block.baseFeePerGas)
    }
    if (src.block.difficulty) {
        header.difficulty = BigInt(src.block.difficulty)
    }
    if (src.block.totalDifficulty) {
        header.totalDifficulty = BigInt(src.block.totalDifficulty)
    }
    if (src.block.l1BlockNumber) {
        header.l1BlockNumber = parseInt(src.block.l1BlockNumber)
    }
    if (src.block.mixHash) {
        header.mixHash = src.block.mixHash
    }
    if (src.block.nonce) {
        header.nonce = src.block.nonce
    }

    let transactions: EvmTransaction[] = []
    let logs: EvmLog[] = []
    let traces: EvmTrace[] = []
    let stateDiffs: EvmStateDiff[] = []

    for (let tx of src.block.transactions) {
        if (typeof tx == 'string') continue
        let transaction = mapRpcTransaction(tx)
        transactions.push(transaction)
    }

    return {
        header,
        transactions,
        logs,
        traces,
        stateDiffs
    }
}


function mapRpcTransaction(src: rpc.Transaction): EvmTransaction {
    let tx: EvmTransaction = {
        transactionIndex: parseInt(src.transactionIndex),
        sighash: src.input.slice(0, 10),
        hash: src.hash,
        from: src.from,
        gas: BigInt(src.gas),
        gasPrice: BigInt(src.gasPrice),
        input: src.input,
        nonce: parseInt(src.nonce),
        value: BigInt(src.value),
        // gasUsed: bigint
        // cumulativeGasUsed: bigint
        // effectiveGasPrice: bigint
        // contractAddress?: Bytes32
        // type: number
        // status: number
    }

    if (src.to) {
        tx.to = src.to
    }
    if (src.maxFeePerGas) {
        tx.maxFeePerGas = BigInt(src.maxFeePerGas)
    }
    if (src.maxPriorityFeePerGas) {
        tx.maxPriorityFeePerGas = BigInt(src.maxPriorityFeePerGas)
    }
    if (src.v) {
        tx.v = BigInt(src.v)
    }
    if (src.r) {
        tx.r = src.r
    }
    if (src.s) {
        tx.s = src.s
    }
    if (src.yParity) {
        tx.yParity = parseInt(src.yParity)
    }
    if (src.chainId) {
        tx.chainId = parseInt(src.chainId)
    }

    return tx
}
