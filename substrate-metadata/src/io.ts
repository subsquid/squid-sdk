import fs from "fs"
import {OldTypesBundle} from "./old/types"


export function getOldTypesBundle(chain: string): OldTypesBundle | undefined {
    switch(chain) {
        case 'kusama':
            return require('./old/definitions/kusama').bundle
        case 'polkadot':
            return require('./old/definitions/polkadot').bundle
        default:
            return undefined
    }
}


export function readOldTypesBundle(file: string): OldTypesBundle {
    let content: string
    try {
        content = fs.readFileSync(file, 'utf-8')
    } catch(e: any) {
        throw new OldTypesBundleError(`Failed to read ${file}: ${e}`)
    }
    let json: any
    try {
        json = JSON.parse(content)
    } catch(e: any) {
        throw new OldTypesBundleError(`Failed to parse ${file}: ${e}`)
    }
    // TODO: verify structure
    return json
}


export class OldTypesBundleError extends Error {}
