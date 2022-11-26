import assert from "assert"
import * as marshal from "./marshal"

export class HappyPoor {
    public readonly isTypeOf = 'HappyPoor'
    private _isMale!: boolean | undefined | null

    constructor(props?: Partial<Omit<HappyPoor, 'toJSON'>>, json?: any) {
        Object.assign(this, props)
        if (json != null) {
            this._isMale = json.isMale == null ? undefined : marshal.boolean.fromJSON(json.isMale)
        }
    }

    get isMale(): boolean | undefined | null {
        return this._isMale
    }

    set isMale(value: boolean | undefined | null) {
        this._isMale = value
    }

    toJSON(): object {
        return {
            isTypeOf: this.isTypeOf,
            isMale: this.isMale,
        }
    }
}
