import * as raw from '@subsquid/tron-data-raw'
import {Block, BlockHeader, InternalTransaction, Log, Transaction} from '@subsquid/tron-data'
import assert from 'assert'


function mapBlockHeader(src: raw.Block): BlockHeader {
    return {
        hash: src.blockID,
        height: src.block_header.raw_data.number || 0,
        parentHash: src.block_header.raw_data.parentHash,
        timestamp: src.block_header.raw_data.timestamp || 0,
        txTrieRoot: src.block_header.raw_data.txTrieRoot,
        version: src.block_header.raw_data.version,
        witnessAddress: src.block_header.raw_data.witness_address,
        witnessSignature: src.block_header.witness_signature
    }
}


function mapTransaction(src: raw.Transaction, info?: raw.TransactionInfo): Transaction {
    assert(src.raw_data.contract.length == 1)
    if (info) assert(info.contractResult.length == 1)
    let contract = src.raw_data.contract[0]
    return {
        hash: src.txID,
        ret: src.ret,
        signature: src.signature,
        type: contract.type,
        parameter: contract.parameter,
        permissionId: contract.Permission_id,
        refBlockBytes: src.raw_data.ref_block_bytes,
        refBlockHash: src.raw_data.ref_block_hash,
        feeLimit: src.raw_data.fee_limit,
        expiration: src.raw_data.expiration,
        timestamp: src.raw_data.timestamp,
        rawDataHex: src.raw_data_hex,
        fee: info?.fee,
        contractResult: info?.contractResult?.[0],
        contractAddress: info?.contract_address,
        resMessage: info?.resMessage,
        withdrawAmount: info?.withdraw_amount,
        unfreezeAmount: info?.unfreeze_amount,
        withdrawExpireAmount: info?.withdraw_expire_amount,
        cancelUnfreezeV2Amount: info?.cancel_unfreezeV2_amount,
        result: info?.receipt.result,
        energyFee: info?.receipt.energy_fee,
        energyUsage: info?.receipt.energy_usage,
        energyUsageTotal: info?.receipt.energy_usage_total,
        netUsage: info?.receipt.net_usage,
        netFee: info?.receipt.net_fee,
        originEnergyUsage: info?.receipt.origin_energy_usage,
        energyPenaltyTotal: info?.receipt.energy_penalty_total,
    }
}


function mapLog(src: raw.Log, logIndex: number, transactionHash: string): Log {
    return {
        address: src.address,
        data: src.data,
        topics: src.topics,
        logIndex,
        transactionHash,
    }
}


function mapInternalTransaction(src: raw.InternalTransaction, transactionHash: string): InternalTransaction {
    return {
        transactionHash,
        hash: src.hash,
        callerAddress: src.caller_address,
        transferToAddress: src.transferTo_address,
        callValueInfo: src.callValueInfo,
        note: src.note,
        extra: src.extra,
        rejected: src.rejected,
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
    for (let info of src.transactionsInfo) {
        infoById[info.id] = info
    }

    let logIndex = 0
    for (let rawTx of src.block.transactions || []) {
        let info = infoById[rawTx.txID]
        let tx = mapTransaction(rawTx, info)
        block.transactions?.push(tx)

        if (!info) continue

        for (let rawLog of info.log || []) {
            let log = mapLog(rawLog, logIndex++, rawTx.txID)
            block.logs?.push(log)
        }

        for (let rawInternalTx of info.internal_transactions || []) {
            let internalTx = mapInternalTransaction(rawInternalTx, rawTx.txID)
            block.internalTransactions?.push(internalTx)
        }
    }

    return block
}
