import {assertNotNull} from '@subsquid/util-internal'
import {types as metadataDefinitions} from './definitions/metadata'
import {substrateBundle} from './definitions/substrate'
import type {OldSpecsBundle, OldTypes, OldTypesBundle, SpecVersionRange} from './types'


export function getTypesFromBundle(bundle: OldTypesBundle, specVersion: number): OldTypes
export function getTypesFromBundle(bundleOrSpecs: OldTypesBundle | OldSpecsBundle, specVersion: number, specName: string): OldTypes
export function getTypesFromBundle(bundleOrSpecs: OldTypesBundle | OldSpecsBundle, specVersion: number, specName?: string): OldTypes {
    let bundle: OldTypesBundle
    if (bundleOrSpecs.types == null) {
        let bundles = bundleOrSpecs as OldSpecsBundle
        bundle = assertNotNull(
            bundles[assertNotNull(specName)],
            `Missing typesBundle for spec ${specName}@${specVersion}`
        )
    } else {
        bundle = bundleOrSpecs as OldTypesBundle
    }

    let types: OldTypes = {
        types: {
            ...metadataDefinitions as any,
            ...substrateBundle.types,
            ...bundle.types
        },
        typesAlias: {
            ...substrateBundle.typesAlias,
            ...bundle.typesAlias
        },
        signedExtensions: {
            ...substrateBundle.signedExtensions,
            ...bundle.signedExtensions
        }
    }

    if (!bundle.versions?.length) return types

    for (let i = 0; i < bundle.versions.length; i++) {
        let override = bundle.versions[i]
        if (isWithinRange(override.minmax, specVersion)) {
            Object.assign(types.types, override.types)
            Object.assign(types.typesAlias!, override.typesAlias)
            Object.assign(types.signedExtensions!, override.signedExtensions)
        }
    }

    return types
}


function isWithinRange(range: SpecVersionRange, version: number): boolean {
    let beg = range[0] ?? 0
    let end = range[1] ?? Infinity
    return beg <= version && version <= end
}


