// import type * as rpc from '@subsquid/solana-rpc-data'

import {addErrorContext, assertNotNull} from '@subsquid/util-internal'
import {Block, BlockHeader, Transaction, Access, EIP7702Authorization, Log, Trace, TraceActionCreate, TraceActionCall, TraceActionReward, TraceActionSelfdestruct, StateDiff, TraceResultCreate, TraceResultCall} from './evm-data'
// import { GetBlock, Transaction as RpcTransaction, Access as RpcAccess, EIP7702Authorization as RpcEIP7702Authorization, Receipt, Trace as RpcTrace } from './evm-rpc-data'
import * as rpc from '@subsquid/evm-rpc/lib/rpc-data'
import * as rpcTypes from '@subsquid/evm-rpc/lib/types'
import { Logger } from '@subsquid/logger'
import { assert, log } from 'node:console'
// import {InstructionTreeTraversal, MessageStream, ParsingError} from './instruction-parser'
// import {LogTruncatedMessage} from './log-parser'
// import {Journal, TransactionContext} from './transaction-context'

function getSigHash(input: string | undefined | null): string | null {
    if (input === undefined || input === null || input.length < 10) {
        return null
    }
    return input.substring(0, 10)
} 

function traceDiffToStateDiff(diff: rpc.TraceDiff, transactionIndex: number, address: string, key: string): StateDiff | null {
    if (diff === "=") {
        return null
    }
    let template: StateDiff = {
        transactionIndex,
        address,
        key,
        kind: "=",
        prev: null,
        next: null
    }
    if ("+" in diff) {
        template.kind = "+"
        template.next = diff["+"]
    }
    if ("-" in diff) {
        template.kind = "-"
        template.prev = diff["-"]
    }
    if ("*" in diff) {
        template.kind = "*"
        template.prev = diff["*"].from
        template.next = diff["*"].to
    }
    return template
}

function mapDiffs(wrap: rpc.TraceTransactionReplay, idx: number): StateDiff[] {
    if (wrap.stateDiff === undefined || wrap.stateDiff === null) {
        return [];
    }
    let res: StateDiff[] = []
    for (let key in wrap.stateDiff) {
        let val = wrap.stateDiff[key];
        let diffs = []
        for (let storage_addr in val.storage) {
            diffs.push(traceDiffToStateDiff(val.storage[storage_addr], idx, key, storage_addr))
        }
        diffs.push(traceDiffToStateDiff(val["balance"], idx, key, "balance"))
        diffs.push(traceDiffToStateDiff(val["code"], idx, key, "code"))
        diffs.push(traceDiffToStateDiff(val["nonce"], idx, key, "nonce"))

        res = res.concat(diffs.filter(v => v !== null))
    }
    return res
}

function mapTraceValue(val: string): string | null {
    if (val.length <= 2) {
        return null
    }
    // if (val == "0x0") {
    //     return null
    // }
    return val
}

function mapAction(action: rpc.TraceActionCreate | rpc.TraceActionCall | rpc.TraceActionReward | rpc.TraceActionSelfdestruct): TraceActionCreate | TraceActionCall | TraceActionReward | TraceActionSelfdestruct
 {
    if ("init" in action) {
        return {
            from: action.from,
            value: action.value,
            gas: action.gas,
            init: action.init,
            creation_method: action.creation_method ? action.creation_method : undefined
        }
    }
    if ("callType" in action) {
        return {
            from: action.from,
            to: action.to,
            value: action.callType === "staticcall" ? null : mapTraceValue(action.value),
            gas: action.gas,
            input: action.input,
            callType: action.callType,
            type: action.callType,
            sighash: getSigHash(action.input)
        }
    }
    if ("rewardType" in action) {
        return {
            author: action.author,
            value: parseInt(action.value),
            rewardType: action.rewardType
        }
    }
    return {
        address: action.address,
        refundAddress: action.refundAddress,
        balance: parseInt(action.balance, 16)
    }
}

function mapResult(result: rpc.TraceResultCall | rpc.TraceResultCreate | undefined | null): TraceResultCall | TraceResultCreate | undefined {
    if (result === undefined ||  result === null) {
        return undefined
    }
    if ("output" in result) {
        return {
            gasUsed: result.gasUsed,
            output: mapTraceValue(result.output),
        }
    }
    return {
        gasUsed: result.gasUsed,
        code: result.code,
        address: result.address
    }
}

function extractRevertReason(result: rpc.TraceResultCall | rpc.TraceResultCreate | undefined | null): string | null {
    if (result === undefined || result === null) {
        return null
    }
    if ("code" in result) {
        return null
    }
    let output = result.output;
    let offset = 136;
    if (!output.startsWith("0x")) {
        offset -= 2;
    }
    let buff = Buffer.from(output.substring(offset), 'hex');
    let len = buff[0]
    return buff.subarray(1, len + 1).toString();
}

function mapTraces(trace: rpc.TraceFrame): Trace {
    return {
        transactionIndex: trace.transactionPosition,
        traceAddress: trace.traceAddress,
        type: trace.type == "suicide" ? "selfdestruct" : trace.type,
        subtraces: trace.subtraces,
        error: trace.error ? trace.error : null,
        revertReason: trace.error ? extractRevertReason(trace.result): null,
        action: mapAction(trace.action),
        result: mapResult(trace.result)
    }
} 

function mapReceptToLogs(receipt: rpc.Receipt, tx_idx: number): Log[] {
    let res = receipt.logs.map((log, log_idx) => {
        if (log.removed) {
            return null
        }
        return {
            // blockHash: log.blockHash,
            // blockNumber: parseInt(log.blockNumber, 16),
            logIndex: log_idx,
            transactionIndex: tx_idx,
            transactionHash: log.transactionHash,
            address: log.address,
            data: log.data,
            topics: log.topics
        }
    }).filter(n => n !== null);
    return res
}

function mapAccess(access: rpc.Access): Access {
    return {
        address: access.address,
        storageKeys: access.storageKeys
    }
}

function mapEIP7702Authorization(auth: rpc.EIP7702Authorization): EIP7702Authorization {
    return {
        chainId: parseInt(auth.chainId, 16),
        address: auth.address,
        nonce: parseInt(auth.nonce, 16),
        yParity: parseInt(auth.yParity, 16),
        r: auth.r,
        s: auth.s
    }
}

function upgradeWithRecipts(tx: Transaction, receipt: rpc.Receipt | undefined): Transaction {
    if (receipt === undefined) {
        return tx;
    }
    tx.contractAddress = receipt.contractAddress
    tx.cumulativeGasUsed = receipt.cumulativeGasUsed
    tx.effectiveGasPrice = receipt.effectiveGasPrice
    tx.gasUsed = receipt.gasUsed
    tx.sighash = getSigHash(tx.input)
    tx.status = receipt.status === "0x1" ? 1 : 0

    tx.l1BaseFeeScalar = receipt.l1BaseFeeScalar ? parseInt(receipt.l1BaseFeeScalar, 16) : null;
    tx.l1BlobBaseFee = receipt.l1BlobBaseFee ? receipt.l1BlobBaseFee : null;
    tx.l1BlobBaseFeeScalar = receipt.l1BlobBaseFeeScalar ? parseInt(receipt.l1BlobBaseFeeScalar, 16) : null;
    tx.l1Fee = receipt.l1Fee ? receipt.l1Fee : null;
    tx.l1FeeScalar = receipt.l1FeeScalar ? parseInt(receipt.l1FeeScalar, 16) : null;
    tx.l1GasPrice = receipt.l1GasPrice ? receipt.l1GasPrice : null;
    tx.l1GasUsed = receipt.l1GasUsed ? receipt.l1GasUsed : null;
    return tx
}

function mapTransaction(tx: rpc.Transaction | string): Transaction {
    if (typeof tx === 'string') {
        return {
            // blockHash: "",
            // blockNumber: 0,
            transactionIndex: 0,
            hash: tx,
            nonce: 0,
            from: "",
            to: undefined,
            input: "",
            value: "",
            type: null,
            gas: "",
            gasPrice: null,
            maxFeePerGas: null,
            maxPriorityFeePerGas: null,
            v: null,
            r: null,
            s: null,
            yParity: null,
            // accessList: undefined,
            chainId: null,
            maxFeePerBlobGas: null,
            blobVersionedHashes: null,
            authorizationList: undefined,

            contractAddress: null,
            cumulativeGasUsed: "",
            effectiveGasPrice: "",
            gasUsed: "",
            sighash: null,
            status: null,

            l1BaseFeeScalar: null,
            l1BlobBaseFee: null,
            l1BlobBaseFeeScalar: null,
            l1Fee: null,
            l1FeeScalar: null,
            l1GasPrice: null,
            l1GasUsed: null,                
        };
    } 
    return {
        // blockHash: tx.blockHash,
        // blockNumber: parseInt(tx.blockNumber, 16),
        transactionIndex: parseInt(tx.transactionIndex, 16),
        hash: tx.hash,
        nonce: parseInt(tx.nonce, 16),
        from: tx.from,
        to: tx.to,
        input: tx.input,
        value: tx.value,
        type: tx.type ? parseInt(tx.type, 16) : null,
        gas: tx.gas,
        gasPrice: tx.gasPrice ? tx.gasPrice : null,
        maxFeePerGas: tx.maxFeePerGas ? tx.maxFeePerGas : null,
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas ? tx.maxPriorityFeePerGas : null,
        v: tx.v ? tx.v : null,
        r: tx.r ? tx.r : null,
        s: tx.s ? tx.s : null,
        yParity: tx.yParity ? parseInt(tx.yParity, 16) : null,
        // accessList: tx.accessList ? tx.accessList.map(mapAccess) : undefined,
        chainId: tx.chainId ? parseInt(tx.chainId, 16) : null,
        maxFeePerBlobGas: tx.maxFeePerBlobGas ? tx.maxFeePerBlobGas : null,
        blobVersionedHashes: tx.blobVersionedHashes ? tx.blobVersionedHashes : null,
        authorizationList: tx.authorizationList ? tx.authorizationList.map(mapEIP7702Authorization) : undefined,

        contractAddress: null,
        cumulativeGasUsed: "",
        effectiveGasPrice: "",
        gasUsed: "",
        sighash: null,
        status: null,

        l1BaseFeeScalar: null,
        l1BlobBaseFee: null,
        l1BlobBaseFeeScalar: null,
        l1Fee: null,
        l1FeeScalar: null,
        l1GasPrice: null,
        l1GasUsed: null,
    };
}

export function mapRpcBlock(src: rpcTypes.Block, _journal: Logger): Block {
    let header: BlockHeader = {
        number: src.number,
        hash: src.hash,
        parentHash: src.block.parentHash,
        timestamp: parseInt(src.block.timestamp, 16),
        transactionsRoot: src.block.transactionsRoot,
        receiptsRoot: src.block.receiptsRoot,
        stateRoot: src.block.stateRoot,
        logsBloom: src.block.logsBloom,
        sha3Uncles: src.block.sha3Uncles,
        extraData: src.block.extraData,
        miner: src.block.miner,
        nonce: src.block.nonce ? src.block.nonce : null,
        mixHash: src.block.mixHash ? src.block.mixHash : null,
        size: parseInt(src.block.size, 16),
        gasLimit: src.block.gasLimit,
        gasUsed: src.block.gasUsed,
        difficulty: src.block.difficulty ? src.block.difficulty : null,
        totalDifficulty: src.block.totalDifficulty ? src.block.totalDifficulty : null,
        baseFeePerGas: src.block.baseFeePerGas ? src.block.baseFeePerGas : null,
        // withdrawalsRoot: src.withdrawalsRoot ? src.withdrawalsRoot : null,
        blobGasUsed: src.block.blobGasUsed ? src.block.blobGasUsed : null,
        excessBlobGas: src.block.excessBlobGas ? src.block.excessBlobGas : null,
        // parentBeaconBlockRoot: src.parentBeaconBlockRoot ? src.parentBeaconBlockRoot : null,
        // requestsHash: Bytes | null,
        // uncles: Hash32[],
        l1BlockNumber: src.block.l1BlockNumber ? parseInt(src.block.l1BlockNumber) : null
    }


    let transactions: Transaction[] = src.block.transactions.map(mapTransaction);
    transactions = transactions.map((tx, idx) => upgradeWithRecipts(tx, src.receipts ? src.receipts[idx] : undefined));

    let logs: Log[] | undefined = src.receipts ? src.receipts.map(mapReceptToLogs).flat() : undefined;
    if (logs !== undefined) {
        for (let i = 0; i < logs.length; i++) {
            logs[i].logIndex = i;
        }
    }

    let traces: Trace[] | undefined = src.traces ? src.traces.map(mapTraces) : undefined;

    let stateDiffs: StateDiff[] | undefined = src.stateDiffs ? src.stateDiffs.map(mapDiffs).flat() : undefined;


    return {
        header,
        transactions,
        logs,
        traces,
        stateDiffs
    }
}

