import * as rpc from '@subsquid/solana-rpc-data'
import {unexpectedCase} from '@subsquid/util-internal'
import assert from 'assert'
import {Instruction, LogMessage} from './data'
import {
    LogFormat,
    isV13Message,
    isModernStructuralMessage,
    V13ComputeUnitsMessage,
    V13InvokeMessage,
    V13InvokeResultMessage,
    Message,
    OtherMessage,
    parseLogMessage
} from './log-parser'
import {TransactionContext} from './transaction-context'


const PROGRAMS_MISSING_INVOKE_LOG = new Set([
    'AddressLookupTab1e1111111111111111111111111',
    'BPFLoader1111111111111111111111111111111111',
    'BPFLoader2111111111111111111111111111111111',
    'BPFLoaderUpgradeab1e11111111111111111111111',
    'Ed25519SigVerify111111111111111111111111111',
    'KeccakSecp256k11111111111111111111111111111',
    'NativeLoader1111111111111111111111111111111',
    'ZkTokenProof1111111111111111111111111111111',
    'Secp256r1SigVerify1111111111111111111111111',
    'ComputeBudget111111111111111111111111111111',
])

export class ParsingError {
    instructionIndex?: number
    innerInstructionIndex?: number
    programId?: string
    logMessageIndex?: number

    constructor(public msg: string) {}
}

export class MessageStream {
    private messages: Message[]
    private pos = 0

    /**
     * Log format, as detected from the structural (invoke / result / compute units) messages:
     *
     *  - `modern`: `Program X invoke [n]`, `Program X consumed N of M compute units`, `Program X success`
     *  - `v1.3`: `Call BPF program X`, `BPF program consumed N of M units`, `BPF program X success`
     *    (written by the v1.3 runtime)
     *  - `unknown`: there are no structural messages at all
     */
    public readonly format: LogFormat | 'unknown'

    /**
     * `true`, when calls without log messages are expected (the v1.3 rules):
     * only BPF programs log their calls,
     * native programs (System, Vote, Stake, etc.) are executed without any log messages.
     *
     * It is set for `v1.3` logs, and might be set by the caller
     * for an `unknown` one, when the format is known from elsewhere (e.g. from other transactions of the block).
     */
    public nativeProgramsAreSilent: boolean

    /**
     * Programs known to log their calls, while {@link nativeProgramsAreSilent} is set
     * (e.g. the programs of `Call BPF program X` messages of the whole block).
     * A call of such a program without log messages is a missing log, not a silent native call.
     */
    public loggingPrograms: ReadonlySet<string> = new Set()

    constructor(messages: string[]) {
        this.messages = messages.map(parseLogMessage)
        this.format = this.detectFormat(messages)
        this.nativeProgramsAreSilent = this.format === 'v1.3'
    }

    /**
     * Programs of the `Call BPF program X` messages of this log
     */
    calledPrograms(): string[] {
        let programs: string[] = []
        for (let msg of this.messages) {
            if (msg instanceof V13InvokeMessage) programs.push(msg.programId)
        }
        return programs
    }

    private detectFormat(lines: string[]): LogFormat | 'unknown' {
        let legacy = false
        let modern = false
        for (let msg of this.messages) {
            if (isV13Message(msg)) {
                legacy = true
            } else if (isModernStructuralMessage(msg)) {
                modern = true
            }
        }

        if (!legacy) return modern ? 'modern' : 'unknown'

        if (modern) {
            // Formats are never mixed within a transaction.
            // Should that happen, treat old-style lines as plain messages,
            // as they were treated before v1.3 format support.
            this.messages = this.messages.map((msg, i) => isV13Message(msg) ? new OtherMessage(lines[i]) : msg)
            return 'modern'
        }

        // Old-style messages don't carry stack height and compute unit messages don't carry program id,
        // restore them from the bracket structure.
        let stack: V13InvokeMessage[] = []
        for (let msg of this.messages) {
            if (msg instanceof V13InvokeMessage) {
                stack.push(msg)
                msg.stackHeight = stack.length
            } else if (msg instanceof V13ComputeUnitsMessage) {
                msg.programId = stack[stack.length - 1]?.programId
            } else if (msg instanceof V13InvokeResultMessage) {
                stack.pop()
            }
        }

        return 'v1.3'
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


export class InstructionTreeTraversal {
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
        this.instructions = [{...instruction, stackHeight: 1}, ...inner]
        if (this.tx.erroredInstruction >= this.instructionIndex) {
            let root = this.call(1)
            // Inner instructions left after a call without log messages share its flag:
            // under the v1.3 rules a silent call dropped nothing, so neither did its callees.
            this.finishLogLess(this.messages.nativeProgramsAreSilent && root ? root.hasDroppedLogMessages : true)
        } else {
            this.assert(this.instructions.length === 1, 'failed instructions should not have inner calls', 0)
            this.push(1)
        }
        this.assert(this.ended, 'not all inner instructions where consumed', 0)
    }

    /**
     * Maps the current instruction. Returns it, or `undefined` when the log is truncated:
     * then the instruction is left for {@link finishLogLess}.
     */
    private call(stackHeight: number): Instruction | undefined {
        let ins = this.current

        this.assert(ins.stackHeight == null || ins.stackHeight === stackHeight, 'stack height mismatch', this.pos)

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
            return this.invoke(stackHeight)
        }

        if (this.messages.truncated) {
            return
        }

        if (this.messages.nativeProgramsAreSilent && !this.messages.loggingPrograms.has(programId)) {
            // The old runtime logged only calls of BPF programs.
            // Native programs (System, Vote, Stake, etc.) were executed without any log messages,
            // and a BPF program that failed before being invoked has nothing logged either.
            // So nothing was dropped and the following messages belong to someone else.
            // A program that logs its calls elsewhere in the block is not silent: it falls through
            // to the checks below.
            return this.push(stackHeight)
        }

        if (PROGRAMS_MISSING_INVOKE_LOG.has(programId)) {
        } else if (
            this.tx.couldFailBeforeInvokeMessage &&
            this.tx.erroredInstruction == this.instructionIndex &&
            this.pos + 1 == this.instructions.length
        ) {
            // instruction processing has not reached 'invoke message' logging point
        } else if (this.messages.ended) {
            this.warn('unexpected end of message log', this.pos)
        } else {
            this.warn('missing invoke message', this.pos, this.messages.position)
        }

        let mapped = this.push(stackHeight)
        mapped.hasDroppedLogMessages = true
        this.dropNonInvokeMessages()
        return mapped
    }

    private invoke(stackHeight: number): Instruction {
        let pos = this.pos
        let ins = this.push(stackHeight)

        this.takeInstructionMessages(ins, pos)

        if (this.messages.truncated) {
            ins.hasDroppedLogMessages = true
            return ins
        }

        if (this.messages.ended) {
            throw this.error('unexpected end of log', pos)
        }

        let result = this.messages.current
        assert(result.kind === 'invoke-result')
        this.assert(
            result.programId === ins.programId,
            'invoke result message and instruction program ids don\'t match',
            pos
        )
        ins.error = result.error
        this.messages.advance()

        // consume invoke-less subcalls,
        // that might have left unvisited due to missing 'invoke' messages
        this.eatInvokeLessSubCalls(ins)
        return ins
    }

    private eatInvokeLessSubCalls(parent: Instruction) {
        while (this.unfinished) {
            let stackHeight: number
            if (this.current.stackHeight == null) {
                if (parent.error) {
                    // all remaining calls must belong to the given parent
                    stackHeight = parent.instructionAddress.length + 1
                } else {
                    stackHeight = 2
                }
            } else {
                stackHeight = this.current.stackHeight
            }

            if (stackHeight <= parent.instructionAddress.length) return

            let pos = this.pos
            let ins = this.push(stackHeight)

            if (this.messages.nativeProgramsAreSilent && !this.messages.loggingPrograms.has(ins.programId)) {
                // calls without log messages are expected in the old format, see .call()
                continue
            }

            // even if we have some messages emitted,
            // we already assigned them to parent call
            ins.hasDroppedLogMessages = true

            if (PROGRAMS_MISSING_INVOKE_LOG.has(ins.programId)) {
                // all good, it is expected to not have 'invoke' message
            } else if (
                this.tx.couldFailBeforeInvokeMessage &&
                this.tx.erroredInstruction == this.instructionIndex &&
                this.ended
            ) {
                // instruction processing has not reached 'invoke message' logging point
            } else {
                this.warn('missing invoke message for inner instruction', pos)
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
                        message: msg.message,
                    })
                    this.messages.advance()
                    break
                case 'cu':
                    if (ins.programId == msg.programId) {
                        ins.computeUnitsConsumed = msg.consumed
                        this.messages.advance()
                    } else {
                        throw this.error('unexpected programId in compute unit message', pos, this.messages.position)
                    }
                    break
                case 'invoke':
                    // a call, that has no instruction left to match
                    this.assert(this.unfinished, 'invoke message without a matching instruction', pos, this.messages.position)
                    this.call(ins.instructionAddress.length + 1)
                    break
                case 'invoke-result':
                case 'truncate':
                    return
                default:
                    throw unexpectedCase()
            }
        }
    }

    private dropNonInvokeMessages(): void {
        while (this.messages.unfinished) {
            let msg = this.messages.current
            switch(msg.kind) {
                case 'log':
                case 'data':
                case 'cu':
                case 'other':
                    this.messages.advance()
                    break
                case 'invoke':
                case 'invoke-result':
                case 'truncate':
                    return
                default:
                    throw unexpectedCase()
            }
        }
    }

    private finishLogLess(dropped: boolean): void {
        while (this.unfinished) {
            this.push(this.current.stackHeight ?? 2).hasDroppedLogMessages = dropped
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

    private assert(ok: any, msg: string, pos: number, messagePos?: number): void {
        if (!ok) throw this.error(msg, pos, messagePos)
    }

    private error(msg: string, pos: number, messagePos?: number): ParsingError {
        let err = new ParsingError(msg)
        err.instructionIndex = this.instructionIndex
        if (pos) {
            err.innerInstructionIndex = pos - 1
        }
        err.programId = this.tx.getAccount(this.instructions[pos].programIdIndex)
        if (messagePos != null) {
            err.logMessageIndex = messagePos
        }
        return err
    }

    private warn(msg: string, pos: number, messagePos?: number): void {
        let {msg: message, ...props} = this.error(msg, pos, messagePos)
        this.tx.warn(props, message)
    }

    private push(stackHeight: number): Instruction {
        assert(stackHeight > 0)

        let ins = this.current
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
        assert(address[0] === this.instructionIndex)

        let mapped: Instruction = {
            transactionIndex: this.tx.transactionIndex,
            instructionAddress: address,
            programId: this.tx.getAccount(ins.programIdIndex),
            accounts: ins.accounts.map(a => this.tx.getAccount(a)),
            data: ins.data,
            isCommitted: this.tx.isCommitted,
            hasDroppedLogMessages: false,
        }

        this.output.push(mapped)
        this.lastAddress = address
        this.pos = Math.min(this.pos + 1, this.instructions.length)
        return mapped
    }
}
