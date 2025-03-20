import * as rpc from '@subsquid/solana-rpc-data'
import {Base58Bytes} from '@subsquid/solana-rpc-data'
import assert from 'assert'


export interface Journal {
    warn(props: any, msg: string): void
    error(props: any, msg: string): void
}


export class TransactionContext {
    public readonly erroredInstruction: number
    public readonly exceededCallDepth: boolean

    private accounts: Base58Bytes[]

    constructor(
        public readonly transactionIndex: number,
        public readonly tx: rpc.Transaction,
        private journal: Journal
    ) {
        if (tx.version == 'legacy') {
            this.accounts = tx.transaction.message.accountKeys
        } else {
            this.accounts = tx.transaction.message.accountKeys.concat(
                tx.meta.loadedAddresses?.writable ?? [],
                tx.meta.loadedAddresses?.readonly ?? []
            )
        }

        let err = this.tx.meta.err
        if (isIntructionError(err)) {
            let pos = err.InstructionError?.[0]
            let type = err.InstructionError?.[1]
            if (Number.isSafeInteger(pos)) {
                this.erroredInstruction = pos
            } else {
                this.erroredInstruction = tx.transaction.message.instructions.length
                this.warn({transactionError: err}, 'got InstructionError of unrecognized shape')
            }
            this.exceededCallDepth = type === 'CallDepth'
        } else {
            this.erroredInstruction = tx.transaction.message.instructions.length
            this.exceededCallDepth = false
        }
    }

    get isCommitted(): boolean {
        return this.tx.meta.err == null
    }

    get transactionHash(): string {
        return this.tx.transaction.signatures[0]
    }

    getAccount(index: number): Base58Bytes {
        assert(index < this.accounts.length)
        return this.accounts[index]
    }

    warn(props: any, msg: string): void {
        this.journal.warn({
            transactionHash: this.transactionHash,
            transactionIndex: this.transactionIndex,
            ...props
        }, msg)
    }

    error(props: any, msg: string): void {
        this.journal.error({
            transactionHash: this.transactionHash,
            transactionIndex: this.transactionIndex,
            ...props
        }, msg)
    }
}

function isIntructionError(err: unknown): err is {InstructionError: [number, string]} {
    return typeof err == 'object' && err != null && 'InstructionError' in err
}
