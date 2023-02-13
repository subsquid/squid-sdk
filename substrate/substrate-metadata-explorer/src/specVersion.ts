import {isHex} from '@subsquid/util-internal-hex'
import {readLines} from '@subsquid/util-internal-read-lines'
import * as fs from 'fs'
import {extname} from 'path'


export interface SpecVersionRecord {
    specName: string
    specVersion: number
    /**
     * The height of the block where the given spec version was first introduced.
     */
    blockNumber: number
    /**
     * The hash of the block where the given spec version was first introduced.
     */
    blockHash: string
}


export interface SpecVersion extends SpecVersionRecord {
    /**
     * Chain metadata for this version of spec
     */
    metadata: string
}


function validateSpecVersion(rec: any): string | undefined {
    if (rec == null || Array.isArray(rec) || typeof rec != 'object') return 'record should be an object'

    function prop(name: string, type: 'hex' | 'nat' | 'string'): string | undefined {
        if (!(name in rec)) return `.${name} property is missing`
        let val = rec[name]
        switch(type) {
            case 'hex':
                if (isHex(val)) return
                return `.${name} property must be a hex string, like 0x123aa`
            case 'nat':
                if (Number.isInteger(val) && val >= 0) return
                return `.${name} property must be a natural number`
            case 'string':
                if (typeof val == 'string' && val.length > 0) return
                return `.${name} property must be a non-empty string`
        }
    }

    return prop('specName', 'string')
        || prop('specVersion', 'nat')
        || prop('blockNumber', 'nat')
        || prop('blockHash', 'hex')
        || prop('metadata', 'hex')
}


function validateSpecVersionArray(rec: any[]): string | undefined {
    if (!Array.isArray(rec)) return 'json value is not an array of spec versions'
    for (let i = 0; i < rec.length; i++) {
        let error = validateSpecVersion(rec[i])
        if (error) return `record at index ${i} is invalid: ${error}`
    }
}


export function readSpecVersions(file: string): SpecVersion[] {
    if (extname(file) === '.json') {
        return readJson(file)
    } else {
        return readJsonLines(file)
    }
}


function readJsonLines(file: string): SpecVersion[] {
    let result: SpecVersion[] = []
    for (let line of readLines(file)) {
        let json: any
        try {
            json = JSON.parse(line)
        } catch(e: any) {
            throw new SpecFileError(`Failed to parse record #${result.length + 1} of ${file}: ${e.message}`)
        }
        let error = validateSpecVersion(json)
        if (error) throw new SpecFileError(
            `Failed to extract chain version from record #${result.length + 1} of ${file}: ${error}`
        )
        result.push(json)
    }
    return result
}


function readJson(file: string): SpecVersion[] {
    let content: string
    try {
        content = fs.readFileSync(file, 'utf-8')
    } catch(e: any) {
        throw new SpecFileError(`Failed to read ${file}: ${e}`)
    }
    let json: any
    try {
        json = JSON.parse(content)
    } catch(e: any) {
        throw new SpecFileError(`Failed to parse ${file}: ${e}`)
    }
    let error = validateSpecVersionArray(json)
    if (error) throw new SpecFileError(
        `Failed to extract chain versions from ${file}: ${error}`
    )
    return json
}


export class SpecFileError extends Error {
    get name(): string {
        return 'SpecFileError'
    }
}
