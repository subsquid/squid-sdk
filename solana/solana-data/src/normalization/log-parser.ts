import {unexpectedCase} from '@subsquid/util-internal'
import {Base58Bytes} from '../base'


interface InvokeToken {
    kind: 'invoke'
    programId: Base58Bytes
    stackHeight: number
}


interface InvokeResultToken {
    kind: 'invoke-result'
    programId: Base58Bytes
    success: boolean
    error?: string
}


export interface ProgramLogMessage {
    kind: 'log'
    message: string
}


export interface ComputeUnitsMessage {
    kind: 'cu'
    programId: Base58Bytes
    consumed: bigint
    available: bigint
}


export interface ProgramDataMessage {
    kind: 'data'
    message: string
}


export interface UnclassifiedMessage {
    kind: 'other'
    message: string
}


export type Token = InvokeToken
    | InvokeResultToken
    | ProgramLogMessage
    | ComputeUnitsMessage
    | ProgramDataMessage
    | UnclassifiedMessage


export function toToken(msg: string): Token {
    let m = /^Program ([123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+) invoke \[(\d+)]$/.exec(msg)
    if (m) return {
        kind: 'invoke',
        programId: m[1],
        stackHeight: parseInt(m[2])
    }

    m = /^Program ([123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+) success$/.exec(msg)
    if (m) return {
        kind: 'invoke-result',
        programId: m[1],
        success: true
    }

    m = /^Program ([123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+) failed: (.*)$/.exec(msg)
    if (m) return {
        kind: 'invoke-result',
        programId: m[1],
        success: false,
        error: m[2]
    }

    m = /^Program ([123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+) consumed (\d+) of (\d+) compute units$/.exec(msg)
    if (m) return {
        kind: 'cu',
        programId: m[1],
        available: BigInt(m[3]),
        consumed: BigInt(m[2])
    }

    m = /^Program log: (.*)$/.exec(msg)
    if (m) return {
        kind: 'log',
        message: m[1]
    }

    m = /^Program data: (.*)$/.exec(msg)
    if (m) return {
        kind: 'data',
        message: m[1]
    }

    return {
        kind: 'other',
        message: msg
    }
}


export interface InstructionRecord {
    kind: 'instruction'
    programId: Base58Bytes
    stackHeight: number
    success: boolean
    error?: string
    log: (InstructionRecord | ComputeUnitsMessage | ProgramLogMessage | ProgramDataMessage | UnclassifiedMessage)[]
}


const ParseFailure = new Error('parsing failure')


export class LogParser {
    private pos = 0
    private instructions: InstructionRecord[] = []
    private success = true
    private failure?: string

    constructor(private messages: string[]) {
        try {
            this.parse()
        } catch(err: any) {
            if (err === ParseFailure) {
                this.success = false
            } else {
                throw err
            }
        }
    }

    ok(): boolean {
        return this.success
    }

    getError(): string | undefined {
        return this.failure
    }

    getResult(): InstructionRecord[] {
        return this.instructions
    }

    getPos(): number {
        return this.pos
    }

    private parse(): void {
        while (this.pos < this.messages.length) {
            let token = toToken(this.message())
            this.assert(token.kind === 'invoke', 'invoke message expected')
            this.pos += 1
            this.instructions.push(this.invoke(token))
        }
    }

    private invoke(invoke: InvokeToken): InstructionRecord {
        let log: InstructionRecord['log'] = []
        let result: InvokeResultToken

        LOOP: while (true) {
            let msg = this.message()
            let token = toToken(msg)
            switch(token.kind) {
                case 'invoke':
                    this.assert(
                        token.stackHeight > invoke.stackHeight,
                        'child invoke should have greater stack height '
                    )
                    this.pos += 1
                    log.push(this.invoke(token))
                    break
                case 'invoke-result':
                    this.assert(
                        invoke.programId === token.programId,
                        'invoke result program does not match invoked program'
                    )
                    this.pos += 1
                    result = token
                    break LOOP
                case 'cu':
                    this.assert(
                        token.programId === invoke.programId,
                        'programId of compute units message does not match the programId of the invocation'
                    )
                    log.push(token)
                    this.pos += 1
                    break
                case 'log':
                case 'other':
                    log.push(token)
                    this.pos += 1
                    break
                default:
                    throw unexpectedCase()
            }
        }

        let rec: InstructionRecord = {
            kind: 'instruction',
            programId: invoke.programId,
            stackHeight: invoke.stackHeight,
            success: result.success,
            log
        }

        if (result.error) {
            rec.error = result.error
        }

        return rec
    }

    private message(): string {
        this.assert(this.pos < this.messages.length, 'unexpected end of messages')
        return this.messages[this.pos]
    }

    private assert(value: unknown, msg: string): asserts value {
        if (value) return
        this.failure = msg
        throw ParseFailure
    }
}
