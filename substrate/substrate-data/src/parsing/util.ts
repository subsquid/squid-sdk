import {HashAndHeight} from '@subsquid/substrate-raw-data'
import * as eac from '@subsquid/substrate-metadata/lib/events-and-calls'
import {assertNotNull} from '@subsquid/util-internal'
import * as parsing from '../interfaces/data-decoded'


export function formatId(block: HashAndHeight, ...address: number[]): string {
    let no = block.height.toString().padStart(10, '0')
    let hash = block.hash.startsWith('0x')
        ? block.hash.slice(2, 7)
        : block.hash.slice(0, 5)
    let id = `${no}-${hash}`
    for (let index of address) {
        id += '-' + index.toString().padStart(6, '0')
    }
    return id
}


export function omitKind<T extends {__kind: string}>(obj: T): Omit<T, "__kind"> {
    let {__kind, ...props} = obj
    return props
}


export function unwrapArguments(call: parsing.Call | parsing.Event, registry: eac.Registry): {name: string, args: any} {
    let name = call.__kind + "." + call.value.__kind
    let args: unknown
    let def = registry.get(name)
    if (def.fields[0]?.name != null) {
        args = omitKind(call.value)
    } else {
        args = call.value.value
    }
    return {name, args}
}


export function getExtrinsicTip(ex: parsing.Extrinsic): bigint | undefined {
    let payment = ex.signature?.signedExtensions.ChargeTransactionPayment
    switch(typeof payment) {
        case 'bigint':
        case 'number':
            return BigInt(payment)
        case 'object':
            switch(typeof payment?.tip) {
                case 'bigint':
                case 'number': // Nikau network
                    return BigInt(payment.tip)
            }
    }
}


export function getDispatchInfoFromExtrinsicSuccess(args: any): parsing.DispatchInfo {
    if (args.dispatchInfo) {
        return args.dispatchInfo
    } else {
        return args
    }
}


export function getDispatchInfoFromExtrinsicFailed(args: any): parsing.DispatchInfo {
    if (args.dispatchInfo) {
        return args.dispatchInfo
    } else {
        return assertNotNull(args[1])
    }
}


export function getExtrinsicFailedError(args: any): unknown {
    if (args.dispatchError) {
        return args.dispatchError
    } else {
        return assertNotNull(args[0])
    }
}


export function addressOrigin(address: any): parsing.SignedOrigin | undefined {
    if (address instanceof Uint8Array) {
        return signedOrigin(address)
    }
    switch(address.__kind) {
        case 'Id':
        case 'AccountId': // LookupSource as an address on early kusama blocks
            return signedOrigin(address.value)
    }
}


export function signedOrigin(account: Uint8Array): parsing.SignedOrigin {
    return {
        __kind: 'system',
        value: {
            __kind: 'Signed',
            value: account
        }
    }
}


export function rootOrigin(): parsing.RootOrigin {
    return {
        __kind: 'system',
        value: {
            __kind: 'Root'
        }
    }
}


export function noneOrigin(): parsing.NoneOrigin {
    return {
        __kind: 'system',
        value: {
            __kind: 'None'
        }
    }
}
