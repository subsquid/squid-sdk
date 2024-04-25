import {unexpectedCase} from '@subsquid/util-internal'
import * as raw from '@subsquid/fuel-data/lib/raw-data'
import assert from 'assert'
import {
    Status,
    ProgramState,
    Transaction,
    Policies,
    TransactionInput,
    TransactionOutput,
    Receipt,
    Block,
    BlockHeader
} from './data'


function toInteger(val: string): number {
    let int = parseInt(val)
    assert(Number.isSafeInteger(int))
    return int
}


function isEmpty(obj: object): boolean {
    for (let _ in obj) {
        return false
    }
    return true
}


function mapRawTransactionStatus(raw: raw.TransactionStatus): Status {
    let programState: ProgramState | undefined
    switch (raw.__typename) {
        case 'FailureStatus':
            if (raw.programState) {
                programState = {
                    data: raw.programState.data,
                    returnType: raw.programState.returnType
                }
            }
            return {
                type: 'FailureStatus',
                transactionId: raw.transactionId,
                time: BigInt(raw.time),
                reason: raw.reason,
                programState
            }
        case 'SqueezedOutStatus':
            return {
                type: 'SqueezedOutStatus',
                reason: raw.reason
            }
        case 'SubmittedStatus':
            return {
                type: 'SubmittedStatus',
                time: BigInt(raw.time)
            }
        case 'SuccessStatus':
            if (raw.programState) {
                programState = {
                    data: raw.programState.data,
                    returnType: raw.programState.returnType
                }
            }
            return {
                type: 'SuccessStatus',
                time: BigInt(raw.time),
                transactionId: raw.transactionId,
                programState,
            }
    }
}


function mapRawPolicies(raw: raw.Policies | null): Policies | undefined {
    let policies: Policies = {}
    if (raw?.gasPrice) {
        policies.gasPrice = BigInt(raw.gasPrice)
    }
    if (raw?.maturity) {
        policies.maturity = toInteger(raw.maturity)
    }
    if (raw?.maxFee) {
        policies.maxFee = BigInt(raw.maxFee)
    }
    if (raw?.witnessLimit) {
        policies.witnessLimit = BigInt(raw.witnessLimit)
    }
    return isEmpty(policies) ? undefined : policies
}


function getTransactionType(raw: raw.Transaction) {
    if (raw.isScript) {
        return 'Script'
    } else if (raw.isCreate) {
        return 'Create'
    } else if (raw.isMint) {
        return 'Mint'
    } else {
        throw unexpectedCase()
    }
}


function mapRawTransaction(raw: raw.Transaction, transactionIndex: number): Transaction {
    let transaction: Transaction = {
        index: transactionIndex,
        hash: raw.id,
        isCreate: raw.isCreate,
        isMint: raw.isMint,
        isScript: raw.isScript,
        type: getTransactionType(raw),
        status: mapRawTransactionStatus(raw.status),
        policies: mapRawPolicies(raw.policies),
        salt: raw.salt ?? undefined,
        storageSlots: raw.storageSlots ?? undefined,
        rawPayload: raw.rawPayload ?? undefined,
        mintAssetId: raw.mintAssetId ?? undefined,
        txPointer: raw.txPointer ?? undefined,
        outputContract: raw.outputContract ?? undefined,
        witnesses: raw.witnesses ?? undefined,
        receiptsRoot: raw.receiptsRoot ?? undefined,
        script: raw.script ?? undefined,
        scriptData: raw.scriptData ?? undefined,
        bytecodeWitnessIndex: raw.bytecodeWitnessIndex ?? undefined,
        inputAssetIds: raw.inputAssetIds ?? undefined,
        inputContracts: raw.inputContracts?.map(i => i.id),
    }

    if (raw.inputContract) {
        transaction.inputContract = {
            utxoId: raw.inputContract.utxoId,
            balanceRoot: raw.inputContract.balanceRoot,
            stateRoot: raw.inputContract.stateRoot,
            txPointer: raw.inputContract.txPointer,
            contract: raw.inputContract.contract.id,
        }
    }
    if (raw.gasPrice) {
        transaction.gasPrice = BigInt(raw.gasPrice)
    }
    if (raw.scriptGasLimit) {
        transaction.scriptGasLimit = BigInt(raw.scriptGasLimit)
    }
    if (raw.maturity) {
        transaction.maturity = toInteger(raw.maturity)
    }
    if (raw.mintAmount) {
        transaction.mintAmount = BigInt(raw.mintAmount)
    }
    if (raw.bytecodeLength) {
        transaction.bytecodeLength = BigInt(raw.bytecodeLength)
    }

    return transaction
}


function mapRawInput(raw: raw.TransactionInput, transactionIndex: number, index: number): TransactionInput {
    switch (raw.__typename) {
        case 'InputCoin':
            return {
                type: 'InputCoin',
                index,
                transactionIndex,
                utxoId: raw.utxoId,
                owner: raw.owner,
                amount: BigInt(raw.amount),
                assetId: raw.assetId,
                txPointer: raw.txPointer,
                witnessIndex: raw.witnessIndex,
                maturity: toInteger(raw.maturity),
                predicateGasUsed: BigInt(raw.predicateGasUsed),
                predicate: raw.predicate,
                predicateData: raw.predicateData,
            }
        case 'InputContract':
            return {
                type: 'InputContract',
                index,
                transactionIndex,
                utxoId: raw.utxoId,
                balanceRoot: raw.balanceRoot,
                stateRoot: raw.stateRoot,
                txPointer: raw.txPointer,
                contract: raw.contract.id
            }
        case 'InputMessage':
            return {
                type: 'InputMessage',
                index,
                transactionIndex,
                sender: raw.sender,
                recipient: raw.recipient,
                amount: BigInt(raw.amount),
                nonce: raw.nonce,
                witnessIndex: raw.witnessIndex,
                predicateGasUsed: BigInt(raw.predicateGasUsed),
                data: raw.data,
                predicate: raw.predicate,
                predicateData: raw.predicateData,
            }
    }
}


function mapRawOutput(raw: raw.TransactionOutput, transactionIndex: number, index: number): TransactionOutput {
    switch (raw.__typename) {
        case 'ChangeOutput':
            return {
                type: 'ChangeOutput',
                index,
                transactionIndex,
                to: raw.to,
                amount: BigInt(raw.amount),
                assetId: raw.assetId,
            }
        case 'CoinOutput':
            return {
                type: 'CoinOutput',
                index,
                transactionIndex,
                to: raw.to,
                amount: BigInt(raw.amount),
                assetId: raw.assetId,
            }
        case 'ContractCreated':
            return {
                type: 'ContractCreated',
                index,
                transactionIndex,
                contract: raw.contract,
                stateRoot: raw.stateRoot
            }
        case 'ContractOutput':
            return {
                type: 'ContractOutput',
                index,
                transactionIndex,
                inputIndex: raw.inputIndex,
                balanceRoot: raw.balanceRoot,
                stateRoot: raw.stateRoot
            }
        case 'VariableOutput':
            return {
                type: 'VariableOutput',
                index,
                transactionIndex,
                to: raw.to,
                amount: BigInt(raw.amount),
                assetId: raw.assetId
            }
    }
}


function mapRawReceipt(raw: raw.Receipt, transactionIndex: number, index: number): Receipt {
    let receipt: Receipt = {
        index,
        transactionIndex,
        receiptType: raw.receiptType,
        contract: raw.contract?.id,
        to: raw.to?.id,
        toAddress: raw.toAddress ?? undefined,
        assetId: raw.assetId ?? undefined,
        digest: raw.digest ?? undefined,
        data: raw.data ?? undefined,
        sender: raw.sender ?? undefined,
        recipient: raw.recipient ?? undefined,
        nonce: raw.nonce ?? undefined,
        contractId: raw.contractId ?? undefined,
        subId: raw.subId ?? undefined,
    }

    if (raw.pc) {
        receipt.pc = BigInt(raw.pc)
    }
    if (raw.is) {
        receipt.is = BigInt(raw.is)
    }
    if (raw.amount) {
        receipt.amount = BigInt(raw.amount)
    }
    if (raw.gas) {
        receipt.gas = BigInt(raw.gas)
    }
    if (raw.param1) {
        receipt.param1 = BigInt(raw.param1)
    }
    if (raw.param2) {
        receipt.param2 = BigInt(raw.param2)
    }
    if (raw.val) {
        receipt.val = BigInt(raw.val)
    }
    if (raw.ptr) {
        receipt.val = BigInt(raw.ptr)
    }
    if (raw.reason) {
        receipt.reason = BigInt(raw.reason)
    }
    if (raw.ra) {
        receipt.ra = BigInt(raw.ra)
    }
    if (raw.rb) {
        receipt.rb = BigInt(raw.rb)
    }
    if (raw.rc) {
        receipt.rc = BigInt(raw.rc)
    }
    if (raw.rd) {
        receipt.rd = BigInt(raw.rd)
    }
    if (raw.len) {
        receipt.len = BigInt(raw.len)
    }
    if (raw.result) {
        receipt.result = BigInt(raw.result)
    }
    if (raw.gasUsed) {
        receipt.gasUsed = BigInt(raw.gasUsed)
    }

    return receipt
}


export function mapRawBlock(raw: raw.BlockData): Block {
    let header: BlockHeader = {
        hash: raw.block.header.id,
        height: toInteger(raw.block.header.height),
        daHeight: BigInt(raw.block.header.daHeight),
        transactionsRoot: raw.block.header.transactionsRoot,
        transactionsCount: BigInt(raw.block.header.transactionsCount),
        messageReceiptRoot: raw.block.header.messageReceiptRoot,
        messageReceiptCount: BigInt(raw.block.header.messageReceiptCount),
        prevRoot: raw.block.header.prevRoot,
        time: BigInt(raw.block.header.time),
        applicationHash: raw.block.header.applicationHash,
    }

    let transactions: Transaction[] = []
    let inputs: TransactionInput[] = []
    let outputs: TransactionOutput[] = []
    let receipts: Receipt[] = []

    raw.block.transactions.forEach((tx, index) => {
        transactions.push(mapRawTransaction(tx, index))

        tx.inputs?.forEach((input, inputIndex) => {
            inputs.push(mapRawInput(input, index, inputIndex))
        })

        tx.outputs.forEach((output, outputIndex) => {
            outputs.push(mapRawOutput(output, index, outputIndex))
        })

        tx.receipts?.forEach((receipt, receiptIndex) => {
            receipts.push(mapRawReceipt(receipt, index, receiptIndex))
        })
    })

    return {
        header,
        transactions,
        inputs,
        outputs,
        receipts,
    }
}
