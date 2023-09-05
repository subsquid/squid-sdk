import {Src} from '@subsquid/scale-codec'
import {Bytes} from '@subsquid/substrate-runtime'
import {toHex} from '@subsquid/util-internal-hex'
import {IConsensusMessage, IDigestItem} from './types'


const BABE_ENGINE = toHex(Buffer.from('BABE'))
const AURA_ENGINE = toHex(Buffer.from('aura'))
const POW_ENGINE = toHex(Buffer.from('pow_'))


export type AccountId = Bytes


export function getBlockValidator(digestLog: IDigestItem[], validators: AccountId[]): AccountId | undefined {
    let preRuntime: IConsensusMessage | undefined
    let consensus: IConsensusMessage | undefined
    let seal: IConsensusMessage | undefined

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

    return preRuntime && fromMessage(preRuntime, validators)
        || consensus && fromMessage(consensus, validators)
        || seal && fromMessage(seal, validators)
}


function fromMessage(msg: IConsensusMessage, validators: AccountId[]): AccountId | undefined {
    let [engine, data] = msg
    switch(engine) {
        case BABE_ENGINE: {
            let src = new Src(data)
            src.u8()
            let idx = src.u32()
            return validators[idx]
        }
        case AURA_ENGINE: {
            let src = new Src(data)
            let slot = src.u64()
            if (validators.length) {
                let idx = Number(slot % BigInt(validators.length))
                return validators[idx]
            }
            break
        }
        case POW_ENGINE: {
            if (data.length == 20 * 2 + 2) return data
        }
    }
}
