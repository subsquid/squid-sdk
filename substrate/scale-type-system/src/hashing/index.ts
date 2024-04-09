import {ScaleType, Ti} from '../type-checker'
import {sha} from './dcg-hasher'
import {computeHash, TypeHasher} from './type-hasher'


const HASHERS = new WeakMap<ScaleType[], TypeHasher>()


function getTypeHasher(types: ScaleType[]): TypeHasher {
    let hasher = HASHERS.get(types)
    if (hasher == null) {
        hasher = new TypeHasher(types)
        HASHERS.set(types, hasher)
    }
    return hasher
}


/**
 * Get a strong hash of substrate type, which can be used for equality derivation
 */
export function getTypeHash(types: ScaleType[], type: Ti | ScaleType): string {
    let hasher = getTypeHasher(types)
    if (typeof type == 'number') {
        return hasher.getHash(type)
    } else {
        return sha(computeHash(types, hasher, type))
    }
}
