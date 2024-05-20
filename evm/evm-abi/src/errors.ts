export class DecodingError extends Error {
    readonly name = 'DecodingError'
}

export class EventTopicCountMismatchError extends DecodingError {
    constructor({count, targetCount}: {count: number; targetCount: number}) {
        super(`Topic count mismatch. Expected ${count} topics, but received ${targetCount}.`)
    }
}

export class EventEmptyTopicsError extends DecodingError {
    constructor() {
        super(`Cannot extract event signature from empty topics.`)
    }
}

export class EventInvalidSignatureError extends DecodingError {
    constructor({sig, targetSig}: {sig: string; targetSig: string}) {
        super(`Invalid event signature. Expected "${targetSig}", but received ${sig}.`)
    }
}

export class FunctionInvalidSignatureError extends DecodingError {
    constructor({sig, targetSig}: {sig: string; targetSig: string}) {
        super(`Invalid function signature. Expected "${targetSig}", but received ${sig}.`)
    }
}
