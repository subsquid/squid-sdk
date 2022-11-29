import type {ParamType} from '@ethersproject/abi'


// taken from: https://github.com/ethers-io/ethers.js/blob/948f77050dae884fe88932fd88af75560aac9d78/packages/cli/src.ts/typescript.ts#L10
export function getType(param: ParamType): string {
    if (param.baseType === 'array') {
        return 'Array<' + getType(param.arrayChildren) + '>'
    }

    if (param.baseType === 'tuple') {
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
        return parseInt(match[2]) < 53 ? 'number' : 'ethers.BigNumber'
    }

    if (param.type.substring(0, 5) === 'bytes') {
        return 'string'
    }

    throw new Error('unknown type')
}


export function getFullTupleType(params: ParamType[]): string {
    let tuple = getTupleType(params)
    let struct = getStructType(params)
    if (struct == '{}') {
        return tuple
    } else {
        return `(${tuple} & ${struct})`
    }
}


export function getTupleType(params: ParamType[]): string {
    return '[' + params.map(p => {
        return p.name ? `${p.name}: ${getType(p)}` : getType(p)
    }).join(', ') + ']'
}


// https://github.com/ethers-io/ethers.js/blob/948f77050dae884fe88932fd88af75560aac9d78/packages/abi/src.ts/coders/tuple.ts#L29
export function getStructType(params: ParamType[]): string {
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


export function getReturnType(outputs: ParamType[]) {
    return outputs.length == 1 ? getType(outputs[0]) : getFullTupleType(outputs)
}
