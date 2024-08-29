export class DecodingError extends Error {
    readonly name = 'DecodingError'
}

export class EventTopicCountMismatchError extends DecodingError {
    constructor({count, targetCount}: {count: number; targetCount: number}) {
        super(`Topic count mismatch. Expected ${targetCount} topics, but received ${count}.`)
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

export class EventDecodingError extends Error {
    constructor(signature: string, argumentName: string, data: string, message: any) {
        super(`Error decoding argument ${argumentName} of event ${signature}:\n\n${data}\n\n${message}`)
        this.name = 'EventDecodingError'
    }
}

export class UnexpectedFunctionError extends Error {
    constructor(expectedSignature: string, gotSignature: string) {
        super(`unexpected function signature. Expected: ${expectedSignature}, got: ${gotSignature}`)
        this.name = 'UnexpectedFunctionError';
    }
}

export class FunctionCalldataDecodeError extends Error {
    constructor(functionSignature: string, argumentName: string,  message: string, data: string) {
        super(`Error decoding argument ${argumentName} of function ${functionSignature}:\n\n${data}\n\n${message}`)
        this.name = 'FunctionCalldataDecodeError';
    }
}

export class FunctionResultDecodeError extends Error {
    constructor(functionSignature: string, argumentName: string,  message: string, data: string) {
        super(`Error decoding return argument ${argumentName} of function ${functionSignature}:\n\n${data}\n\n${message}`)
        this.name = 'FunctionResultDecodeError';
    }
}
