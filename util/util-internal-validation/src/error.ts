import {print} from './util'


export class ValidationFailure {
    path: (string | number)[] = []

    constructor(
        public value: unknown,
        public message: string
    ) {}

    toString(): string {
        let msg = this.message
        if (msg.includes('{value}')) {
            msg = msg.replace('{value}', print(this.value))
        }
        if (this.path.length) {
            msg = `invalid value at ${this.getPathString()}: ${msg}`
        }
        return msg
    }

    getPathString(): string {
        let s = ''
        for (let i = this.path.length - 1; i >= 0; i--) {
            s += '/' + this.path[i]
        }
        return s
    }
}


export class DataValidationError extends Error {
    get name(): string {
        return 'DataValidationError'
    }
}
