import assert from 'assert'
import {AbiEventParameter, AbiParameter, parseAbiParameter} from "abitype";
import {hasDynamicChild} from "../decodeAbiParameters";

function parseArray(param: AbiParameter): { baseType: string, arrayChildren: AbiParameter } | undefined {
    let match = param.type.match(/^(.*)\[(\d*)]$/)
    if (match) {
        const baseType = match[1]
        if (baseType === 'tuple' && 'components' in param) {
            const arrayChildren = {
                type: 'tuple',
                components: param.components
            }
            return { baseType, arrayChildren }
        }
        const arrayChildren = parseAbiParameter(baseType)
        return { baseType, arrayChildren }
    }
    return undefined
}

// taken from: https://github.com/ethers-io/ethers.js/blob/948f77050dae884fe88932fd88af75560aac9d78/packages/cli/src.ts/typescript.ts#L10
export function getType(param: AbiParameter): string {
    try {
        const array = parseArray(param)
        if (array) {
            assert(array.arrayChildren != null, 'Missing children for array type')
            return 'Array<' + getType(array.arrayChildren) + '>'
        }
    } catch (e) {
        console.log(param)
        throw e;
    }

    if (param.type === 'tuple' && 'components' in param) {
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


export function getFullTupleType(params: readonly AbiParameter[]): string {
    return `[${params.map(p => `['${p.name}',${getType(p)}]`).join(',')}]`
}

export function getEventParamTypes(param: readonly AbiEventParameter[]): string {
    return getFullTupleType(param.map(p => p.indexed ? hasDynamicChild(p) ? {
        ...p,
        type: 'bytes32'
    } : p : p))
}

export function stringifyParams(inputs: readonly AbiParameter[]): string {
    return JSON.stringify(inputs.map(({internalType, ...rest}) => rest))
}

export function getTupleType(params: readonly AbiParameter[]): string {
    return '[' + params.map(p => {
        return p.name ? `${p.name}: ${getType(p)}` : `_: ${getType(p)}`
    }).join(', ') + ']'
}


// https://github.com/ethers-io/ethers.js/blob/278f84174409b470fa7992e1f8b5693e6e5d2dac/src.ts/abi/coders/tuple.ts#L36
export function getStructType(params: readonly AbiParameter[]): string {
    let array: any = []
    let counts: Record<string, number> = {}
    for (let p of params) {
        if (p.name && array[p.name] == null) {
            counts[p.name] = (counts[p.name] || 0) + 1
        }
    }
    let fields = params.filter(p => counts[p.name ?? ''] == 1)
    return '{' + fields.map(f => `${f.name}: ${getType(f)}`).join(', ') + '}'
}


export function getReturnType(outputs: readonly AbiParameter[]) {
    return outputs.length == 1 ? getType(outputs[0]) : getFullTupleType(outputs)
}
