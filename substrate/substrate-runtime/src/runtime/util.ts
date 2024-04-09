import assert from 'assert'
import {Bytes, QualifiedName} from './interfaces'


const qualifiedNames: Record<QualifiedName, [prefix: string, name: string]> = {}


export function parseQualifiedName(name: QualifiedName): [prefix: string, name: string] {
    let res = qualifiedNames[name]
    if (res) return res
    let parts = name.split('.')
    assert(parts.length == 2)
    return qualifiedNames[name] = parts as [string, string]
}
