import {UserInputError} from '@subsquid/apollo-server-core'
import assert from 'assert'


export class Limit {
    constructor(private error: Error, private value: number) {
        assert(this.value > 0)
    }

    get left(): number {
        return Math.max(this.value, 0)
    }

    check(cb: (left: number) => number): void {
        if (this.value < 0) throw this.error
        let left = this.value - cb(this.value)
        if (left < 0) {
            throw this.error
        } else {
            this.value = left
        }
    }
}


const SIZE_LIMIT = new UserInputError('response might exceed the size limit')
SIZE_LIMIT.stack = undefined


export class ResponseSizeLimit extends Limit {
    constructor(maxNodes: number) {
        super(SIZE_LIMIT, maxNodes)
    }
}
