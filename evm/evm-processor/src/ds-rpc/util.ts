import {Bytes32} from '@subsquid/evm-data'


export function getTxHash(tx: Bytes32 | {hash: Bytes32}): Bytes32 {
    if (typeof tx == 'string') {
        return tx
    } else {
        return tx.hash
    }
}
