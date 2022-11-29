import {readLines} from "@subsquid/util-internal-read-lines"
import * as fs from "fs"
import {extname} from "path"
import SPEC_VERSION_SCHEMA from "./specVersion.schema.json"
import {makeValidator, printValidationErrors} from "./util"


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


const validateSpecVersion = makeValidator<SpecVersion>(SPEC_VERSION_SCHEMA as any)
const validateSpecVersionArray = makeValidator<SpecVersion[]>({
    type: 'array',
    items: SPEC_VERSION_SCHEMA as any
})


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
        let json: unknown
        try {
            json = JSON.parse(line)
        } catch(e: any) {
            throw new SpecFileError(`Failed to parse record #${result.length + 1} of ${file}: ${e.message}`)
        }
        if (validateSpecVersion(json)) {
            result.push(json)
        } else {
            throw new SpecFileError(
                `Failed to extract chain version from record #${result.length} of ${file}:\n  ${printValidationErrors(validateSpecVersion, '\n  ')}`
            )
        }
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
    let json: unknown
    try {
        json = JSON.parse(content)
    } catch(e: any) {
        throw new SpecFileError(`Failed to parse ${file}: ${e}`)
    }
    if (validateSpecVersionArray(json)) {
        return json
    } else {
        throw new SpecFileError(`Failed to extract chain versions from ${file}:\n  ${printValidationErrors(validateSpecVersionArray, '\n  ')}`)
    }
}


export class SpecFileError extends Error {}
