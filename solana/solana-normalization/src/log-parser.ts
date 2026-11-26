import type {Base58Bytes} from '@subsquid/solana-rpc-data'


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


/**
 * `Call BPF program <id>`
 *
 * Old (v1.3 runtime) counterpart of {@link InvokeMessage}.
 * It does not carry a stack height, the actual value is assigned by {@link MessageStream}
 * from the bracket depth.
 */
export class LegacyInvokeMessage {
    public kind = 'invoke' as const

    constructor(
        public programId: Base58Bytes,
        public stackHeight: number = 0
    ) {}

    static parse(msg: string): LegacyInvokeMessage | undefined {
        let m = /^Call BPF program ([123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+)$/.exec(msg)
        if (m) return new LegacyInvokeMessage(m[1])
    }

    toString(): string {
        return `Call BPF program ${this.programId}`
    }
}


/**
 * `BPF program <id> success` / `BPF program <id> failed: <err>`
 *
 * Old (v1.3 runtime) counterpart of {@link InvokeResultMessage}.
 */
export class LegacyInvokeResultMessage {
    public kind = 'invoke-result' as const

    constructor(
        public programId: Base58Bytes,
        public success: boolean,
        public error?: string
    ) {}

    static parse(msg: string): LegacyInvokeResultMessage | undefined {
        let m = /^BPF program ([123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+) success$/.exec(msg)
        if (m) return new LegacyInvokeResultMessage(m[1], true)

        m = /^BPF program ([123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+) failed: (.*)$/.exec(msg)
        if (m) return new LegacyInvokeResultMessage(m[1], false, m[2])
    }

    toString(): string {
        if (this.success) {
            return `BPF program ${this.programId} success`
        } else {
            return `BPF program ${this.programId} failed: ${this.error}`
        }
    }
}


/**
 * `BPF program consumed <N> of <M> units`
 *
 * Old (v1.3 runtime) counterpart of {@link ComputeUnitsMessage}.
 * The message does not name the program, it belongs to the innermost open call.
 * {@link MessageStream} fills in the `programId` (it stays undefined, when there is no open call).
 */
export class LegacyComputeUnitsMessage {
    public kind = 'cu' as const

    constructor(
        public consumed: bigint,
        public available: bigint,
        public programId?: Base58Bytes
    ) {}

    static parse(msg: string): LegacyComputeUnitsMessage | undefined {
        let m = /^BPF program consumed (\d+) of (\d+) units$/.exec(msg)
        if (m) return new LegacyComputeUnitsMessage(BigInt(m[1]), BigInt(m[2]))
    }

    toString(): string {
        return `BPF program consumed ${this.consumed} of ${this.available} units`
    }
}


export class OtherMessage {
    public kind = 'other' as const

    constructor(public message: string) {}

    toString(): string {
        return this.message
    }
}


export type LegacyMessage =
    LegacyInvokeMessage |
    LegacyInvokeResultMessage |
    LegacyComputeUnitsMessage


export type Message =
    InvokeMessage |
    InvokeResultMessage |
    ProgramLogMessage |
    ProgramDataMessage |
    ComputeUnitsMessage |
    LogTruncatedMessage |
    LegacyMessage |
    OtherMessage


export function parseLogMessage(msg: string): Message {
    return InvokeMessage.parse(msg)
        || InvokeResultMessage.parse(msg)
        || ProgramLogMessage.parse(msg)
        || ProgramDataMessage.parse(msg)
        || ComputeUnitsMessage.parse(msg)
        || LogTruncatedMessage.parse(msg)
        || LegacyInvokeMessage.parse(msg)
        || LegacyInvokeResultMessage.parse(msg)
        || LegacyComputeUnitsMessage.parse(msg)
        || new OtherMessage(msg)
}


export function isLegacyMessage(msg: Message): msg is LegacyMessage {
    return msg instanceof LegacyInvokeMessage
        || msg instanceof LegacyInvokeResultMessage
        || msg instanceof LegacyComputeUnitsMessage
}


export function isModernStructuralMessage(msg: Message): boolean {
    return msg instanceof InvokeMessage
        || msg instanceof InvokeResultMessage
        || msg instanceof ComputeUnitsMessage
}
