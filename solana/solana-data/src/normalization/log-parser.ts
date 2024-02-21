import {Base58Bytes} from '../base'


export class InvokeMessage {
    public kind = 'invoke' as const

    constructor(
        public programId: Base58Bytes,
        public stackHeight: number
    ) {}

    static parse(msg: string): InvokeMessage | undefined {
        let m = /^Program ([123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+) invoke \[(\d+)]$/.exec(msg)
        if (m) return new InvokeMessage(m[1], parseInt(m[2]))
    }

    toString(): string {
        return `Program ${this.programId} invoke [${this.stackHeight}]`
    }
}


export class InvokeResultMessage {
    public kind = 'invoke-result' as const

    constructor(
        public programId: Base58Bytes,
        public success: boolean,
        public error?: string
    ) {}

    static parse(msg: string): InvokeResultMessage | undefined {
        let m = /^Program ([123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+) success$/.exec(msg)
        if (m) return new InvokeResultMessage(m[1], true)

        m = /^Program ([123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+) failed: (.*)$/.exec(msg)
        if (m) return new InvokeResultMessage(m[1], false, m[2])
    }

    toString(): string {
        if (this.success) {
            return `Program ${this.programId} success`
        } else {
            return `Program ${this.programId} failed: ${this.error}`
        }
    }
}


export class ProgramLogMessage {
    public kind = 'log' as const

    constructor(public message: string) {}

    static parse(msg: string): ProgramLogMessage | undefined {
        let m = /^Program log: (.*)$/.exec(msg)
        if (m) return new ProgramLogMessage(m[1])
    }

    toString(): string {
        return `Program log: ${this.message}`
    }
}


export class ComputeUnitsMessage {
    public kind = 'cu' as const

    constructor(
        public programId: Base58Bytes,
        public consumed: bigint,
        public available: bigint
    ) {}

    static parse(msg: string): ComputeUnitsMessage | undefined {
        let m = /^Program ([123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+) consumed (\d+) of (\d+) compute units$/.exec(msg)
        if (m) return new ComputeUnitsMessage(m[1], BigInt(m[2]), BigInt(m[3]))
    }

    toString(): string {
        return `Program ${this.programId} consumed ${this.consumed} of ${this.available} compute units`
    }
}


export class ProgramDataMessage {
    public kind = 'data' as const

    constructor(
        public message: string
    ) {}

    static parse(msg: string): ProgramDataMessage | undefined {
        let m = /^Program data: (.*)$/.exec(msg)
        if (m) return new ProgramDataMessage(m[1])
    }

    toString(): string {
        return `Program data: ${this.message}`
    }
}


export class LogTruncatedMessage {
    public kind = 'truncate' as const

    static parse(msg: string): LogTruncatedMessage | undefined {
        if (msg == 'Log truncated') return new LogTruncatedMessage()
    }

    toString(): string {
        return 'Log truncated'
    }
}


export class OtherMessage {
    public kind = 'other' as const

    constructor(public message: string) {}

    toString(): string {
        return this.message
    }
}


export type Message =
    InvokeMessage |
    InvokeResultMessage |
    ProgramLogMessage |
    ProgramDataMessage |
    ComputeUnitsMessage |
    LogTruncatedMessage |
    OtherMessage


export function parseLogMessage(msg: string): Message {
    return InvokeMessage.parse(msg)
        || InvokeResultMessage.parse(msg)
        || ProgramLogMessage.parse(msg)
        || ProgramDataMessage.parse(msg)
        || ComputeUnitsMessage.parse(msg)
        || LogTruncatedMessage.parse(msg)
        || new OtherMessage(msg)
}


// export interface InstructionRecord {
//     kind: 'instruction'
//     programId: Base58Bytes
//     stackHeight: number
//     invokeMessagePos: number
//     resultMessagePos: number
//     log: LogRecord[]
//     truncated: boolean
//     computeUnitsConsumed?: bigint
//     computeUnitsAvailable?: bigint
//     success?: boolean
//     error?: string
// }
//
//
// export type LogRecord = InstructionRecord | ProgramLogMessage | ProgramDataMessage | OtherMessage
//
//
// const ParseFailure = new Error('parsing failure')
//
//
// export class LogParser {
//     private pos = 0
//     private records: LogRecord[] = []
//     private success = true
//     private failure?: string
//     private truncated = false
//
//     constructor(private messages: string[]) {
//         try {
//             this.parse()
//         } catch(err: any) {
//             if (err === ParseFailure) {
//                 this.success = false
//             } else {
//                 throw err
//             }
//         }
//     }
//
//     ok(): boolean {
//         return this.success
//     }
//
//     getError(): string | undefined {
//         return this.failure
//     }
//
//     isTruncated(): boolean {
//         return this.truncated
//     }
//
//     getResult(): LogRecord[] {
//         return this.records
//     }
//
//     getPos(): number {
//         return this.pos
//     }
//
//     private parse(): void {
//         while (this.pos < this.messages.length && !this.truncated) {
//             let token = this.token()
//             this.pos += 1
//             switch(token.kind) {
//                 case 'invoke':
//                     this.records.push(this.invoke(token))
//                     break
//                 case 'log':
//                 case 'data':
//                 case 'other':
//                     this.records.push(token)
//                     break
//                 case 'truncate':
//                     this.truncated = true
//                     return
//                 case 'cu':
//                     break
//                 case 'invoke-result':
//                     this.fail('unexpected invoke result message')
//                 default:
//                     throw unexpectedCase()
//             }
//         }
//     }
//
//     private invoke(invoke: InvokeMessage): InstructionRecord {
//         let rec: InstructionRecord = {
//             kind: 'instruction',
//             programId: invoke.programId,
//             stackHeight: invoke.stackHeight,
//             log: [],
//             invokeMessagePos: this.pos - 1,
//             resultMessagePos: -1,
//             truncated: false
//         }
//
//         while (true) {
//             let token = this.token()
//             switch(token.kind) {
//                 case 'invoke':
//                     this.assert(
//                         token.stackHeight > invoke.stackHeight,
//                         'child invoke should have greater stack height '
//                     )
//                     this.pos += 1
//                     rec.log.push(this.invoke(token))
//                     break
//                 case 'invoke-result':
//                     this.assert(
//                         invoke.programId === token.programId,
//                         'invoke result program does not match invoked program'
//                     )
//                     rec.resultMessagePos = this.pos
//                     rec.success = token.success
//                     if (token.error) {
//                         rec.error = token.error
//                     }
//                     this.pos += 1
//                     return rec
//                 case 'cu':
//                     this.assert(
//                         token.programId === invoke.programId,
//                         'programId of compute units message does not match the programId of the invocation'
//                     )
//                     rec.computeUnitsConsumed = token.consumed
//                     rec.computeUnitsAvailable = token.available
//                     this.pos += 1
//                     break
//                 case 'log':
//                 case 'data':
//                 case 'other':
//                     rec.log.push(token)
//                     this.pos += 1
//                     break
//                 case 'truncate':
//                     this.truncated = true
//                     rec.truncated = true
//                     this.pos += 1
//                     return rec
//                 default:
//                     throw unexpectedCase()
//             }
//         }
//     }
//
//     private token(): LogMessage {
//         this.assert(this.pos < this.messages.length, 'unexpected end of messages')
//         return parseLogMessage(this.messages[this.pos])
//     }
//
//     private assert(value: unknown, msg: string): asserts value {
//         if (value) return
//         this.fail(msg)
//     }
//
//     private fail(msg: string): never {
//         this.failure = msg
//         throw ParseFailure
//     }
// }
