import {ScaleType, Ti} from '../type-checker'
import {TypeHasher} from './type-hasher'


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
export function getTypeHash(types: ScaleType[], ti: Ti): string {
    return getTypeHasher(types).getHash(ti)
}
