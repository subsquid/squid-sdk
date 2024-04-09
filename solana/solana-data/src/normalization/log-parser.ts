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
