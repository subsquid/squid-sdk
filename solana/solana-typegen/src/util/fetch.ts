import {createLogger} from '@subsquid/logger'
import {HttpClient} from '@subsquid/http-client'
import zlib from 'zlib'
import {address, binary, struct, Src} from '@subsquid/borsh'
import {RpcClient} from '@subsquid/rpc-client'
import {Address, createAddressWithSeed, getProgramDerivedAddress} from '@solana/addresses'

const http = new HttpClient({
    log: createLogger('sqd:solana-typegen:fetch'),
    retryAttempts: 3,
})

export function GET<T = any>(url: string): Promise<T> {
    return http.get(url)
}

const idlLayout = struct({
    authority: address,
    data: binary,
})

export async function fetchIdl(client: RpcClient, programAddress: Address): Promise<any> {
    let accountInfo = await client.call('getAccountInfo', [programAddress, {encoding: 'base64'}])

    if (accountInfo?.value?.executable) {
        const baseAddress = await getProgramDerivedAddress({programAddress, seeds: []}).then((r) => r[0])
        const address = await createAddressWithSeed({baseAddress, programAddress, seed: 'anchor:idl'})

        accountInfo = await client.call('getAccountInfo', [address, {encoding: 'base64'}])
    }

    if (accountInfo?.value == null) return undefined

    const src = new Src(new Uint8Array(Buffer.from(accountInfo.value.data[0], 'base64')))
    src.u64() // skip discriminator
    const {data} = idlLayout.decode(src)

    const raw = zlib.inflateSync(data).toString('utf-8')

    return JSON.parse(raw)
}
