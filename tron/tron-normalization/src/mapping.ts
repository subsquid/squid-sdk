import * as raw from '@subsquid/tron-data'
import assert from 'assert'
import {Block, BlockHeader, CallValueInfo, InternalTransaction, Log, Transaction} from './data'


function mapBlockHeader(src: raw.Block): BlockHeader {
    return {
        hash: src.blockID,
        height: src.block_header.raw_data.number || 0,
        parentHash: src.block_header.raw_data.parentHash,
        timestamp: src.block_header.raw_data.timestamp || 0,
        txTrieRoot: src.block_header.raw_data.txTrieRoot,
        version: src.block_header.raw_data.version ?? undefined,
        witnessAddress: src.block_header.raw_data.witness_address,
        witnessSignature: src.block_header.witness_signature ?? undefined
    }
}


function mapTransaction(src: raw.Transaction, transactionIndex: number, info?: raw.TransactionInfo): Transaction {
    assert(src.raw_data.contract.length == 1)
    if (info) assert(info.contractResult.length == 1)
    let contract = src.raw_data.contract[0]
    let ret = src.ret?.map(ret => ({contractRet: ret.contractRet ?? undefined}))
    let tx: Transaction = {
        hash: src.txID,
        transactionIndex,
        ret,
        signature: src.signature ?? undefined,
        type: contract.type,
        parameter: contract.parameter,
        permissionId: contract.Permission_id ?? undefined,
        refBlockBytes: src.raw_data.ref_block_bytes ?? undefined,
        refBlockHash: src.raw_data.ref_block_hash ?? undefined,
        expiration: src.raw_data.expiration ?? undefined,
        rawDataHex: src.raw_data_hex,
        contractResult: info?.contractResult?.[0],
        contractAddress: info?.contract_address ?? undefined,
        resMessage: info?.resMessage ?? undefined,
        result: info?.receipt.result ?? undefined,
    }

    if (src.raw_data.timestamp) {
        tx.timestamp = BigInt(src.raw_data.timestamp)
    }
    if (src.raw_data.fee_limit) {
        tx.feeLimit = BigInt(src.raw_data.fee_limit)
    }
    if (info?.fee) {
        tx.fee = BigInt(info.fee)
    }
    if (info?.withdraw_amount) {
        tx.withdrawAmount = BigInt(info.withdraw_amount)
    }
    if (info?.unfreeze_amount) {
        tx.unfreezeAmount = BigInt(info.unfreeze_amount)
    }
    if (info?.withdraw_expire_amount) {
        tx.withdrawExpireAmount = BigInt(info.withdraw_expire_amount)
    }
    if (info?.receipt.energy_fee) {
        tx.energyFee = BigInt(info.receipt.energy_fee)
    }
    if (info?.receipt.energy_usage) {
        tx.energyUsage = BigInt(info.receipt.energy_usage)
    }
    if (info?.receipt.energy_usage_total) {
        tx.energyUsageTotal = BigInt(info.receipt.energy_usage_total)
    }
    if (info?.receipt.net_usage) {
        tx.netUsage = BigInt(info.receipt.net_usage)
    }
    if (info?.receipt.net_fee) {
        tx.netFee = BigInt(info.receipt.net_fee)
    }
    if (info?.receipt.origin_energy_usage) {
        tx.originEnergyUsage = BigInt(info.receipt.origin_energy_usage)
    }
    if (info?.receipt.energy_penalty_total) {
        tx.energyPenaltyTotal = BigInt(info.receipt.energy_penalty_total)
    }
    if (info?.cancel_unfreezeV2_amount) {
        tx.cancelUnfreezeV2Amount = {}
        for (let obj of info?.cancel_unfreezeV2_amount) {
            tx.cancelUnfreezeV2Amount[obj.key] = BigInt(obj.value)
        }
    }

    return tx
}


function mapLog(src: raw.Log, transactionIndex: number, logIndex: number): Log {
    return {
        transactionIndex,
        logIndex,
        address: src.address,
        data: src.data ?? undefined,
        topics: src.topics ?? undefined,
    }
}


function mapInternalTransaction(
    src: raw.InternalTransaction,
    transactionIndex: number,
    internalTransactionIndex: number
): InternalTransaction {
    let callValueInfo = src.callValueInfo.map(info => {
        let val: CallValueInfo = {}
        if (info.tokenId) {
            val.tokenId = info.tokenId
        }
        if (info.callValue) {
            val.callValue = BigInt(info.callValue)
        }
        return val
    })

    return {
        transactionIndex,
        internalTransactionIndex,
        hash: src.hash,
        callerAddress: src.caller_address,
        transferToAddress: src.transferTo_address ?? undefined,
        callValueInfo,
        note: src.note,
        extra: src.extra ?? undefined,
        rejected: src.rejected ?? undefined,
    }
}


export function mapBlock(src: raw.BlockData): Block {
    let block: Block = {
        header: mapBlockHeader(src.block),
        logs: [],
        transactions: [],
        internalTransactions: [],
    }

    let infoById: Record<string, raw.TransactionInfo> = {}
    for (let info of src.transactionsInfo || []) {
        infoById[info.id] = info
    }

    src.block.transactions?.forEach((rawTx, index) => {
        let info = infoById[rawTx.txID]
        let tx = mapTransaction(rawTx, index, info)
        block.transactions?.push(tx)

        if (!info) return

        info.log?.forEach((rawLog, logIndex) => {
            let log = mapLog(rawLog, index, logIndex)
            block.logs?.push(log)
        })

        info.internal_transactions?.forEach((rawInternalTx, internalTxIndex) => {
            let internalTx = mapInternalTransaction(rawInternalTx, index, internalTxIndex)
            block.internalTransactions?.push(internalTx)
        })
    })

    return block
}
