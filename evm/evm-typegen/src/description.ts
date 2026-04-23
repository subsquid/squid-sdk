import { keccak256 } from '@subsquid/evm-abi'
import type { Abi, AbiEvent, AbiFunction, AbiParameter } from 'abitype'

/**
 * Clean structured description of an EVM ABI - the single input to the code
 * generator. It precomputes signatures, topics, selectors, overload-aware
 * identifier names, TypeScript alias names, and a normalized parameter tree
 * over which the printer recurses.
 */
export interface Contract {
    events: Event[]
    functions: Function[]
}

export interface Event {
    name: string
    signature: string
    topic: string
    inputs: Field[]
    /** JS identifier used for the exported const and property access. */
    key: string
    /** Exported type alias name. */
    typeName: string
}

export type FunctionKind = 'fun' | 'viewFun'

export interface Function {
    name: string
    signature: string
    selector: string
    kind: FunctionKind
    inputs: Field[]
    outputs: Field[]
    key: string
    paramsTypeName: string
    returnTypeName: string
}

export interface Field {
    name: string
    type: Type
    indexed?: boolean
}

export type Type =
    | { kind: 'primitive'; name: string }
    | { kind: 'array'; item: Type }
    | { kind: 'fixedArray'; item: Type; size: number }
    | { kind: 'tuple'; fields: Field[] }

export function describe(abi: Abi): Contract {
    const rawEvents = abi.filter((x) => x.type === 'event') as AbiEvent[]
    const rawFunctions = abi.filter((x) => x.type === 'function') as AbiFunction[]

    // Overload index is computed across the concatenation of events and
    // functions sharing a name (matches existing evm-typegen behavior).
    const combined: readonly (AbiEvent | AbiFunction)[] = [...rawEvents, ...rawFunctions]
    const nameCounts: Record<string, number> = {}
    for (const item of combined) nameCounts[item.name] = (nameCounts[item.name] || 0) + 1
    const overloadIndex = (item: AbiEvent | AbiFunction): number =>
        combined.filter((x) => x.name === item.name).findIndex((x) => x === item)

    const events: Event[] = rawEvents.map((e) => {
        const overloaded = nameCounts[e.name] > 1
        const idx = overloadIndex(e)
        const signature = eventSignature(e)
        return {
            name: e.name,
            signature,
            topic: `0x${keccak256(signature).toString('hex')}`,
            inputs: e.inputs.map((p, i) => toField(p, i, true)),
            key: overloaded ? `${e.name}_${idx}` : e.name,
            typeName: overloaded
                ? `${capitalize(e.name)}EventArgs_${idx}`
                : `${capitalize(e.name)}EventArgs`,
        }
    })

    const functions: Function[] = rawFunctions.map((f) => {
        const overloaded = nameCounts[f.name] > 1
        const idx = overloadIndex(f)
        const signature = fnSignature(f)
        const kind: FunctionKind =
            f.stateMutability === 'view' || f.stateMutability === 'pure' ? 'viewFun' : 'fun'
        return {
            name: f.name,
            signature,
            selector: `0x${keccak256(signature).slice(0, 4).toString('hex')}`,
            kind,
            inputs: f.inputs.map((p, i) => toField(p, i, false)),
            outputs: (f.outputs ?? []).map((p, i) => toField(p, i, false)),
            key: overloaded ? `${f.name}_${idx}` : f.name,
            paramsTypeName: overloaded
                ? `${capitalize(f.name)}Params_${idx}`
                : `${capitalize(f.name)}Params`,
            returnTypeName: overloaded
                ? `${capitalize(f.name)}Return_${idx}`
                : `${capitalize(f.name)}Return`,
        }
    })

    return { events, functions }
}

function toField(p: AbiParameter, index: number, isEventInput: boolean): Field {
    const field: Field = {
        name: p.name || `_${index}`,
        type: toType(p),
    }
    if (isEventInput && (p as any).indexed) field.indexed = true
    return field
}

function toType(p: AbiParameter): Type {
    if (/\[\d+\]$/.test(p.type)) {
        const m = p.type.match(/\[(\d+)\]$/)!
        const size = Number(m[1])
        return { kind: 'fixedArray', size, item: toType(stripOuterArray(p)) }
    }
    if (p.type.endsWith('[]')) {
        return { kind: 'array', item: toType(stripOuterArray(p)) }
    }
    if (p.type.startsWith('tuple')) {
        const components = ((p as any).components || []) as AbiParameter[]
        return {
            kind: 'tuple',
            fields: components.map((c, i) => toField(c, i, false)),
        }
    }
    return { kind: 'primitive', name: p.type }
}

function stripOuterArray(p: AbiParameter): AbiParameter {
    return { ...(p as any), type: p.type.replace(/\[\d*\]$/, '') } as AbiParameter
}

export function canonicalType(p: AbiParameter): string {
    if (!p.type.startsWith('tuple')) return p.type
    const arrayBrackets = p.type.slice(5)
    const components = (p as any).components as AbiParameter[]
    return `(${components.map(canonicalType).join(',')})${arrayBrackets}`
}

function eventSignature(e: AbiEvent): string {
    return `${e.name}(${e.inputs.map(canonicalType).join(',')})`
}

function fnSignature(f: AbiFunction): string {
    return `${f.name}(${f.inputs.map(canonicalType).join(',')})`
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1)
}
