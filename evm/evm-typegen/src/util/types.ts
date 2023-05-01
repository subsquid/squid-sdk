import assert from 'assert'
import type {ParamType} from 'ethers'


// taken from: https://github.com/ethers-io/ethers.js/blob/948f77050dae884fe88932fd88af75560aac9d78/packages/cli/src.ts/typescript.ts#L10
export function getType(param: ParamType): string {
    if (param.baseType === 'array') {
        assert(param.arrayChildren != null, 'Missing children for array type')
        return 'Array<' + getType(param.arrayChildren) + '>'
    }

    if (param.baseType === 'tuple') {
        assert(param.components != null, 'Missing components for tuple type')
        return getFullTupleType(param.components)
    }

    if (param.type === 'address' || param.type === 'string') {
        return 'string'
    }

    if (param.type === 'bool') {
        return 'boolean'
    }

    let match = param.type.match(/^(u?int)([0-9]+)$/)
    if (match) {
        return parseInt(match[2]) < 53 ? 'number' : 'bigint'
    }

    if (param.type.substring(0, 5) === 'bytes') {
        return 'string'
    }

    throw new Error('unknown type')
}


export function getFullTupleType(params: ReadonlyArray<ParamType>): string {
    let tuple = getTupleType(params)
    let struct = getStructType(params)
    if (struct == '{}') {
        return tuple
    } else {
        return `(${tuple} & ${struct})`
    }
}


export function getTupleType(params: ReadonlyArray<ParamType>): string {
    return '[' + params.map(p => {
        return p.name ? `${p.name}: ${getType(p)}` : `_: ${getType(p)}`
    }).join(', ') + ']'
}


// https://github.com/ethers-io/ethers.js/blob/278f84174409b470fa7992e1f8b5693e6e5d2dac/src.ts/abi/coders/tuple.ts#L36
export function getStructType(params: ReadonlyArray<ParamType>): string {
    let array: any = []
    let counts: Record<string, number> = {}
    for (let p of params) {
        if (p.name && array[p.name] == null) {
            counts[p.name] = (counts[p.name] || 0) + 1
        }
    }
    let fields = params.filter(p => counts[p.name] == 1)
    return '{' + fields.map(f => `${f.name}: ${getType(f)}`).join(', ') + '}'
}


export function getReturnType(outputs: ReadonlyArray<ParamType>) {
    return outputs.length == 1 ? getType(outputs[0]) : getFullTupleType(outputs)
}
