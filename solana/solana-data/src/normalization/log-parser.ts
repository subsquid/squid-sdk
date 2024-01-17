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
}


interface MessageToken {
    kind: 'message'
}


export type Token = InvokeToken | InvokeResultToken | MessageToken


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

    m = /^Program ([123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+) failed/.exec(msg)
    if (m) return {
        kind: 'invoke-result',
        programId: m[1],
        success: false
    }

    return {
        kind: 'message'
    }
}


export interface InstructionRecord {
    success: boolean
    stackHeight: number
    programId: Base58Bytes
    log: (string | InstructionRecord)[]
}


const ParseFailure = new Error('parsing failure')


export class LogParser {
    private pos = 0
    private records: InstructionRecord[] = []
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
        return this.records
    }

    getPos(): number {
        return this.pos
    }

    private parse(): void {
        while (this.pos < this.messages.length) {
            let token = toToken(this.message())
            this.assert(token.kind === 'invoke', 'invoke message expected')
            this.pos += 1
            this.records.push(this.invoke(token))
        }
    }

    private invoke(invoke: InvokeToken): InstructionRecord {
        let log: (string | InstructionRecord)[] = []
        let result: InvokeResultToken

        LOOP: while (true) {
            let msg = this.message()
            let token = toToken(msg)
            switch(token.kind) {
                case 'message':
                    this.pos += 1
                    log.push(msg)
                    break
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
                default:
                    throw unexpectedCase()
            }
        }

        return {
            success: result.success,
            stackHeight: invoke.stackHeight,
            programId: invoke.programId,
            log
        }
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
