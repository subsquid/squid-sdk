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
export class V13InvokeMessage {
    public kind = 'invoke' as const

    constructor(
        public programId: Base58Bytes,
        public stackHeight: number = 0
    ) {}

    static parse(msg: string): V13InvokeMessage | undefined {
        let m = /^Call BPF program ([123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+)$/.exec(msg)
        if (m) return new V13InvokeMessage(m[1])
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
export class V13InvokeResultMessage {
    public kind = 'invoke-result' as const

    constructor(
        public programId: Base58Bytes,
        public success: boolean,
        public error?: string
    ) {}

    static parse(msg: string): V13InvokeResultMessage | undefined {
        let m = /^BPF program ([123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+) success$/.exec(msg)
        if (m) return new V13InvokeResultMessage(m[1], true)

        m = /^BPF program ([123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+) failed: (.*)$/.exec(msg)
        if (m) return new V13InvokeResultMessage(m[1], false, m[2])
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
export class V13ComputeUnitsMessage {
    public kind = 'cu' as const

    constructor(
        public consumed: bigint,
        public available: bigint,
        public programId?: Base58Bytes
    ) {}

    static parse(msg: string): V13ComputeUnitsMessage | undefined {
        let m = /^BPF program consumed (\d+) of (\d+) units$/.exec(msg)
        if (m) return new V13ComputeUnitsMessage(BigInt(m[1]), BigInt(m[2]))
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


export type V13Message =
    V13InvokeMessage |
    V13InvokeResultMessage |
    V13ComputeUnitsMessage


export type Message =
    InvokeMessage |
    InvokeResultMessage |
    ProgramLogMessage |
    ProgramDataMessage |
    ComputeUnitsMessage |
    LogTruncatedMessage |
    V13Message |
    OtherMessage


export function parseLogMessage(msg: string): Message {
    return InvokeMessage.parse(msg)
        || InvokeResultMessage.parse(msg)
        || ProgramLogMessage.parse(msg)
        || ProgramDataMessage.parse(msg)
        || ComputeUnitsMessage.parse(msg)
        || LogTruncatedMessage.parse(msg)
        || V13InvokeMessage.parse(msg)
        || V13InvokeResultMessage.parse(msg)
        || V13ComputeUnitsMessage.parse(msg)
        || new OtherMessage(msg)
}


/**
 * Format of the structural (invoke / result / compute units) log messages:
 * `modern` (`Program X invoke [n]` ...) or `v1.3` (`Call BPF program X` ..., written by the v1.3 runtime).
 */
export type LogFormat = 'modern' | 'v1.3'


/**
 * The log format of one transaction log, from its structural messages alone,
 * or `undefined` when it has none. A log with both kinds counts as `modern`, see `MessageStream`.
 */
export function detectLogFormat(lines: readonly string[]): LogFormat | undefined {
    let v13 = false
    for (let line of lines) {
        if (InvokeMessage.parse(line) || InvokeResultMessage.parse(line) || ComputeUnitsMessage.parse(line)) {
            return 'modern'
        }
        if (!v13 && (V13InvokeMessage.parse(line) || V13InvokeResultMessage.parse(line) || V13ComputeUnitsMessage.parse(line))) {
            v13 = true
        }
    }
    return v13 ? 'v1.3' : undefined
}


export function isV13Message(msg: Message): msg is V13Message {
    return msg instanceof V13InvokeMessage
        || msg instanceof V13InvokeResultMessage
        || msg instanceof V13ComputeUnitsMessage
}


export function isModernStructuralMessage(msg: Message): boolean {
    return msg instanceof InvokeMessage
        || msg instanceof InvokeResultMessage
        || msg instanceof ComputeUnitsMessage
}
