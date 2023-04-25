import fs from 'fs'
import {OldSpecsBundle, OldTypesBundle} from './old/types'
import {eliminatePolkadotjsTypesBundle} from './old/typesBundle-polkadotjs'


export function getOldTypesBundle(chain: string): OldTypesBundle | undefined {
    switch(chain) {
        case 'acala':
        case 'karura':
            return require('./old/definitions/acala').bundle
        case 'aleph-node':
            return require('./old/definitions/aleph-node').bundle
        case 'altair':
            return require('./old/definitions/altair').bundle
        case 'astar':
            return require('./old/definitions/astar').bundle
        case 'bifrost':
            return require('./old/definitions/bifrost').bundle
        case 'basilisk':
            return require('./old/definitions/basilisk').bundle
        case 'calamari':
            return require('./old/definitions/calamari').bundle
        case 'clover':
            return require('./old/definitions/clover').bundle
        case 'crust':
            return require('./old/definitions/crust').bundle
        case 'darwinia':
        case 'Darwinia': // real spec name
            return require('./old/definitions/darwinia').bundle
        case 'hydradx':
        case 'hydra-dx': // real spec name
            return require('./old/definitions/hydradx').bundle
        case 'khala':
            return require('./old/definitions/khala').bundle
        case 'kilt':
        case 'kilt-spiritnet':
        case 'kilt-spiritnet-develop':
        case 'kilt-peregrine':
        case 'kilt-peregrine-stagenet':
        case 'kilt-peregrine-develop':
        case 'kilt-mashnet':
            return require('./old/definitions/kilt').bundle
        case 'kintsugi':
        case 'kintsugi-parachain': // real spec name
            return require('./old/definitions/kintsugi').bundle
        case 'kusama':
            return require('./old/definitions/kusama').bundle
        case 'moonbeam':
        case 'moonbase':
        case 'moonriver':
            return require('./old/definitions/moonbeam').bundle
        case 'manta':
            return require('./old/definitions/manta').bundle
        case 'parallel':
        case 'heiko':
            return require('./old/definitions/parallel').bundle
        case 'pioneer':
            return require('./old/definitions/pioneer').bundle
        case 'polkadot':
            return require('./old/definitions/polkadot').bundle
        case 'shiden':
            return require('./old/definitions/shiden').bundle
        case 'shibuya':
            return require('./old/definitions/shibuya').bundle
        case 'shell':
            return require('./old/definitions/shell').bundle
        case 'sora-substrate':
            return require('./old/definitions/sora-substrate').bundle
        case 'statemint':
        case 'statemine':
            return require('./old/definitions/statemint').bundle
        case 'subsocial':
            return require('./old/definitions/subsocial').bundle
        case 'reef':
            return require('./old/definitions/reef').bundle
        case 'unique':
        case 'quartz':
            return require('./old/definitions/unique').bundle
        case 'zeitgeist':
            return require('./old/definitions/zeitgeist').bundle
        default:
            return undefined
    }
}


export function readOldTypesBundle(file: string): OldTypesBundle | OldSpecsBundle {
    let content = fs.readFileSync(file, 'utf-8')
    let bundle: any
    try {
        bundle = JSON.parse(content)
    } catch(e: any) {
        throw new OldTypesBundleError(`Failed to parse ${file}: ${e}`)
    }
    return eliminatePolkadotjsTypesBundle(bundle)
}


export class OldTypesBundleError extends Error {}
