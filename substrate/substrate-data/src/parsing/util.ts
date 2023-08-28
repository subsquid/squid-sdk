import {Bytes, DecodedCall, DecodedEvent, Runtime} from '@subsquid/substrate-runtime'
import {IAddress, IOrigin} from '../types/system'


export function unwrapArguments(
    call: DecodedCall | DecodedEvent,
    registry: Runtime['events' | 'calls']
): {
    name: string
    args: unknown
} {
    let name = call.__kind + "." + call.value.__kind
    let args: unknown
    let def = registry.get(name)
    if (def.fields[0]?.name != null) {
        let {__kind, ...props} = call.value
        args = props
    } else {
        args = (call.value as any).value
    }
    return {name, args}
}


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
