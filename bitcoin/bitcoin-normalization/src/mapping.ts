import * as rpc from '@subsquid/bitcoin-rpc'
import {
    Block,
    BlockHeader,
    Transaction,
    TransactionInput,
    TransactionOutput
} from './data'
import { RawBlock } from './raw'

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
        txInWitness: src.txinwitness ?? undefined
    }
}

function mapTransactionOutput(src: rpc.TransactionOutput): TransactionOutput {
    return {
        value: src.value,
        n: src.n,
        scriptPubKey: {
            hex: src.scriptPubKey.hex,
            asm: src.scriptPubKey.asm ?? undefined,
            type: src.scriptPubKey.type ?? undefined,
            desc: src.scriptPubKey.desc ?? undefined,
            address: src.scriptPubKey.address ?? undefined
        }
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