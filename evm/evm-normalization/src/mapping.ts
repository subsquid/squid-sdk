import * as rpc from '@subsquid/evm-rpc'
import {qty2Int} from '@subsquid/evm-rpc'
import assert from 'assert'
import {
    Block,
    BlockHeader,
    Transaction,
    Access,
    EIP7702Authorization,
    Log,
    Trace,
    TraceActionCreate,
    TraceActionCall,
    TraceActionReward,
    TraceActionSelfdestruct,
    StateDiff,
    TraceResultCreate,
    TraceResultCall
} from './data'


function getSigHash(input: string): string | undefined {
    if (input.length < 10) return undefined
    return input.substring(0, 10)
}


function traceDiffToStateDiff(diff: rpc.TraceDiff, transactionIndex: number, address: string, key: string): StateDiff | null {
    if (diff === '=') {
        return null
    }
    let template: StateDiff = {
        transactionIndex,
        address,
        key,
        kind: '='
    }
    if ('+' in diff) {
        template.kind = '+'
        template.next = diff['+']
    }
    if ('-' in diff) {
        template.kind = '-'
        template.prev = diff['-']
    }
    if ('*' in diff) {
        template.kind = '*'
        template.prev = diff['*'].from
        template.next = diff['*'].to
    }
    return template
}


function mapDiffs(wrap: rpc.TraceTransactionReplay, idx: number): StateDiff[] {
    if (wrap.stateDiff === undefined || wrap.stateDiff === null) {
        return []
    }
    let res: StateDiff[] = []
    for (let key in wrap.stateDiff) {
        let val = wrap.stateDiff[key]
        let diffs = []
        for (let storage_addr in val.storage) {
            diffs.push(traceDiffToStateDiff(val.storage[storage_addr], idx, key, storage_addr))
        }
        diffs.push(traceDiffToStateDiff(val['balance'], idx, key, 'balance'))
        diffs.push(traceDiffToStateDiff(val['code'], idx, key, 'code'))
        diffs.push(traceDiffToStateDiff(val['nonce'], idx, key, 'nonce'))

        res = res.concat(diffs.filter(v => v !== null))
    }
    return res
}


function mapAction(action: rpc.TraceActionCreate | rpc.TraceActionCall | rpc.TraceActionReward | rpc.TraceActionSelfdestruct): TraceActionCreate | TraceActionCall | TraceActionReward | TraceActionSelfdestruct {
    if ('init' in action) {
        return {
            from: action.from,
            value: action.value,
            gas: action.gas,
            init: action.init,
            creationMethod: action.creation_method ?? undefined
        }
    }
    if ('callType' in action) {
        return {
            from: action.from,
            to: action.to,
            value: action.value,
            gas: action.gas,
            input: action.input,
            callType: action.callType,
            sighash: getSigHash(action.input)
        }
    }
    if ('rewardType' in action) {
        return {
            author: action.author,
            value: action.value,
            rewardType: action.rewardType
        }
    }
    return {
        address: action.address,
        refundAddress: action.refundAddress,
        balance: action.balance
    }
}


function mapResult(result: rpc.TraceResultCall | rpc.TraceResultCreate | undefined | null): TraceResultCall | TraceResultCreate | undefined {
    if (result === undefined || result === null) {
        return undefined
    }
    if ('output' in result) {
        return {
            gasUsed: result.gasUsed,
            output: result.output
        }
    }
    return {
        gasUsed: result.gasUsed,
        code: result.code,
        address: result.address
    }
}


function extractRevertReason(result: rpc.TraceResultCall | rpc.TraceResultCreate | undefined | null): string | undefined {
    if (result === undefined || result === null) {
        return undefined
    }
    if ('code' in result) {
        return undefined
    }
    let output = result.output
    let offset = 136
    if (!output.startsWith('0x')) {
        offset -= 2
    }
    let buff = Buffer.from(output.substring(offset), 'hex')
    let len = buff[0]
    return buff.subarray(1, len + 1).toString()
}


function mapTrace(src: rpc.TraceFrame): Trace {
    return {
        transactionIndex: src.transactionPosition,
        traceAddress: src.traceAddress,
        type: src.type == 'suicide' ? 'selfdestruct' : src.type,
        subtraces: src.subtraces,
        error: src.error ?? undefined,
        revertReason: src.error ? extractRevertReason(src.result) : undefined,
        action: mapAction(src.action),
        result: mapResult(src.result)
    }
}


function mapLog(src: rpc.Log): Log {
    assert(!src.removed)
    return {
        logIndex: qty2Int(src.logIndex),
        transactionIndex: qty2Int(src.transactionIndex),
        transactionHash: src.transactionHash,
        address: src.address,
        data: src.data,
        topics: src.topics
    }
}


function mapAccess(src: rpc.Access): Access {
    return {
        address: src.address,
        storageKeys: src.storageKeys
    }
}


function mapEIP7702Authorization(src: rpc.EIP7702Authorization): EIP7702Authorization {
    return {
        chainId: qty2Int(src.chainId),
        address: src.address,
        nonce: qty2Int(src.nonce),
        yParity: qty2Int(src.yParity),
        r: src.r,
        s: src.s
    }
}


function mapTransaction(src: rpc.Transaction, receipt?: rpc.Receipt): Transaction {
    return {
        transactionIndex: qty2Int(src.transactionIndex),
        hash: src.hash,
        nonce: qty2Int(src.nonce),
        from: src.from,
        to: src.to ?? undefined,
        input: src.input,
        sighash: getSigHash(src.input),
        value: src.value,
        type: qty2Int(src.type),
        gas: src.gas,
        gasPrice: src.gasPrice ?? undefined,
        maxFeePerGas: src.maxFeePerGas ?? undefined,
        maxPriorityFeePerGas: src.maxPriorityFeePerGas ?? undefined,
        v: src.v ?? undefined,
        r: src.r ?? undefined,
        s: src.s ?? undefined,
        yParity: src.yParity ? qty2Int(src.yParity) : undefined,
        accessList: src.accessList?.map(mapAccess),
        chainId: src.chainId ? qty2Int(src.chainId) : undefined,
        maxFeePerBlobGas: src.maxFeePerBlobGas ?? undefined,
        blobVersionedHashes: src.blobVersionedHashes ?? undefined,
        authorizationList: src.authorizationList?.map(mapEIP7702Authorization),
        contractAddress: receipt?.contractAddress ?? undefined,
        cumulativeGasUsed: receipt?.cumulativeGasUsed,
        effectiveGasPrice: receipt?.effectiveGasPrice,
        gasUsed: receipt?.gasUsed,
        status: receipt?.status ? qty2Int(receipt.status) : undefined,
        l1BaseFeeScalar: receipt?.l1BaseFeeScalar ? qty2Int(receipt.l1BaseFeeScalar) : undefined,
        l1BlobBaseFee: receipt?.l1BlobBaseFee ?? undefined,
        l1BlobBaseFeeScalar: receipt?.l1BlobBaseFeeScalar ? qty2Int(receipt.l1BlobBaseFeeScalar) : undefined,
        l1Fee: receipt?.l1Fee ?? undefined,
        l1FeeScalar: receipt?.l1FeeScalar ? parseInt(receipt.l1FeeScalar) : undefined,
        l1GasPrice: receipt?.l1GasPrice ?? undefined,
        l1GasUsed: receipt?.l1GasUsed ?? undefined,
    }
}


export function mapRpcBlock(src: rpc.Block): Block {
    let header: BlockHeader = {
        number: src.number,
        hash: src.hash,
        parentHash: src.block.parentHash,
        timestamp: qty2Int(src.block.timestamp),
        transactionsRoot: src.block.transactionsRoot,
        receiptsRoot: src.block.receiptsRoot,
        stateRoot: src.block.stateRoot,
        logsBloom: src.block.logsBloom,
        sha3Uncles: src.block.sha3Uncles,
        extraData: src.block.extraData,
        miner: src.block.miner,
        nonce: src.block.nonce ?? undefined,
        mixHash: src.block.mixHash ?? undefined,
        size: BigInt(src.block.size),
        gasLimit: src.block.gasLimit,
        gasUsed: src.block.gasUsed,
        difficulty: src.block.difficulty ?? undefined,
        totalDifficulty: src.block.totalDifficulty ?? undefined,
        baseFeePerGas: src.block.baseFeePerGas ?? undefined,
        uncles: src.block.uncles ?? undefined,
        withdrawals: src.block.withdrawals ?? undefined,
        withdrawalsRoot: src.block.withdrawalsRoot ?? undefined,
        blobGasUsed: src.block.blobGasUsed ?? undefined,
        excessBlobGas: src.block.excessBlobGas ?? undefined,
        parentBeaconBlockRoot: src.block.parentBeaconBlockRoot ?? undefined,
        requestsHash: src.block.requestsHash ?? undefined,
        l1BlockNumber: src.block.l1BlockNumber ? qty2Int(src.block.l1BlockNumber) : undefined
    }

    let transactions = []
    for (let i = 0; i < src.block.transactions.length; i++) {
        let tx = src.block.transactions[i] as unknown as rpc.Transaction
        assert(typeof tx !== 'string')
        let receipt = src.receipts?.[i]
        if (receipt) {
            assert(tx.hash == receipt.transactionHash)
        }
        transactions.push(mapTransaction(tx, receipt))
    }

    let logs: Log[] = []
    src.receipts?.forEach(receipt => {
        receipt.logs.forEach(log => {
            logs.push(mapLog(log))
        })
    })

    let traces: Trace[] = src.traces ? src.traces.map(mapTrace) : []

    let stateDiffs: StateDiff[] = src.stateDiffs ? src.stateDiffs.map(mapDiffs).flat() : []

    return {
        header,
        transactions,
        logs,
        traces,
        stateDiffs
    }
}
