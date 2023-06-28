import {Src} from "@subsquid/scale-codec"
import * as parsing from './types'


const BABE_ENGINE = Buffer.from('BABE')
const AURA_ENGINE = Buffer.from('aura')
const POW_ENGINE = Buffer.from('pow_')


type Rec = [engine: Uint8Array, data: Uint8Array]
type Account = Uint8Array


export function getBlockValidator(digestLog: parsing.DigestItem[], validators: Account[]): Account | undefined {
    let preRuntime: Rec | undefined
    let consensus: Rec | undefined
    let seal: Rec | undefined

    for (let item of digestLog) {
        switch(item.__kind) {
            case 'PreRuntime':
                preRuntime = item.value
                break
            case 'Consensus':
                consensus = item.value
                break
            case 'Seal':
                seal = item.value
                break
        }
    }

    return preRuntime && fromRecord(preRuntime, validators)
        || consensus && fromRecord(consensus, validators)
        || seal && fromRecord(seal, validators)
}


function fromRecord(rec: Rec, validators: Account[]): Account | undefined {
    let [engine, data] = rec
    if (BABE_ENGINE.equals(engine)) {
        let src = new Src(data)
        src.u8()
        let idx = src.u32()
        return validators[idx]
    } else if (AURA_ENGINE.equals(engine)) {
        let src = new Src(data)
        let slot = src.u64()
        if (validators.length) {
            let idx = Number(slot % BigInt(validators.length))
            return validators[idx]
        }
    } else if (POW_ENGINE.equals(engine) && data.length == 20) {
        return data
    }
}
