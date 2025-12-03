import {bytes, externalEnum, GetType, openEnum, union, unit} from '@subsquid/substrate-runtime/lib/sts'


export const SystemOrigin = externalEnum({
    Signed: bytes(),
    Root: unit(),
    None: unit(),
    Authorized: unit()
})


export const Origin = externalEnum({
    system: SystemOrigin
})


export type IOrigin = GetType<typeof Origin>


export const Address = union(
    bytes(),
    openEnum({
        Id: bytes(),
        AccountId: bytes()
    })
)


export type IAddress = GetType<typeof Address>
