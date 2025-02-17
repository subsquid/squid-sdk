import * as rpc from '@subsquid/solana-rpc-data'
import {Base58Bytes} from '@subsquid/solana-rpc-data'
import {unexpectedCase} from '@subsquid/util-internal'
import assert from 'assert'
import {Instruction, LogMessage} from './data'
import {Message, parseLogMessage} from './log-parser'


const PROGRAMS_MISSING_INVOKE_LOG = new Set([
    'AddressLookupTab1e1111111111111111111111111',
    'BPFLoader1111111111111111111111111111111111',
    'BPFLoader2111111111111111111111111111111111',
    'BPFLoaderUpgradeab1e11111111111111111111111',
    'Ed25519SigVerify111111111111111111111111111',
    'KeccakSecp256k11111111111111111111111111111',
    'NativeLoader1111111111111111111111111111111',
    'ZkTokenProof1111111111111111111111111111111',
])


class ParsingError {
    logIndex?: number
    innerInstructionIndex?: number

    constructor(
        public message: string
    ) {}
}


class MessageStream {
    private messages: Message[]
    private pos = 0

    constructor(messages: string[]) {
        this.messages = messages.map(parseLogMessage)
    }

    get unfinished(): boolean {
        return !this.ended
    }

    get ended(): boolean {
        return this.pos >= this.messages.length || this.messages[this.pos].kind == 'truncate'
    }

    get truncated(): boolean {
        return this.pos < this.messages.length && this.messages[this.pos].kind == 'truncate'
    }

    get current(): Message {
        assert(this.pos < this.messages.length, 'eof reached')
        return this.messages[this.pos]
    }

    get position(): number {
        return this.pos
    }

    advance(): boolean {
        if (this.truncated) return false
        this.pos = Math.min(this.pos + 1, this.messages.length)
        return this.pos < this.messages.length
    }
}


export interface Journal {
    warn(props: any, msg: string): void
    error(props: any, msg: string): void
}


class TransactionContext {
    public readonly erroredInstruction: number
    public readonly exceededCallDepth: boolean

    private accounts: Base58Bytes[]

    constructor(
        public readonly transactionIndex: number,
        private tx: rpc.Transaction,
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
        if (err && 'InstructionError' in err) {
            let pos = err.InstructionError?.[0]
            let type = err.InstructionError?.[1]
            if (Number.isSafeInteger(pos)) {
                this.erroredInstruction = pos
            } else {
                this.erroredInstruction = tx.transaction.message.instructions.length
                this.journal.warn({
                    transaction: tx.transaction.signatures[0],
                    transactionError: err
                }, 'got InstructionError of unrecognized shape')
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

    getAccount(index: number): Base58Bytes {
        assert(index < this.accounts.length)
        return this.accounts[index]
    }

    warn(props: any, msg: string): void {
        this.journal.warn({
            transaction: this.tx.transaction.signatures[0],
            ...props
        }, msg)
    }

    error(props: any, msg: string): void {
        this.journal.error({
            transaction: this.tx.transaction.signatures[0],
            ...props
        }, msg)
    }
}


class InstructionTreeTraversal {
    private lastAddress: number[]
    private instructions: rpc.Instruction[]
    private pos = 0

    constructor(
        private tx: TransactionContext,
        private messages: MessageStream,
        private instructionIndex: number,
        instruction: rpc.Instruction,
        inner: rpc.Instruction[],
        private output: Instruction[],
        private log: LogMessage[]
    ) {
        this.lastAddress = [instructionIndex - 1]
        this.instructions = [instruction, ...inner]
    }

    private visit(stackHeight: number): void {
        let ins = this.current

        this.assert(
            ins.stackHeight == null || ins.stackHeight === stackHeight,
            'stack height mismatch',
            this.pos
        )

        let programId = this.tx.getAccount(ins.programIdIndex)

        if (
            this.messages.unfinished &&
            this.messages.current.kind === 'invoke' &&
            this.messages.current.programId === programId
        ) {
            this.assert(
                this.messages.current.stackHeight === stackHeight,
                'invoke message has unexpected stack height',
                this.pos,
                this.messages.position
            )
            this.messages.advance()
            this.invoke(stackHeight)
            return
        }

        if (this.messages.truncated) {
            return
        }

        if (PROGRAMS_MISSING_INVOKE_LOG.has(programId)) {

        }
    }

    private invoke(stackHeight: number): void {
        let pos = this.pos
        let ins = this.push(stackHeight)

        this.takeInstructionMessages(ins, pos)

        if (this.messages.truncated) {
            ins.hasDroppedLogMessages = true
            return
        }

        if (this.messages.ended) {
            throw this.error('unexpected end of log', pos)
        }

        let result = this.messages.current
        assert(result.kind === 'invoke-result')
        this.assert(
            result.programId === ins.programId,
            'invoke result message and instruction program ids don\'t match'
        )
        ins.error = result.error

        // consume invoke-less subcalls,
        // that might have left unvisited due to missing 'invoke' messages
        this.eatInvokeLessSubCalls(stackHeight)
    }

    private eatInvokeLessSubCalls(parentStackHeight: number) {
        while (this.unfinished) {
            let stackHeight = this.current.stackHeight ?? 2
            if (stackHeight >= parentStackHeight) return

            let pos = this.pos
            let ins = this.push()

            // even if we have some messages emitted,
            // we already assigned them to parent call
            ins.hasDroppedLogMessages = true

            if (PROGRAMS_MISSING_INVOKE_LOG.has(ins.programId)) {
                // all good, it is expected to not have 'invoke' message
            } else if (
                this.tx.exceededCallDepth &&
                this.tx.erroredInstruction == this.instructionIndex &&
                (this.ended || this.current.stackHeight == null || this.current.stackHeight < stackHeight)
            ) {
                // we've reached the max stack depth,
                // there will be no invoke message either
            } else {
                this.tx.warn({
                    instruction: this.instructionIndex,
                    innerInstruction: pos - 1,
                }, 'missing invoke message for inner instruction')
            }
        }
    }

    private takeInstructionMessages(ins: Instruction, pos: number): void {
        while (this.messages.unfinished) {
            let msg = this.messages.current
            switch(msg.kind) {
                case 'log':
                case 'data':
                case 'other':
                    this.log.push({
                        transactionIndex: this.tx.transactionIndex,
                        logIndex: this.messages.position,
                        instructionAddress: ins.instructionAddress,
                        programId: ins.programId,
                        kind: msg.kind,
                        message: msg.message
                    })
                    this.messages.advance()
                    break
                case 'cu':
                    if (ins.programId == msg.programId) {
                        ins.computeUnitsConsumed = msg.consumed
                        this.messages.advance()
                    } else {
                        throw this.error(
                            'unexpected programId in compute unit message',
                            pos,
                            this.messages.position
                        )
                    }
                    break
                case 'invoke':
                    this.visit(ins.instructionAddress.length + 1)
                    break
                case 'invoke-result':
                case 'truncate':
                    return
                default:
                    throw unexpectedCase()
            }
        }
    }

    private dropNonInvokeMessages(): boolean {
        let dropped = false
        while (this.messages.unfinished) {
            switch(this.messages.current.kind) {
                case 'log':
                case 'data':
                case 'cu':
                case 'other':
                    dropped = true
                    this.messages.advance()
                    break
                default:
                    return dropped
            }
        }
        return dropped
    }

    private finishLogLess(): void {
        while (this.unfinished) {
            this.push().hasDroppedLogMessages = true
        }
    }

    private get current(): rpc.Instruction {
        assert(this.pos < this.instructions.length)
        return this.instructions[this.pos]
    }

    private get unfinished(): boolean {
        return this.pos < this.instructions.length
    }

    private get ended(): boolean {
        return !this.unfinished
    }

    private assert(ok: any, msg: string, pos?: number, messagePos?: number): void {
        if (!ok) throw this.error(msg, pos, messagePos)
    }

    private error(msg: string, pos?: number, messagePos?: number): ParsingError {
        let err = new ParsingError(msg)
        if (pos) {
            err.innerInstructionIndex = pos - 1
        }
        if (messagePos != null) {
            err.logIndex = messagePos
        }
        return err
    }

    private push(stackHeight?: number): Instruction {
        let ins = this.current

        stackHeight = stackHeight ?? ins.stackHeight ?? 2

        assert(stackHeight > 0)
        if (ins.stackHeight != null) {
            assert(stackHeight === ins.stackHeight)
        }

        let address = this.lastAddress.slice()

        while (address.length > stackHeight) {
            address.pop()
        }

        if (address.length === stackHeight) {
            address[stackHeight - 1] += 1
        } else {
            assert(address.length + 1 == stackHeight)
            address[stackHeight - 1] = 0
        }

        let mapped: Instruction = {
            transactionIndex: this.tx.transactionIndex,
            instructionAddress: address,
            programId: this.tx.getAccount(ins.programIdIndex),
            accounts: ins.accounts.map(a => this.tx.getAccount(a)),
            data: ins.data,
            isCommitted: this.tx.isCommitted,
            hasDroppedLogMessages: false
        }

        this.output.push(mapped)
        this.lastAddress = address
        this.pos = Math.min(this.pos + 1, this.instructions.length)
        return mapped
    }
}
