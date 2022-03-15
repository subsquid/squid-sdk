import fs from "fs"
import {OldTypesBundle} from "./old/types"


export function getOldTypesBundle(chain: string): OldTypesBundle | undefined {
    switch(chain) {
        case 'altair':
            return require('./old/definitions/altair').bundle
        case 'bifrost':
            return require('./old/definitions/bifrost').bundle
        case 'khala':
            return require('./old/definitions/khala').bundle
        case 'kusama':
            return require('./old/definitions/kusama').bundle
        case 'moonbeam':
        case 'moonbase':
        case 'moonriver':
            return require('./old/definitions/moonsama').bundle
        case 'polkadot':
            return require('./old/definitions/polkadot').bundle
        case 'astar':
            return require('./old/definitions/astar').bundle
        case 'shiden':
            return require('./old/definitions/shiden').bundle
        case 'crust':
            return require('./old/definitions/crust').bundle
        case 'statemint':
        case 'statemine':
            return require('./old/definitions/statemint').bundle
        case 'subsocial':
            return require('./old/definitions/subsocial').bundle
        case 'kilt':
            return require('./old/definitions/kilt').bundle
        case 'hydradx':
            return require('./old/definitions/hydradx').bundle
        case 'pioneer':
            return require('./old/definitions/pioneer').bundle
        case 'parallel':
        case 'heiko':
            return require('./old/definitions/parallel').bundle
        case 'clover':
            return require('./old/definitions/clover').bundle
        case 'manta':
        case 'calamari':
            return require('./old/definitions/manta').bundle
        case 'basilisk':
            return require('./old/definitions/basilisk').bundle
        case 'unique':
        case 'quartz':
            return require('./old/definitions/unique').bundle
        case 'darwinia':
            return require('./old/definitions/darwinia').bundle
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
