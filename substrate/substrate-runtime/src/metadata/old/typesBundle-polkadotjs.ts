import assert from 'assert'
import {OldSpecsBundle, OldTypeExp, OldTypesAlias, OldTypesBundle, OldTypesWithSpecVersionRange} from './types'


export interface PolkadotjsTypesBundle {
    chain?: {}
    spec: {
        [specName: string]: {
            types: {
                types: Record<string, any>
                minmax: [
                    min: number | undefined | null,
                    max: number | undefined | null
                ]
            }[]
            alias: OldTypesAlias
            signedExtensions: Record<string, {extrinsic: Record<string, string>}>
        }
    }
}


export function convertPolkadotjsTypesBundle(typesBundle: PolkadotjsTypesBundle): OldSpecsBundle {
    assert(typesBundle.chain == null, 'Incompatible polkadotjs bundle: per-chain types are not supported')

    let res: OldSpecsBundle = {}

    for (let specName in typesBundle.spec) {
        let spec = typesBundle.spec[specName]

        let versions: OldTypesWithSpecVersionRange[] = spec.types.map(v => {
            for (let typeName in v.types) {
                let type = v.types[typeName]
                assert(type._fallback == null, 'Incompatible polkadotjs types bundle: fallback types are not supported')
                assert(type._alias == null, 'Incompatible polkadotjs types bundle: field aliases are not supported')
            }
            return {
                minmax: [
                    v.minmax[0] || null,
                    v.minmax[1] || null
                ],
                types: v.types
            }
        })

        let signedExtensions: Record<string, OldTypeExp> = {}
        for (let extensionName in spec.signedExtensions) {
            let extension = spec.signedExtensions[extensionName]
            let fields = Object.values(extension.extrinsic)
            assert(fields.length < 2, 'Incompatible polkadotjs types bundle: multi-field signed extensions are not supported')
            signedExtensions[extensionName] = fields[0] || 'Null'
        }

        res[specName] = {
            types: {},
            typesAlias: spec.alias,
            signedExtensions,
            versions
        }
    }

    return res
}


export function eliminatePolkadotjsTypesBundle(bundle: OldTypesBundle | OldSpecsBundle | PolkadotjsTypesBundle): OldTypesBundle | OldSpecsBundle {
    let b = bundle as any
    if (b.types) return bundle as OldTypesBundle
    if (b.spec || b.chain) return convertPolkadotjsTypesBundle(bundle as PolkadotjsTypesBundle)
    return bundle as OldSpecsBundle
}
