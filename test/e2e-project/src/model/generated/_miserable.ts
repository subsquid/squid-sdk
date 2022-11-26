import assert from "assert"
import * as marshal from "./marshal"

export class Miserable {
    public readonly isTypeOf = 'Miserable'
    private _hates!: string
    private _loves!: (string | undefined | null)[]

    constructor(props?: Partial<Omit<Miserable, 'toJSON'>>, json?: any) {
        Object.assign(this, props)
        if (json != null) {
            this._hates = marshal.string.fromJSON(json.hates)
            this._loves = marshal.fromList(json.loves, val => val == null ? undefined : marshal.string.fromJSON(val))
        }
    }

    get hates(): string {
        assert(this._hates != null, 'uninitialized access')
        return this._hates
    }

    set hates(value: string) {
        this._hates = value
    }

    get loves(): (string | undefined | null)[] {
        assert(this._loves != null, 'uninitialized access')
        return this._loves
    }

    set loves(value: (string | undefined | null)[]) {
        this._loves = value
    }

    toJSON(): object {
        return {
            isTypeOf: this.isTypeOf,
            hates: this.hates,
            loves: this.loves,
        }
    }
}
