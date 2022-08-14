import {readFileSync} from 'fs'
import {CreateType, getWasmMetadata, Metadata} from '@gear-js/api'
import {assertNotNull} from '@subsquid/substrate-processor'


let NFT_METADATA: undefined | Metadata


async function getNFTMetadata(): Promise<Metadata> {
    if (!NFT_METADATA) {
        let wasm = readFileSync('./nft.meta.wasm')
        NFT_METADATA = await getWasmMetadata(wasm)
    }
    return NFT_METADATA
}


export async function decodeNFTInput(payload: string): Promise<any> {
    let meta = await getNFTMetadata()
    let type = assertNotNull(meta['handle_input'])
    return CreateType.create(type, payload, meta).toJSON()
}
