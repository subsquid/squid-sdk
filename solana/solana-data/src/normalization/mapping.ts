import {last} from '@subsquid/util-internal'
import assert from 'assert'
import {Base58Bytes} from '../base'
import * as rpc from '../rpc'
import {Block, BlockHeader, Instruction, LogMessage, Transaction} from './data'
import {InstructionRecord, LogParser} from './log-parser'


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
    let log: LogMessage[] = []

    let transactions = src.block.transactions
        ?.map((tx, i) => mapRpcTransaction(i, tx, instructions, log))
        ?? []

    return {
        header,
        transactions,
        instructions,
        log
    }
}


function mapRpcTransaction(
    transactionIndex: number,
    src: rpc.Transaction,
    instructions: Instruction[],
    log: LogMessage[]
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
        err: src.meta.err,
        computeUnitsConsumed: src.meta.computeUnitsConsumed ?? 0,
        fee: src.meta.fee,
        loadedAddresses: src.meta.loadedAddresses ?? {readonly: [], writable: []},
        logMessagesTruncated: false
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

    let logParser = new LogParser(src.meta.logMessages)
    if (!logParser.ok()) {
        throw new Error(
            `Failed to parse log messages of transaction ${tx.signatures[0]}: ` +
            `stopped at message ${logParser.getPos()}: ${logParser.getError()}`
        )
    }

    tx.logMessagesTruncated = logParser.isTruncated()

    new InstructionParser(
        getAccount,
        tx,
        src,
        logParser.getResult(),
        instructions,
        log
    ).parse()

    return tx
}


class InstructionParser {
    private pos = 0
    private errorPos?: number

    constructor(
        private getAccount: (index: number) => Base58Bytes,
        private tx: Transaction,
        private src: rpc.Transaction,
        private records: InstructionRecord[],
        private instructions: Instruction[],
        private log: LogMessage[]
    ) {}

    parse(): void {
        while (this.pos < this.src.transaction.message.instructions.length) {
            if (this.errorPos == null) {
                this.visitTopInstruction()
            } else {
                let inner = this.getInner()
                if (inner.length > 0) throw this.error(-1, -1,
                    `unexpected inner instructions after errored instruction ${this.errorPos}`
                )
                this.push(
                    [this.pos],
                    this.src.transaction.message.instructions[this.pos],
                    0,
                    undefined
                )
            }
            this.pos += 1
        }
    }

    private getInner(): rpc.Instruction[] {
        return this.src.meta.innerInstructions
            ?.filter(i => i.index === this.pos)
            .flatMap(i => i.instructions) ?? []
    }

    private visitTopInstruction(): void {
        let inner = this.getInner()

        if (this.pos < this.records.length) {
            let innerPos = this.visitRecord(
                [this.pos],
                inner,
                -1,
                this.records[this.pos]
            )
            if (innerPos < inner.length) {
                // can happen when message log were truncated
                if (this.tx.logMessagesTruncated) {
                    assert(innerPos >= 0)
                    this.visitInnerInstructions(inner, innerPos, last(this.instructions).instructionAddress)
                } else {
                    throw this.error(innerPos, -1, 'inner instruction invocation is not logged')
                }
            }
        } else {
            if (this.tx.logMessagesTruncated) {
                this.visitInnerInstructions(inner, 0, [this.pos])
            } else {
                throw this.error(-1, -1, 'instruction invocation is not logged')
            }
        }
    }

    private visitInnerInstructions(
        inner: rpc.Instruction[],
        startPos: number,
        address: number[]
    ): void {
        address = address.slice()
        for (let i = startPos; i < inner.length; i++) {
            let instruction = inner[i]
            let stackHeight = instruction.stackHeight ?? 2
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
            this.push(address.slice(), instruction, undefined, undefined)
        }
    }

    private visitRecord(
        address: number[],
        inner: rpc.Instruction[],
        innerPos: number,
        rec: InstructionRecord
    ): number {
        if (innerPos >= inner.length) throw this.error(innerPos, rec.logMessagePos, 'unexpected end of inner instructions')
        let instruction = innerPos < 0 ? this.src.transaction.message.instructions[this.pos] : inner[innerPos]

        let programId = this.getAccount(instruction.programIdIndex)
        if (programId !== rec.programId) {
            throw this.error(innerPos, rec.logMessagePos, 'program id mismatch')
        }

        if (instruction.stackHeight != null && instruction.stackHeight !== rec.stackHeight) {
            throw this.error(innerPos, rec.logMessagePos, 'stack height mismatch')
        }

        if (rec.stackHeight != address.length) {
            throw this.error(innerPos, rec.logMessagePos, 'unexpected stack height')
        }

        this.push(address, instruction, rec.computeUnitsConsumed, rec.error)

        if (rec.success === false && this.errorPos == null) {
            this.errorPos = this.pos
        }

        innerPos += 1
        let idx = 0

        for (let msg of rec.log) {
            if (msg.kind == 'instruction') {
                innerPos = this.visitRecord(
                    address.concat([idx]),
                    inner,
                    innerPos,
                    msg
                )
                idx += 1
            } else {
                this.log.push({
                    transactionIndex: this.tx.index,
                    instructionAddress: address,
                    programId: rec.programId,
                    kind: msg.kind,
                    message: msg.message
                })
            }
        }

        return innerPos
    }

    private push(
        address: number[],
        i: rpc.Instruction,
        computeUnitsConsumed: bigint | number | undefined,
        error: string | undefined
    ): void {
        this.instructions.push({
            transactionIndex: this.tx.index,
            instructionAddress: address,
            programId: this.getAccount(i.programIdIndex),
            accounts: i.accounts.map(a => this.getAccount(a)),
            data: i.data,
            computeUnitsConsumed: toInteger(computeUnitsConsumed),
            error
        })
    }

    private error(innerPos: number, logMessagePos: number, msg: string): Error {
        let loc = `stopped at instruction ${this.pos}`
        if (innerPos >= 0) {
            loc += ` (inner instruction ${innerPos})`
        }
        if (logMessagePos >= 0) {
            loc += ` and log message ${logMessagePos}`
        }
        return new Error(
            `Failed to process transaction ${this.tx.signatures[0]}: ${loc}: ${msg}`
        )
    }
}


function toInteger(num: bigint | number | undefined): number | undefined {
    if (num == null) return
    let i = Number(num)
    assert(Number.isSafeInteger(i))
    return i
}
