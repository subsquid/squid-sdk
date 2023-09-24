import {Bytes} from '@subsquid/substrate-runtime'
import {IAddress, IOrigin} from '../types/system'


export function addressOrigin(address: IAddress): IOrigin| undefined {
    if (typeof address == 'string') {
        return signedOrigin(address)
    }
    switch(address.__kind) {
        case 'Id':
        case 'AccountId': // LookupSource as an address on early kusama blocks
            return signedOrigin(address.value)
    }
}


export function signedOrigin(account: Bytes): IOrigin {
    return {
        __kind: 'system',
        value: {
            __kind: 'Signed',
            value: account
        }
    }
}


export function rootOrigin(): IOrigin {
    return {
        __kind: 'system',
        value: {
            __kind: 'Root'
        }
    }
}


export function noneOrigin(): IOrigin {
    return {
        __kind: 'system',
        value: {
            __kind: 'None'
        }
    }
}
