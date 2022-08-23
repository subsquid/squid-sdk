import assert from 'assert'


export class Limit {
    private err?: Error

    constructor(private name: string, private value: number) {
        assert(this.value > 0)
    }

    get left(): number {
        return this.value
    }

    check(cb: (left: number) => number): void {
        if (this.err) throw this.err
        let left = this.value - cb(this.value)
        if (left < 0) {
            this.value = 0
            this.err = new Error(`${this.name} limit exceeded`)
            throw this.err
        } else {
            this.value = left
        }
    }
}


export class ResponseSizeLimit extends Limit {
    constructor(maxNodes: number) {
        super('requested data size', maxNodes)
    }
}
