import * as rpc from '@subsquid/bitcoin-rpc'
import {
    Block,
    BlockHeader,
    Transaction,
    TransactionInput,
    TransactionOutput,
    ScriptPubKey,
    Prevout
} from './data'
import { RawBlock } from './raw'

function mapScriptPubKey(src: rpc.ScriptPubKey): ScriptPubKey {
    return {
        hex: src.hex,
        asm: src.asm ?? undefined,
        type: src.type ?? undefined,
        desc: src.desc ?? undefined,
        address: src.address ?? undefined
    }
}

function mapPrevout(src: rpc.Prevout): Prevout {
    return {
        generated: src.generated,
        height: src.height,
        value: src.value,
        scriptPubKey: mapScriptPubKey(src.scriptPubKey)
    }
}

function mapTransactionInput(src: rpc.TransactionInput): TransactionInput {
    if ('coinbase' in src) {
        return {
            coinbase: src.coinbase,
            sequence: src.sequence,
            txInWitness: src.txinwitness ?? undefined
        }
    }

    return {
        txid: src.txid,
        vout: src.vout,
        scriptSig: {
            hex: src.scriptSig.hex,
            asm: src.scriptSig.asm ?? undefined
        },
        sequence: src.sequence,
        txInWitness: src.txinwitness ?? undefined,
        prevout: src.prevout ? mapPrevout(src.prevout) : undefined
    }
}

function mapTransactionOutput(src: rpc.TransactionOutput): TransactionOutput {
    return {
        value: src.value,
        n: src.n,
        scriptPubKey: mapScriptPubKey(src.scriptPubKey)
    }
}

function mapTransaction(src: rpc.Transaction): Transaction {
    return {
        hex: src.hex,
        txid: src.txid,
        hash: src.hash,
        size: src.size,
        vsize: src.vsize,
        weight: src.weight,
        version: src.version,
        locktime: src.locktime,
        vin: src.vin.map(mapTransactionInput),
        vout: src.vout.map(mapTransactionOutput)
    }
}


function mapBlockHeader(src: rpc.GetBlock): BlockHeader {
    return {
        hash: src.hash,
        number: src.height,
        version: src.version,
        merkleRoot: src.merkleroot,
        timestamp: src.time,
        medianTime: src.mediantime,
        nonce: src.nonce,
        target: src.target,
        bits: src.bits,
        difficulty: src.difficulty,
        chainWork: src.chainwork,
        parentHash: src.previousblockhash ?? rpc.ZERO_HASH,
        strippedSize: src.strippedsize,
        size: src.size,
        weight: src.weight,
    }
}

export function mapRawBlock(raw: RawBlock): Block {
    return {
        header: mapBlockHeader(raw),
        transactions: raw.tx.map(mapTransaction),
    }
}

export function mapRpcBlock(src: rpc.Block): Block {
    return mapRawBlock(src.block as rpc.BlockWithTx)
}