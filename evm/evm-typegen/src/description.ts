import {keccak256} from '@subsquid/evm-abi'
import type {Abi, AbiEvent, AbiFunction, AbiParameter} from 'abitype'

export interface ContractDef {
    events: EventDef[]
    functions: FunctionDef[]
}

export interface EventDef {
    name: string
    signature: string
    topic: string
    inputs: FieldDef[]
    key: string
    typeName: string
}

export type FunctionKind = 'fun' | 'viewFun'

export interface FunctionDef {
    name: string
    signature: string
    selector: string
    kind: FunctionKind
    inputs: FieldDef[]
    outputs: FieldDef[]
    key: string
    paramsTypeName: string
    returnTypeName: string
}

export interface FieldDef {
    name: string
    type: TypeDef
    indexed?: boolean
}

export type TypeDef =
    | {kind: 'primitive'; name: string}
    | {kind: 'array'; item: TypeDef}
    | {kind: 'fixedArray'; item: TypeDef; size: number}
    | {kind: 'tuple'; fields: FieldDef[]}

export function describe(abi: Abi): ContractDef {
    const rawEvents = abi.filter((x) => x.type === 'event') as AbiEvent[]
    const rawFunctions = abi.filter((x) => x.type === 'function') as AbiFunction[]

    // Events and functions share a name-space for overload numbering.
    const all = [...rawEvents, ...rawFunctions]
    const suffix = overloadSuffixer(all)

    const events: EventDef[] = rawEvents.map((e) => {
        const signature = eventSignature(e)
        return {
            name: e.name,
            signature,
            topic: `0x${keccak256(signature).toString('hex')}`,
            inputs: e.inputs.map((p, i) => toFieldDef(p, i, true)),
            key: suffix(e, e.name),
            typeName: suffix(e, `${capitalize(e.name)}EventArgs`),
        }
    })

    const functions: FunctionDef[] = rawFunctions.map((f) => {
        const signature = fnSignature(f)
        const kind: FunctionKind = f.stateMutability === 'view' || f.stateMutability === 'pure' ? 'viewFun' : 'fun'
        return {
            name: f.name,
            signature,
            selector: `0x${keccak256(signature).slice(0, 4).toString('hex')}`,
            kind,
            inputs: f.inputs.map((p, i) => toFieldDef(p, i, false)),
            outputs: (f.outputs ?? []).map((p, i) => toFieldDef(p, i, false)),
            key: suffix(f, f.name),
            paramsTypeName: suffix(f, `${capitalize(f.name)}Params`),
            returnTypeName: suffix(f, `${capitalize(f.name)}Return`),
        }
    })

    return {events, functions}
}

function overloadSuffixer(items: readonly (AbiEvent | AbiFunction)[]) {
    const counts = new Map<string, number>()
    const indices = new Map<AbiEvent | AbiFunction, number>()
    for (const item of items) {
        const seen = counts.get(item.name) ?? 0
        indices.set(item, seen)
        counts.set(item.name, seen + 1)
    }
    return (item: AbiEvent | AbiFunction, base: string): string =>
        (counts.get(item.name) ?? 1) > 1 ? `${base}_${indices.get(item)}` : base
}

function toFieldDef(p: AbiParameter, index: number, isEventInput: boolean): FieldDef {
    const field: FieldDef = {
        name: p.name || `_${index}`,
        type: toTypeDef(p),
    }
    if (isEventInput && (p as any).indexed) field.indexed = true
    return field
}

function toTypeDef(p: AbiParameter): TypeDef {
    const fixed = p.type.match(/\[(\d+)\]$/)
    if (fixed) {
        return {kind: 'fixedArray', size: Number(fixed[1]), item: toTypeDef(stripOuterArray(p))}
    }
    if (p.type.endsWith('[]')) {
        return {kind: 'array', item: toTypeDef(stripOuterArray(p))}
    }
    if (p.type.startsWith('tuple')) {
        const components = ((p as any).components || []) as AbiParameter[]
        return {
            kind: 'tuple',
            fields: components.map((c, i) => toFieldDef(c, i, false)),
        }
    }
    return {kind: 'primitive', name: p.type}
}

function stripOuterArray(p: AbiParameter): AbiParameter {
    return {...(p as any), type: p.type.replace(/\[\d*\]$/, '')} as AbiParameter
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
