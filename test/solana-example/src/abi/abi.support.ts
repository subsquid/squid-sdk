import {Codec, GetCodecType, Src} from '@subsquid/borsh'
import {getInstructionData} from '@subsquid/solana-stream'
import assert from 'assert'


export type Bytes = string
export type Base58Bytes = string


export function instruction<
    D extends Discriminator,
    A extends Record<string, number>,
    DataCodec extends Codec<any>
>(
    d: D,
    accounts: A,
    data: DataCodec
): DeriveInstruction<D, A, DataCodec> {
    let ins = new Ins(accounts, data)
    Object.assign(ins, d)
    return ins as any
}


type DeriveInstruction<D, A, DataCodec> = Simplify<
    RemoveUndefined<D> &
    Ins<
        {[K in keyof A]: Base58Bytes},
        GetCodecType<DataCodec>
    >
>


export type Simplify<T> = {
    [K in keyof T]: T[K]
} & {}


type RemoveUndefined<T> = {
    [K in keyof T as undefined extends T[K] ? never : K]: T[K]
}


class Ins<A, D> {
    constructor(
        private accounts: {[K in keyof A]: number},
        private data: Codec<D>
    ) {}

    accountSelection(accounts: {[K in keyof A]?: Base58Bytes[]}): AccountSelection {
        let selection: any = {}
        for (let key in accounts) {
            let idx = this.accounts[key]
            assert(idx < 10)
            selection['a'+idx] = accounts[key]
        }
        return selection
    }

    decode(ins: {
        accounts: Base58Bytes[],
        data: Bytes
    }): DecodedInstruction<A, D> {
        return {
            accounts: this.decodeAccounts(ins.accounts),
            data: this.decodeData(getInstructionData(ins))
        }
    }

    decodeAccounts(accounts: Base58Bytes[]): A {
        let result: any = {}
        for (let key in this.accounts) {
            result[key] = accounts[this.accounts[key]]
        }
        return result
    }

    decodeData(data: Uint8Array): D {
        let src = new Src(data)
        this.assertDiscriminator(src)
        return this.data.decode(src)
    }

    private _assertDiscriminator?: (src: Src) => void

    private assertDiscriminator(src: Src): void {
        if (this._assertDiscriminator == null) {
            this._assertDiscriminator = this.createDiscriminatorAssertion()
        }
        this._assertDiscriminator(src)
    }

    private createDiscriminatorAssertion(): (src: Src) => void {
        let self: Discriminator = this as any
        if (self.d8 != null) {
            let d = new Src(decodeHex(self.d8)).u64()
            return src => {
                assert(d === src.u64())
            }
        } else if (self.d4 != null) {
            let d = new Src(decodeHex(self.d4)).u32()
            return src => {
                assert(d === src.u32())
            }
        } else if (self.d2 != null) {
            let d = new Src(decodeHex(self.d2)).u16()
            return src => {
                assert(d === src.u16())
            }
        } else {
            let d = new Src(decodeHex(self.d1)).u8()
            return src => {
                assert(d === src.u8())
            }
        }
    }
}


function decodeHex(bytes: Bytes): Uint8Array {
    return Buffer.from(bytes.slice(2), 'hex')
}


export interface DecodedInstruction<A, D> {
    accounts: A
    data: D
}


export type Discriminator = D1 | D2 | D4 | D8


interface D1 {
    d1: Bytes
    d2?: undefined
    d4?: undefined
    d8?: undefined
}


interface D2 {
    d1?: undefined
    d2: Bytes
    d4?: undefined
    d8?: undefined
}


interface D4 {
    d1?: undefined
    d2?: undefined
    d4: Bytes
    d8?: undefined
}


interface D8 {
    d1?: undefined
    d2?: undefined
    d4?: undefined
    d8: Bytes
}


export interface AccountSelection {
    a0?: Base58Bytes[]
    a1?: Base58Bytes[]
    a2?: Base58Bytes[]
    a3?: Base58Bytes[]
    a4?: Base58Bytes[]
    a5?: Base58Bytes[]
    a6?: Base58Bytes[]
    a7?: Base58Bytes[]
    a8?: Base58Bytes[]
    a9?: Base58Bytes[]
}
