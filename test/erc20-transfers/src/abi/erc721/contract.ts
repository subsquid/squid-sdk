import { ContractBase } from '../abi.support.js'
import { ownerOf, tokenURI } from './functions.js'
import type { OwnerOfParams, TokenURIParams } from './functions.js'

export class Contract extends ContractBase {
    ownerOf(_tokenId: OwnerOfParams["_tokenId"]) {
        return this.eth_call(ownerOf, {_tokenId})
    }

    tokenURI(_tokenId: TokenURIParams["_tokenId"]) {
        return this.eth_call(tokenURI, {_tokenId})
    }
}
