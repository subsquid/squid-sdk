import assert from 'assert'
import {Base58Bytes} from '../base'
import * as rpc from '../rpc'
import {Block, BlockHeader, Instruction, Transaction} from './data'


export function mapRpcBlock(src: rpc.Block): Block {
    let header: BlockHeader = {
        hash: src.hash,
        height: src.height,
        slot: src.slot,
        parentSlot: src.block.parentSlot,
        parentHash: src.block.previousBlockhash,
        timestamp: src.block.blockTime ?? 0
    }

    let instructions: Instruction[] = []

    let transactions = src.block.transactions
        ?.map((tx, i) => mapRpcTransaction(i, tx, instructions))
        ?? []

    return {
        header,
        transactions,
        instructions
    }
}


function mapRpcTransaction(
    transactionIndex: number,
    src: rpc.Transaction,
    instructions: Instruction[]
): Transaction {
    let tx: Transaction = {
        index: transactionIndex,
        version: src.version,
        accountKeys: src.transaction.message.accountKeys,
        addressTableLookups: src.transaction.message.addressTableLookups ?? [],
        numReadonlySignedAccounts: src.transaction.message.header.numReadonlySignedAccounts,
        numReadonlyUnsignedAccounts: src.transaction.message.header.numReadonlyUnsignedAccounts,
        numRequiredSignatures: src.transaction.message.header.numRequiredSignatures,
        recentBlockhash: src.transaction.message.recentBlockhash,
        signatures: src.transaction.signatures,
        err: src.meta?.err ?? null,
        computeUnitsConsumed: src.meta?.computeUnitsConsumed ?? 0,
        fee: src.meta?.fee ?? 0,
        logMessages: src.meta?.logMessages ?? [],
        loadedAddresses: src.meta?.loadedAddresses ?? {readonly: [], writable: []}
    }

    let accounts: Base58Bytes[]
    if (tx.version === 'legacy') {
        accounts = tx.accountKeys
    } else {
        assert(src.meta?.loadedAddresses)

        let total = tx.accountKeys.length + tx.loadedAddresses.writable.length + tx.loadedAddresses.readonly.length
        let writableNonSigners = total - tx.numRequiredSignatures - tx.numReadonlyUnsignedAccounts
        let writableNonSignersFromTx = writableNonSigners - tx.loadedAddresses.writable.length
        assert(writableNonSigners >= 0)
        assert(writableNonSignersFromTx >= 0)

        accounts = tx.accountKeys.slice(0, tx.numRequiredSignatures)
        accounts.push(
            ...tx.accountKeys.slice(
                tx.numRequiredSignatures,
                tx.numRequiredSignatures + writableNonSignersFromTx
            )
        )
        accounts.push(...tx.loadedAddresses.writable)
        accounts.push(...tx.accountKeys.slice(tx.numRequiredSignatures + writableNonSignersFromTx))
        accounts.push(...tx.loadedAddresses.readonly)
    }

    let getAccount = (index: number): Base58Bytes => {
        assert(index < accounts.length)
        return accounts[index]
    }

    for (let instructionIndex = 0; instructionIndex < src.transaction.message.instructions.length; instructionIndex++) {
        let si = src.transaction.message.instructions[instructionIndex]
        instructions.push({
            transactionIndex,
            instructionAddress: [instructionIndex],
            accounts: si.accounts.map(getAccount),
            programId: getAccount(si.programIdIndex),
            data: si.data
        })
        if (src.meta?.innerInstructions) {
            for (let inner of src.meta.innerInstructions) {
                if (inner.index === instructionIndex) {
                    let address = [instructionIndex]
                    for (let ii of inner.instructions) {
                        let stackHeight = (ii.stackHeight ?? 2)
                        assert(stackHeight >= 2)
                        while (address.length > stackHeight) {
                            address.pop()
                        }
                        if (address.length === stackHeight) {
                            address[stackHeight - 1] += 1
                        } else {
                            assert(address.length + 1 === stackHeight)
                            address[stackHeight - 1] = 0
                        }
                        instructions.push({
                            transactionIndex,
                            instructionAddress: address.slice(),
                            accounts: ii.accounts.map(getAccount),
                            programId: getAccount(ii.programIdIndex),
                            data: ii.data
                        })
                    }
                }
            }
        }
    }

    return tx
}
