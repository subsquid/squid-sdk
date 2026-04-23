import { address, string, struct, uint256 } from '@subsquid/evm-codec'
import { fun, viewFun } from '../abi.support.js'
import type { FunctionArguments, FunctionReturn } from '../abi.support.js'

// ownerOf(uint256)
export const ownerOf = viewFun('0x6352211e', struct({
    _tokenId: uint256,
}), address)
export type OwnerOfParams = FunctionArguments<typeof ownerOf>
export type OwnerOfReturn = FunctionReturn<typeof ownerOf>

// tokenURI(uint256)
export const tokenURI = viewFun('0xc87b56dd', struct({
    _tokenId: uint256,
}), string)
export type TokenURIParams = FunctionArguments<typeof tokenURI>
export type TokenURIReturn = FunctionReturn<typeof tokenURI>

// balanceOf(address)
export const balanceOf = fun('0x70a08231', struct({
    _owner: address,
}), uint256)
export type BalanceOfParams = FunctionArguments<typeof balanceOf>
export type BalanceOfReturn = FunctionReturn<typeof balanceOf>
