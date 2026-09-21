import {keccak256} from '@subsquid/evm-abi'
import type {Abi, AbiEvent, AbiFunction, AbiParameter} from 'abitype'

export interface ContractDef {
    events: EventDef[]
    functions: FunctionDef[]
}

export interface DocDef {
    notice?: string
    dev?: string
    params?: Record<string, string>
    returns?: Record<string, string>
}

/** NatSpec documentation extracted from a compilation artifact's userdoc/devdoc fields. */
export interface NatSpec {
    userdoc?: {
        methods?: Record<string, {notice?: string}>
        events?: Record<string, {notice?: string}>
    }
    devdoc?: {
        methods?: Record<string, {details?: string; params?: Record<string, string>; returns?: Record<string, string>}>
        events?: Record<string, {details?: string; params?: Record<string, string>}>
    }
}

export interface EventDef {
    name: string
    signature: string
    topic: string
    inputs: FieldDef[]
    key: string
    typeName: string
    docs?: DocDef
}

export interface FunctionDef {
    name: string
    signature: string
    selector: string
    inputs: FieldDef[]
    outputs: FieldDef[]
    key: string
    paramsTypeName: string
    returnTypeName: string
    docs?: DocDef
}

export interface FieldDef {
    name: string
    type: TypeDef
    indexed?: boolean
    doc?: string
}

export type TypeDef =
    | {kind: 'primitive'; name: string}
    | {kind: 'array'; item: TypeDef}
    | {kind: 'fixedArray'; item: TypeDef; size: number}
    | {kind: 'tuple'; fields: FieldDef[]}

export function describe(abi: Abi, natspec?: NatSpec): ContractDef {
    const rawEvents = abi.filter((x) => x.type === 'event') as AbiEvent[]
    const rawFunctions = abi.filter((x) => x.type === 'function') as AbiFunction[]

    const eventSuffix = overloadSuffixer(rawEvents)
    const functionSuffix = overloadSuffixer(rawFunctions)

    const events: EventDef[] = rawEvents.map((e) => {
        const signature = eventSignature(e)
        const docs = buildEventDocs(signature, natspec)
        const inputs = e.inputs.map((p, i) => toFieldDef(p, i, true))
        annotateParamDocs(inputs, docs?.params)
        return {
            name: e.name,
            signature,
            topic: `0x${keccak256(signature).toString('hex')}`,
            inputs,
            key: eventSuffix(e, e.name),
            typeName: eventSuffix(e, `${capitalize(e.name)}EventArgs`),
            docs,
        }
    })

    const functions: FunctionDef[] = rawFunctions.map((f) => {
        const signature = fnSignature(f)
        const docs = buildFunctionDocs(signature, natspec)
        const inputs = f.inputs.map((p, i) => toFieldDef(p, i, false))
        const outputs = (f.outputs ?? []).map((p, i) => toFieldDef(p, i, false))
        annotateParamDocs(inputs, docs?.params)
        annotateReturnDocs(outputs, docs?.returns)
        return {
            name: f.name,
            signature,
            selector: `0x${keccak256(signature).slice(0, 4).toString('hex')}`,
            inputs,
            outputs,
            key: functionSuffix(f, f.name),
            paramsTypeName: functionSuffix(f, `${capitalize(f.name)}Params`),
            returnTypeName: functionSuffix(f, `${capitalize(f.name)}Return`),
            docs,
        }
    })

    return {events, functions}
}

function buildEventDocs(signature: string, natspec: NatSpec | undefined): DocDef | undefined {
    const notice = natspec?.userdoc?.events?.[signature]?.notice
    const devEntry = natspec?.devdoc?.events?.[signature]
    if (!notice && !devEntry) return undefined
    return filterEmptyDoc({
        notice,
        dev: devEntry?.details,
        params: devEntry?.params,
    })
}

function buildFunctionDocs(signature: string, natspec: NatSpec | undefined): DocDef | undefined {
    const notice = natspec?.userdoc?.methods?.[signature]?.notice
    const devEntry = natspec?.devdoc?.methods?.[signature]
    if (!notice && !devEntry) return undefined
    return filterEmptyDoc({
        notice,
        dev: devEntry?.details,
        params: devEntry?.params,
        returns: devEntry?.returns,
    })
}

function filterEmptyDoc(doc: DocDef): DocDef | undefined {
    const hasContent =
        doc.notice != null ||
        doc.dev != null ||
        (doc.params != null && Object.keys(doc.params).length > 0) ||
        (doc.returns != null && Object.keys(doc.returns).length > 0)
    return hasContent ? doc : undefined
}

function annotateParamDocs(fields: FieldDef[], params: Record<string, string> | undefined): void {
    if (!params) return
    for (const field of fields) {
        const doc = params[field.name]
        if (doc) field.doc = doc
    }
}

function annotateReturnDocs(fields: FieldDef[], returns: Record<string, string> | undefined): void {
    if (!returns) return
    for (let i = 0; i < fields.length; i++) {
        const field = fields[i]
        const doc = returns[field.name] ?? returns[`_${i}`]
        if (doc) field.doc = doc
    }
}

function overloadSuffixer(items: readonly (AbiEvent | AbiFunction)[]) {
    const counts = new Map<string, number>()
    const indices = new Map<AbiEvent | AbiFunction, number>()
    for (const item of items) {
        const seen = counts.get(item.name) ?? 0
        indices.set(item, seen)
        counts.set(item.name, seen + 1)
    }
    return (item: AbiEvent | AbiFunction, base: string): string => {
        if ((counts.get(item.name) ?? 1) <= 1) return base
        const idx = indices.get(item)!
        return idx === 0 ? base : `${base}_${idx}`
    }
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
