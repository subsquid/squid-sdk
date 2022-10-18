import assert from 'assert'
import * as ethers from 'ethers'
import {EvmLog, EvmTransaction, Block, ChainContext, BlockContext, Chain, Result, rawMulticallAbi} from './support'

export const rawAbi = [{"type":"constructor","payable":false,"inputs":[{"type":"address","name":"_factory"},{"type":"address","name":"_WETH9"},{"type":"address","name":"_tokenDescriptor_"}]},{"type":"event","anonymous":false,"name":"Approval","inputs":[{"type":"address","name":"owner","indexed":true},{"type":"address","name":"approved","indexed":true},{"type":"uint256","name":"tokenId","indexed":true}]},{"type":"event","anonymous":false,"name":"ApprovalForAll","inputs":[{"type":"address","name":"owner","indexed":true},{"type":"address","name":"operator","indexed":true},{"type":"bool","name":"approved","indexed":false}]},{"type":"event","anonymous":false,"name":"Collect","inputs":[{"type":"uint256","name":"tokenId","indexed":true},{"type":"address","name":"recipient","indexed":false},{"type":"uint256","name":"amount0","indexed":false},{"type":"uint256","name":"amount1","indexed":false}]},{"type":"event","anonymous":false,"name":"DecreaseLiquidity","inputs":[{"type":"uint256","name":"tokenId","indexed":true},{"type":"uint128","name":"liquidity","indexed":false},{"type":"uint256","name":"amount0","indexed":false},{"type":"uint256","name":"amount1","indexed":false}]},{"type":"event","anonymous":false,"name":"IncreaseLiquidity","inputs":[{"type":"uint256","name":"tokenId","indexed":true},{"type":"uint128","name":"liquidity","indexed":false},{"type":"uint256","name":"amount0","indexed":false},{"type":"uint256","name":"amount1","indexed":false}]},{"type":"event","anonymous":false,"name":"Transfer","inputs":[{"type":"address","name":"from","indexed":true},{"type":"address","name":"to","indexed":true},{"type":"uint256","name":"tokenId","indexed":true}]},{"type":"function","name":"DOMAIN_SEPARATOR","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"bytes32"}]},{"type":"function","name":"PERMIT_TYPEHASH","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"bytes32"}]},{"type":"function","name":"WETH9","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"address"}]},{"type":"function","name":"approve","constant":false,"payable":false,"inputs":[{"type":"address","name":"to"},{"type":"uint256","name":"tokenId"}],"outputs":[]},{"type":"function","name":"balanceOf","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"address","name":"owner"}],"outputs":[{"type":"uint256"}]},{"type":"function","name":"baseURI","constant":true,"stateMutability":"pure","payable":false,"inputs":[],"outputs":[{"type":"string"}]},{"type":"function","name":"burn","constant":false,"stateMutability":"payable","payable":true,"inputs":[{"type":"uint256","name":"tokenId"}],"outputs":[]},{"type":"function","name":"collect","constant":false,"stateMutability":"payable","payable":true,"inputs":[{"type":"uint256","name":"tokenId"},{"type":"address","name":"recipient"},{"type":"uint128","name":"amount0Max"},{"type":"uint128","name":"amount1Max"}],"outputs":[{"type":"uint256","name":"amount0"},{"type":"uint256","name":"amount1"}]},{"type":"function","name":"createAndInitializePoolIfNecessary","constant":false,"stateMutability":"payable","payable":true,"inputs":[{"type":"address","name":"tokenA"},{"type":"address","name":"tokenB"},{"type":"uint24","name":"fee"},{"type":"uint160","name":"sqrtPriceX96"}],"outputs":[{"type":"address","name":"pool"}]},{"type":"function","name":"decreaseLiquidity","constant":false,"stateMutability":"payable","payable":true,"inputs":[{"type":"uint256","name":"tokenId"},{"type":"uint128","name":"liquidity"},{"type":"uint256","name":"amount0Min"},{"type":"uint256","name":"amount1Min"},{"type":"uint256","name":"deadline"}],"outputs":[{"type":"uint256","name":"amount0"},{"type":"uint256","name":"amount1"}]},{"type":"function","name":"factory","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"address"}]},{"type":"function","name":"getApproved","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"uint256","name":"tokenId"}],"outputs":[{"type":"address"}]},{"type":"function","name":"increaseLiquidity","constant":false,"stateMutability":"payable","payable":true,"inputs":[{"type":"uint256","name":"tokenId"},{"type":"uint256","name":"amount0Desired"},{"type":"uint256","name":"amount1Desired"},{"type":"uint256","name":"amount0Min"},{"type":"uint256","name":"amount1Min"},{"type":"uint256","name":"deadline"}],"outputs":[{"type":"uint128","name":"liquidity"},{"type":"uint256","name":"amount0"},{"type":"uint256","name":"amount1"}]},{"type":"function","name":"isApprovedForAll","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"address","name":"owner"},{"type":"address","name":"operator"}],"outputs":[{"type":"bool"}]},{"type":"function","name":"mint","constant":false,"stateMutability":"payable","payable":true,"inputs":[{"type":"tuple","name":"params","components":[{"type":"address","name":"token0"},{"type":"address","name":"token1"},{"type":"uint24","name":"fee"},{"type":"int24","name":"tickLower"},{"type":"int24","name":"tickUpper"},{"type":"uint256","name":"amount0Desired"},{"type":"uint256","name":"amount1Desired"},{"type":"uint256","name":"amount0Min"},{"type":"uint256","name":"amount1Min"},{"type":"address","name":"recipient"},{"type":"uint256","name":"deadline"}]}],"outputs":[{"type":"uint256","name":"tokenId"},{"type":"uint128","name":"liquidity"},{"type":"uint256","name":"amount0"},{"type":"uint256","name":"amount1"}]},{"type":"function","name":"multicall","constant":false,"stateMutability":"payable","payable":true,"inputs":[{"type":"bytes[]","name":"data"}],"outputs":[{"type":"bytes[]","name":"results"}]},{"type":"function","name":"name","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"string"}]},{"type":"function","name":"ownerOf","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"uint256","name":"tokenId"}],"outputs":[{"type":"address"}]},{"type":"function","name":"permit","constant":false,"stateMutability":"payable","payable":true,"inputs":[{"type":"address","name":"spender"},{"type":"uint256","name":"tokenId"},{"type":"uint256","name":"deadline"},{"type":"uint8","name":"v"},{"type":"bytes32","name":"r"},{"type":"bytes32","name":"s"}],"outputs":[]},{"type":"function","name":"positions","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"uint256","name":"tokenId"}],"outputs":[{"type":"uint96","name":"nonce"},{"type":"address","name":"operator"},{"type":"address","name":"token0"},{"type":"address","name":"token1"},{"type":"uint24","name":"fee"},{"type":"int24","name":"tickLower"},{"type":"int24","name":"tickUpper"},{"type":"uint128","name":"liquidity"},{"type":"uint256","name":"feeGrowthInside0LastX128"},{"type":"uint256","name":"feeGrowthInside1LastX128"},{"type":"uint128","name":"tokensOwed0"},{"type":"uint128","name":"tokensOwed1"}]},{"type":"function","name":"safeTransferFrom","constant":false,"payable":false,"inputs":[{"type":"address","name":"from"},{"type":"address","name":"to"},{"type":"uint256","name":"tokenId"}],"outputs":[]},{"type":"function","name":"safeTransferFrom","constant":false,"payable":false,"inputs":[{"type":"address","name":"from"},{"type":"address","name":"to"},{"type":"uint256","name":"tokenId"},{"type":"bytes","name":"_data"}],"outputs":[]},{"type":"function","name":"selfPermit","constant":false,"stateMutability":"payable","payable":true,"inputs":[{"type":"address","name":"token"},{"type":"uint256","name":"value"},{"type":"uint256","name":"deadline"},{"type":"uint8","name":"v"},{"type":"bytes32","name":"r"},{"type":"bytes32","name":"s"}],"outputs":[]},{"type":"function","name":"selfPermitAllowed","constant":false,"stateMutability":"payable","payable":true,"inputs":[{"type":"address","name":"token"},{"type":"uint256","name":"nonce"},{"type":"uint256","name":"expiry"},{"type":"uint8","name":"v"},{"type":"bytes32","name":"r"},{"type":"bytes32","name":"s"}],"outputs":[]},{"type":"function","name":"selfPermitAllowedIfNecessary","constant":false,"stateMutability":"payable","payable":true,"inputs":[{"type":"address","name":"token"},{"type":"uint256","name":"nonce"},{"type":"uint256","name":"expiry"},{"type":"uint8","name":"v"},{"type":"bytes32","name":"r"},{"type":"bytes32","name":"s"}],"outputs":[]},{"type":"function","name":"selfPermitIfNecessary","constant":false,"stateMutability":"payable","payable":true,"inputs":[{"type":"address","name":"token"},{"type":"uint256","name":"value"},{"type":"uint256","name":"deadline"},{"type":"uint8","name":"v"},{"type":"bytes32","name":"r"},{"type":"bytes32","name":"s"}],"outputs":[]},{"type":"function","name":"setApprovalForAll","constant":false,"payable":false,"inputs":[{"type":"address","name":"operator"},{"type":"bool","name":"approved"}],"outputs":[]},{"type":"function","name":"supportsInterface","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"bytes4","name":"interfaceId"}],"outputs":[{"type":"bool"}]},{"type":"function","name":"sweepToken","constant":false,"stateMutability":"payable","payable":true,"inputs":[{"type":"address","name":"token"},{"type":"uint256","name":"amountMinimum"},{"type":"address","name":"recipient"}],"outputs":[]},{"type":"function","name":"symbol","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"string"}]},{"type":"function","name":"tokenByIndex","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"uint256","name":"index"}],"outputs":[{"type":"uint256"}]},{"type":"function","name":"tokenOfOwnerByIndex","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"address","name":"owner"},{"type":"uint256","name":"index"}],"outputs":[{"type":"uint256"}]},{"type":"function","name":"tokenURI","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"uint256","name":"tokenId"}],"outputs":[{"type":"string"}]},{"type":"function","name":"totalSupply","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"uint256"}]},{"type":"function","name":"transferFrom","constant":false,"payable":false,"inputs":[{"type":"address","name":"from"},{"type":"address","name":"to"},{"type":"uint256","name":"tokenId"}],"outputs":[]},{"type":"function","name":"uniswapV3MintCallback","constant":false,"payable":false,"inputs":[{"type":"uint256","name":"amount0Owed"},{"type":"uint256","name":"amount1Owed"},{"type":"bytes","name":"data"}],"outputs":[]},{"type":"function","name":"unwrapWETH9","constant":false,"stateMutability":"payable","payable":true,"inputs":[{"type":"uint256","name":"amountMinimum"},{"type":"address","name":"recipient"}],"outputs":[]}]

export const abi = new ethers.utils.Interface(rawAbi);
export const multicallAbi = new ethers.utils.Interface(rawMulticallAbi);

export type Approval0Event = ([owner: string, approved: string, tokenId: ethers.BigNumber] & {owner: string, approved: string, tokenId: ethers.BigNumber})

export type ApprovalForAll0Event = ([owner: string, operator: string, approved: boolean] & {owner: string, operator: string, approved: boolean})

export type Collect0Event = ([tokenId: ethers.BigNumber, recipient: string, amount0: ethers.BigNumber, amount1: ethers.BigNumber] & {tokenId: ethers.BigNumber, recipient: string, amount0: ethers.BigNumber, amount1: ethers.BigNumber})

export type DecreaseLiquidity0Event = ([tokenId: ethers.BigNumber, liquidity: ethers.BigNumber, amount0: ethers.BigNumber, amount1: ethers.BigNumber] & {tokenId: ethers.BigNumber, liquidity: ethers.BigNumber, amount0: ethers.BigNumber, amount1: ethers.BigNumber})

export type IncreaseLiquidity0Event = ([tokenId: ethers.BigNumber, liquidity: ethers.BigNumber, amount0: ethers.BigNumber, amount1: ethers.BigNumber] & {tokenId: ethers.BigNumber, liquidity: ethers.BigNumber, amount0: ethers.BigNumber, amount1: ethers.BigNumber})

export type Transfer0Event = ([from: string, to: string, tokenId: ethers.BigNumber] & {from: string, to: string, tokenId: ethers.BigNumber})

class Events {

  'Approval(address,address,uint256)' = {
    topic: abi.getEventTopic('Approval(address,address,uint256)'),
    decode(data: EvmLog): Approval0Event {
      return abi.decodeEventLog('Approval(address,address,uint256)', data.data, data.topics) as any
    }
  }

  Approval = this['Approval(address,address,uint256)']

  'ApprovalForAll(address,address,bool)' = {
    topic: abi.getEventTopic('ApprovalForAll(address,address,bool)'),
    decode(data: EvmLog): ApprovalForAll0Event {
      return abi.decodeEventLog('ApprovalForAll(address,address,bool)', data.data, data.topics) as any
    }
  }

  ApprovalForAll = this['ApprovalForAll(address,address,bool)']

  'Collect(uint256,address,uint256,uint256)' = {
    topic: abi.getEventTopic('Collect(uint256,address,uint256,uint256)'),
    decode(data: EvmLog): Collect0Event {
      return abi.decodeEventLog('Collect(uint256,address,uint256,uint256)', data.data, data.topics) as any
    }
  }

  Collect = this['Collect(uint256,address,uint256,uint256)']

  'DecreaseLiquidity(uint256,uint128,uint256,uint256)' = {
    topic: abi.getEventTopic('DecreaseLiquidity(uint256,uint128,uint256,uint256)'),
    decode(data: EvmLog): DecreaseLiquidity0Event {
      return abi.decodeEventLog('DecreaseLiquidity(uint256,uint128,uint256,uint256)', data.data, data.topics) as any
    }
  }

  DecreaseLiquidity = this['DecreaseLiquidity(uint256,uint128,uint256,uint256)']

  'IncreaseLiquidity(uint256,uint128,uint256,uint256)' = {
    topic: abi.getEventTopic('IncreaseLiquidity(uint256,uint128,uint256,uint256)'),
    decode(data: EvmLog): IncreaseLiquidity0Event {
      return abi.decodeEventLog('IncreaseLiquidity(uint256,uint128,uint256,uint256)', data.data, data.topics) as any
    }
  }

  IncreaseLiquidity = this['IncreaseLiquidity(uint256,uint128,uint256,uint256)']

  'Transfer(address,address,uint256)' = {
    topic: abi.getEventTopic('Transfer(address,address,uint256)'),
    decode(data: EvmLog): Transfer0Event {
      return abi.decodeEventLog('Transfer(address,address,uint256)', data.data, data.topics) as any
    }
  }

  Transfer = this['Transfer(address,address,uint256)']
}

export const events = new Events()

export type Approve0Function = ([to: string, tokenId: ethers.BigNumber] & {to: string, tokenId: ethers.BigNumber})

export type Burn0Function = ([tokenId: ethers.BigNumber] & {tokenId: ethers.BigNumber})

export type Collect0Function = ([tokenId: ethers.BigNumber, recipient: string, amount0Max: ethers.BigNumber, amount1Max: ethers.BigNumber] & {tokenId: ethers.BigNumber, recipient: string, amount0Max: ethers.BigNumber, amount1Max: ethers.BigNumber})

export type CreateAndInitializePoolIfNecessary0Function = ([tokenA: string, tokenB: string, fee: number, sqrtPriceX96: ethers.BigNumber] & {tokenA: string, tokenB: string, fee: number, sqrtPriceX96: ethers.BigNumber})

export type DecreaseLiquidity0Function = ([tokenId: ethers.BigNumber, liquidity: ethers.BigNumber, amount0Min: ethers.BigNumber, amount1Min: ethers.BigNumber, deadline: ethers.BigNumber] & {tokenId: ethers.BigNumber, liquidity: ethers.BigNumber, amount0Min: ethers.BigNumber, amount1Min: ethers.BigNumber, deadline: ethers.BigNumber})

export type IncreaseLiquidity0Function = ([tokenId: ethers.BigNumber, amount0Desired: ethers.BigNumber, amount1Desired: ethers.BigNumber, amount0Min: ethers.BigNumber, amount1Min: ethers.BigNumber, deadline: ethers.BigNumber] & {tokenId: ethers.BigNumber, amount0Desired: ethers.BigNumber, amount1Desired: ethers.BigNumber, amount0Min: ethers.BigNumber, amount1Min: ethers.BigNumber, deadline: ethers.BigNumber})

export type Mint0Function = ([params: ([token0: string, token1: string, fee: number, tickLower: number, tickUpper: number, amount0Desired: ethers.BigNumber, amount1Desired: ethers.BigNumber, amount0Min: ethers.BigNumber, amount1Min: ethers.BigNumber, recipient: string, deadline: ethers.BigNumber] & {token0: string, token1: string, fee: number, tickLower: number, tickUpper: number, amount0Desired: ethers.BigNumber, amount1Desired: ethers.BigNumber, amount0Min: ethers.BigNumber, amount1Min: ethers.BigNumber, recipient: string, deadline: ethers.BigNumber})] & {params: ([token0: string, token1: string, fee: number, tickLower: number, tickUpper: number, amount0Desired: ethers.BigNumber, amount1Desired: ethers.BigNumber, amount0Min: ethers.BigNumber, amount1Min: ethers.BigNumber, recipient: string, deadline: ethers.BigNumber] & {token0: string, token1: string, fee: number, tickLower: number, tickUpper: number, amount0Desired: ethers.BigNumber, amount1Desired: ethers.BigNumber, amount0Min: ethers.BigNumber, amount1Min: ethers.BigNumber, recipient: string, deadline: ethers.BigNumber})})

export type Multicall0Function = ([data: string] & {data: string})

export type Permit0Function = ([spender: string, tokenId: ethers.BigNumber, deadline: ethers.BigNumber, v: number, r: string, s: string] & {spender: string, tokenId: ethers.BigNumber, deadline: ethers.BigNumber, v: number, r: string, s: string})

export type SafeTransferFrom0Function = ([from: string, to: string, tokenId: ethers.BigNumber] & {from: string, to: string, tokenId: ethers.BigNumber})

export type SafeTransferFrom1Function = ([from: string, to: string, tokenId: ethers.BigNumber, _data: string] & {from: string, to: string, tokenId: ethers.BigNumber, _data: string})

export type SelfPermit0Function = ([token: string, value: ethers.BigNumber, deadline: ethers.BigNumber, v: number, r: string, s: string] & {token: string, value: ethers.BigNumber, deadline: ethers.BigNumber, v: number, r: string, s: string})

export type SelfPermitAllowed0Function = ([token: string, nonce: ethers.BigNumber, expiry: ethers.BigNumber, v: number, r: string, s: string] & {token: string, nonce: ethers.BigNumber, expiry: ethers.BigNumber, v: number, r: string, s: string})

export type SelfPermitAllowedIfNecessary0Function = ([token: string, nonce: ethers.BigNumber, expiry: ethers.BigNumber, v: number, r: string, s: string] & {token: string, nonce: ethers.BigNumber, expiry: ethers.BigNumber, v: number, r: string, s: string})

export type SelfPermitIfNecessary0Function = ([token: string, value: ethers.BigNumber, deadline: ethers.BigNumber, v: number, r: string, s: string] & {token: string, value: ethers.BigNumber, deadline: ethers.BigNumber, v: number, r: string, s: string})

export type SetApprovalForAll0Function = ([operator: string, approved: boolean] & {operator: string, approved: boolean})

export type SweepToken0Function = ([token: string, amountMinimum: ethers.BigNumber, recipient: string] & {token: string, amountMinimum: ethers.BigNumber, recipient: string})

export type TransferFrom0Function = ([from: string, to: string, tokenId: ethers.BigNumber] & {from: string, to: string, tokenId: ethers.BigNumber})

export type UniswapV3MintCallback0Function = ([amount0Owed: ethers.BigNumber, amount1Owed: ethers.BigNumber, data: string] & {amount0Owed: ethers.BigNumber, amount1Owed: ethers.BigNumber, data: string})

export type UnwrapWETH90Function = ([amountMinimum: ethers.BigNumber, recipient: string] & {amountMinimum: ethers.BigNumber, recipient: string})

class Functions {

  'approve(address,uint256)' = {
    sighash: abi.getSighash('approve(address,uint256)'),
    decode(data: EvmTransaction | string): Approve0Function {
      return abi.decodeFunctionData('approve(address,uint256)', typeof data === 'string' ? data : data.input) as any
    }
  }

  approve = this['approve(address,uint256)']

  'baseURI()' = {
    sighash: abi.getSighash('baseURI()'),
  }

  baseURI = this['baseURI()']

  'burn(uint256)' = {
    sighash: abi.getSighash('burn(uint256)'),
    decode(data: EvmTransaction | string): Burn0Function {
      return abi.decodeFunctionData('burn(uint256)', typeof data === 'string' ? data : data.input) as any
    }
  }

  burn = this['burn(uint256)']

  'collect(uint256,address,uint128,uint128)' = {
    sighash: abi.getSighash('collect(uint256,address,uint128,uint128)'),
    decode(data: EvmTransaction | string): Collect0Function {
      return abi.decodeFunctionData('collect(uint256,address,uint128,uint128)', typeof data === 'string' ? data : data.input) as any
    }
  }

  collect = this['collect(uint256,address,uint128,uint128)']

  'createAndInitializePoolIfNecessary(address,address,uint24,uint160)' = {
    sighash: abi.getSighash('createAndInitializePoolIfNecessary(address,address,uint24,uint160)'),
    decode(data: EvmTransaction | string): CreateAndInitializePoolIfNecessary0Function {
      return abi.decodeFunctionData('createAndInitializePoolIfNecessary(address,address,uint24,uint160)', typeof data === 'string' ? data : data.input) as any
    }
  }

  createAndInitializePoolIfNecessary = this['createAndInitializePoolIfNecessary(address,address,uint24,uint160)']

  'decreaseLiquidity(uint256,uint128,uint256,uint256,uint256)' = {
    sighash: abi.getSighash('decreaseLiquidity(uint256,uint128,uint256,uint256,uint256)'),
    decode(data: EvmTransaction | string): DecreaseLiquidity0Function {
      return abi.decodeFunctionData('decreaseLiquidity(uint256,uint128,uint256,uint256,uint256)', typeof data === 'string' ? data : data.input) as any
    }
  }

  decreaseLiquidity = this['decreaseLiquidity(uint256,uint128,uint256,uint256,uint256)']

  'increaseLiquidity(uint256,uint256,uint256,uint256,uint256,uint256)' = {
    sighash: abi.getSighash('increaseLiquidity(uint256,uint256,uint256,uint256,uint256,uint256)'),
    decode(data: EvmTransaction | string): IncreaseLiquidity0Function {
      return abi.decodeFunctionData('increaseLiquidity(uint256,uint256,uint256,uint256,uint256,uint256)', typeof data === 'string' ? data : data.input) as any
    }
  }

  increaseLiquidity = this['increaseLiquidity(uint256,uint256,uint256,uint256,uint256,uint256)']

  'mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))' = {
    sighash: abi.getSighash('mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))'),
    decode(data: EvmTransaction | string): Mint0Function {
      return abi.decodeFunctionData('mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))', typeof data === 'string' ? data : data.input) as any
    }
  }

  mint = this['mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))']

  'multicall(bytes[])' = {
    sighash: abi.getSighash('multicall(bytes[])'),
    decode(data: EvmTransaction | string): Multicall0Function {
      return abi.decodeFunctionData('multicall(bytes[])', typeof data === 'string' ? data : data.input) as any
    }
  }

  multicall = this['multicall(bytes[])']

  'permit(address,uint256,uint256,uint8,bytes32,bytes32)' = {
    sighash: abi.getSighash('permit(address,uint256,uint256,uint8,bytes32,bytes32)'),
    decode(data: EvmTransaction | string): Permit0Function {
      return abi.decodeFunctionData('permit(address,uint256,uint256,uint8,bytes32,bytes32)', typeof data === 'string' ? data : data.input) as any
    }
  }

  permit = this['permit(address,uint256,uint256,uint8,bytes32,bytes32)']

  'safeTransferFrom(address,address,uint256)' = {
    sighash: abi.getSighash('safeTransferFrom(address,address,uint256)'),
    decode(data: EvmTransaction | string): SafeTransferFrom0Function {
      return abi.decodeFunctionData('safeTransferFrom(address,address,uint256)', typeof data === 'string' ? data : data.input) as any
    }
  }

  'safeTransferFrom(address,address,uint256,bytes)' = {
    sighash: abi.getSighash('safeTransferFrom(address,address,uint256,bytes)'),
    decode(data: EvmTransaction | string): SafeTransferFrom1Function {
      return abi.decodeFunctionData('safeTransferFrom(address,address,uint256,bytes)', typeof data === 'string' ? data : data.input) as any
    }
  }

  safeTransferFrom = this['safeTransferFrom(address,address,uint256)']

  'selfPermit(address,uint256,uint256,uint8,bytes32,bytes32)' = {
    sighash: abi.getSighash('selfPermit(address,uint256,uint256,uint8,bytes32,bytes32)'),
    decode(data: EvmTransaction | string): SelfPermit0Function {
      return abi.decodeFunctionData('selfPermit(address,uint256,uint256,uint8,bytes32,bytes32)', typeof data === 'string' ? data : data.input) as any
    }
  }

  selfPermit = this['selfPermit(address,uint256,uint256,uint8,bytes32,bytes32)']

  'selfPermitAllowed(address,uint256,uint256,uint8,bytes32,bytes32)' = {
    sighash: abi.getSighash('selfPermitAllowed(address,uint256,uint256,uint8,bytes32,bytes32)'),
    decode(data: EvmTransaction | string): SelfPermitAllowed0Function {
      return abi.decodeFunctionData('selfPermitAllowed(address,uint256,uint256,uint8,bytes32,bytes32)', typeof data === 'string' ? data : data.input) as any
    }
  }

  selfPermitAllowed = this['selfPermitAllowed(address,uint256,uint256,uint8,bytes32,bytes32)']

  'selfPermitAllowedIfNecessary(address,uint256,uint256,uint8,bytes32,bytes32)' = {
    sighash: abi.getSighash('selfPermitAllowedIfNecessary(address,uint256,uint256,uint8,bytes32,bytes32)'),
    decode(data: EvmTransaction | string): SelfPermitAllowedIfNecessary0Function {
      return abi.decodeFunctionData('selfPermitAllowedIfNecessary(address,uint256,uint256,uint8,bytes32,bytes32)', typeof data === 'string' ? data : data.input) as any
    }
  }

  selfPermitAllowedIfNecessary = this['selfPermitAllowedIfNecessary(address,uint256,uint256,uint8,bytes32,bytes32)']

  'selfPermitIfNecessary(address,uint256,uint256,uint8,bytes32,bytes32)' = {
    sighash: abi.getSighash('selfPermitIfNecessary(address,uint256,uint256,uint8,bytes32,bytes32)'),
    decode(data: EvmTransaction | string): SelfPermitIfNecessary0Function {
      return abi.decodeFunctionData('selfPermitIfNecessary(address,uint256,uint256,uint8,bytes32,bytes32)', typeof data === 'string' ? data : data.input) as any
    }
  }

  selfPermitIfNecessary = this['selfPermitIfNecessary(address,uint256,uint256,uint8,bytes32,bytes32)']

  'setApprovalForAll(address,bool)' = {
    sighash: abi.getSighash('setApprovalForAll(address,bool)'),
    decode(data: EvmTransaction | string): SetApprovalForAll0Function {
      return abi.decodeFunctionData('setApprovalForAll(address,bool)', typeof data === 'string' ? data : data.input) as any
    }
  }

  setApprovalForAll = this['setApprovalForAll(address,bool)']

  'sweepToken(address,uint256,address)' = {
    sighash: abi.getSighash('sweepToken(address,uint256,address)'),
    decode(data: EvmTransaction | string): SweepToken0Function {
      return abi.decodeFunctionData('sweepToken(address,uint256,address)', typeof data === 'string' ? data : data.input) as any
    }
  }

  sweepToken = this['sweepToken(address,uint256,address)']

  'transferFrom(address,address,uint256)' = {
    sighash: abi.getSighash('transferFrom(address,address,uint256)'),
    decode(data: EvmTransaction | string): TransferFrom0Function {
      return abi.decodeFunctionData('transferFrom(address,address,uint256)', typeof data === 'string' ? data : data.input) as any
    }
  }

  transferFrom = this['transferFrom(address,address,uint256)']

  'uniswapV3MintCallback(uint256,uint256,bytes)' = {
    sighash: abi.getSighash('uniswapV3MintCallback(uint256,uint256,bytes)'),
    decode(data: EvmTransaction | string): UniswapV3MintCallback0Function {
      return abi.decodeFunctionData('uniswapV3MintCallback(uint256,uint256,bytes)', typeof data === 'string' ? data : data.input) as any
    }
  }

  uniswapV3MintCallback = this['uniswapV3MintCallback(uint256,uint256,bytes)']

  'unwrapWETH9(uint256,address)' = {
    sighash: abi.getSighash('unwrapWETH9(uint256,address)'),
    decode(data: EvmTransaction | string): UnwrapWETH90Function {
      return abi.decodeFunctionData('unwrapWETH9(uint256,address)', typeof data === 'string' ? data : data.input) as any
    }
  }

  unwrapWETH9 = this['unwrapWETH9(uint256,address)']
}

export const functions = new Functions()

export class Contract {
  private readonly _chain: Chain
  private readonly blockHeight: number
  readonly address: string

  constructor(ctx: BlockContext, address: string)
  constructor(ctx: ChainContext, block: Block, address: string)
  constructor(ctx: BlockContext, blockOrAddress: Block | string, address?: string) {
    this._chain = ctx._chain
    if (typeof blockOrAddress === 'string')  {
      this.blockHeight = ctx.block.height
      this.address = ethers.utils.getAddress(blockOrAddress)
    }
    else  {
      assert(address != null)
      this.blockHeight = blockOrAddress.height
      this.address = ethers.utils.getAddress(address)
    }
  }

  'DOMAIN_SEPARATOR()' = {
    call: (): Promise<string> => this.call('DOMAIN_SEPARATOR()', []),
    tryCall: (): Promise<Result<string>> => this.tryCall('DOMAIN_SEPARATOR()', [])
  }

  DOMAIN_SEPARATOR = this['DOMAIN_SEPARATOR()']

  'PERMIT_TYPEHASH()' = {
    call: (): Promise<string> => this.call('PERMIT_TYPEHASH()', []),
    tryCall: (): Promise<Result<string>> => this.tryCall('PERMIT_TYPEHASH()', [])
  }

  PERMIT_TYPEHASH = this['PERMIT_TYPEHASH()']

  'WETH9()' = {
    call: (): Promise<string> => this.call('WETH9()', []),
    tryCall: (): Promise<Result<string>> => this.tryCall('WETH9()', [])
  }

  WETH9 = this['WETH9()']

  'balanceOf(address)' = {
    call: (owner: string): Promise<ethers.BigNumber> => this.call('balanceOf(address)', [owner]),
    tryCall: (owner: string): Promise<Result<ethers.BigNumber>> => this.tryCall('balanceOf(address)', [owner])
  }

  balanceOf = this['balanceOf(address)']

  'factory()' = {
    call: (): Promise<string> => this.call('factory()', []),
    tryCall: (): Promise<Result<string>> => this.tryCall('factory()', [])
  }

  factory = this['factory()']

  'getApproved(uint256)' = {
    call: (tokenId: ethers.BigNumber): Promise<string> => this.call('getApproved(uint256)', [tokenId]),
    tryCall: (tokenId: ethers.BigNumber): Promise<Result<string>> => this.tryCall('getApproved(uint256)', [tokenId])
  }

  getApproved = this['getApproved(uint256)']

  'isApprovedForAll(address,address)' = {
    call: (owner: string, operator: string): Promise<boolean> => this.call('isApprovedForAll(address,address)', [owner, operator]),
    tryCall: (owner: string, operator: string): Promise<Result<boolean>> => this.tryCall('isApprovedForAll(address,address)', [owner, operator])
  }

  isApprovedForAll = this['isApprovedForAll(address,address)']

  'name()' = {
    call: (): Promise<string> => this.call('name()', []),
    tryCall: (): Promise<Result<string>> => this.tryCall('name()', [])
  }

  name = this['name()']

  'ownerOf(uint256)' = {
    call: (tokenId: ethers.BigNumber): Promise<string> => this.call('ownerOf(uint256)', [tokenId]),
    tryCall: (tokenId: ethers.BigNumber): Promise<Result<string>> => this.tryCall('ownerOf(uint256)', [tokenId])
  }

  ownerOf = this['ownerOf(uint256)']

  'positions(uint256)' = {
    call: (tokenId: ethers.BigNumber): Promise<([nonce: ethers.BigNumber, operator: string, token0: string, token1: string, fee: number, tickLower: number, tickUpper: number, liquidity: ethers.BigNumber, feeGrowthInside0LastX128: ethers.BigNumber, feeGrowthInside1LastX128: ethers.BigNumber, tokensOwed0: ethers.BigNumber, tokensOwed1: ethers.BigNumber] & {nonce: ethers.BigNumber, operator: string, token0: string, token1: string, fee: number, tickLower: number, tickUpper: number, liquidity: ethers.BigNumber, feeGrowthInside0LastX128: ethers.BigNumber, feeGrowthInside1LastX128: ethers.BigNumber, tokensOwed0: ethers.BigNumber, tokensOwed1: ethers.BigNumber})> => this.call('positions(uint256)', [tokenId]),
    tryCall: (tokenId: ethers.BigNumber): Promise<Result<([nonce: ethers.BigNumber, operator: string, token0: string, token1: string, fee: number, tickLower: number, tickUpper: number, liquidity: ethers.BigNumber, feeGrowthInside0LastX128: ethers.BigNumber, feeGrowthInside1LastX128: ethers.BigNumber, tokensOwed0: ethers.BigNumber, tokensOwed1: ethers.BigNumber] & {nonce: ethers.BigNumber, operator: string, token0: string, token1: string, fee: number, tickLower: number, tickUpper: number, liquidity: ethers.BigNumber, feeGrowthInside0LastX128: ethers.BigNumber, feeGrowthInside1LastX128: ethers.BigNumber, tokensOwed0: ethers.BigNumber, tokensOwed1: ethers.BigNumber})>> => this.tryCall('positions(uint256)', [tokenId])
  }

  positions = this['positions(uint256)']

  'supportsInterface(bytes4)' = {
    call: (interfaceId: string): Promise<boolean> => this.call('supportsInterface(bytes4)', [interfaceId]),
    tryCall: (interfaceId: string): Promise<Result<boolean>> => this.tryCall('supportsInterface(bytes4)', [interfaceId])
  }

  supportsInterface = this['supportsInterface(bytes4)']

  'symbol()' = {
    call: (): Promise<string> => this.call('symbol()', []),
    tryCall: (): Promise<Result<string>> => this.tryCall('symbol()', [])
  }

  symbol = this['symbol()']

  'tokenByIndex(uint256)' = {
    call: (index: ethers.BigNumber): Promise<ethers.BigNumber> => this.call('tokenByIndex(uint256)', [index]),
    tryCall: (index: ethers.BigNumber): Promise<Result<ethers.BigNumber>> => this.tryCall('tokenByIndex(uint256)', [index])
  }

  tokenByIndex = this['tokenByIndex(uint256)']

  'tokenOfOwnerByIndex(address,uint256)' = {
    call: (owner: string, index: ethers.BigNumber): Promise<ethers.BigNumber> => this.call('tokenOfOwnerByIndex(address,uint256)', [owner, index]),
    tryCall: (owner: string, index: ethers.BigNumber): Promise<Result<ethers.BigNumber>> => this.tryCall('tokenOfOwnerByIndex(address,uint256)', [owner, index])
  }

  tokenOfOwnerByIndex = this['tokenOfOwnerByIndex(address,uint256)']

  'tokenURI(uint256)' = {
    call: (tokenId: ethers.BigNumber): Promise<string> => this.call('tokenURI(uint256)', [tokenId]),
    tryCall: (tokenId: ethers.BigNumber): Promise<Result<string>> => this.tryCall('tokenURI(uint256)', [tokenId])
  }

  tokenURI = this['tokenURI(uint256)']

  'totalSupply()' = {
    call: (): Promise<ethers.BigNumber> => this.call('totalSupply()', []),
    tryCall: (): Promise<Result<ethers.BigNumber>> => this.tryCall('totalSupply()', [])
  }

  totalSupply = this['totalSupply()']

  private async call(signature: string, args: any[]) : Promise<any> {
    const data = abi.encodeFunctionData(signature, args)
    const result = await this._chain.client.call('eth_call', [{to: this.address, data}, this.blockHeight])
    const decoded = abi.decodeFunctionResult(signature, result)
    return decoded.length > 1 ? decoded : decoded[0]
  }

  private async tryCall(signature: string, args: any[]) : Promise<Result<any>> {
    return this.call(signature, args).then(r => ({success: true, value: r})).catch(() => ({success: false}))
  }
}

export class MulticallContract {
  private readonly _chain: Chain
  private readonly blockHeight: number
  readonly address: string

  constructor(ctx: BlockContext, multicallAddress: string)
  constructor(ctx: ChainContext, block: Block, multicallAddress: string)
  constructor(ctx: BlockContext, blockOrAddress: Block | string, address?: string) {
    this._chain = ctx._chain
    if (typeof blockOrAddress === 'string')  {
      this.blockHeight = ctx.block.height
      this.address = ethers.utils.getAddress(blockOrAddress)
    }
    else  {
      assert(address != null)
      this.blockHeight = blockOrAddress.height
      this.address = ethers.utils.getAddress(address)
    }
  }

  'DOMAIN_SEPARATOR()' = {
    call: (args: string[]): Promise<string[]> => this.call('DOMAIN_SEPARATOR()', args.map((arg) => [arg, []])),
    tryCall: (args: string[]): Promise<Result<string>[]> => this.tryCall('DOMAIN_SEPARATOR()', args.map((arg) => [arg, []]))
  }

  DOMAIN_SEPARATOR = this['DOMAIN_SEPARATOR()']

  'PERMIT_TYPEHASH()' = {
    call: (args: string[]): Promise<string[]> => this.call('PERMIT_TYPEHASH()', args.map((arg) => [arg, []])),
    tryCall: (args: string[]): Promise<Result<string>[]> => this.tryCall('PERMIT_TYPEHASH()', args.map((arg) => [arg, []]))
  }

  PERMIT_TYPEHASH = this['PERMIT_TYPEHASH()']

  'WETH9()' = {
    call: (args: string[]): Promise<string[]> => this.call('WETH9()', args.map((arg) => [arg, []])),
    tryCall: (args: string[]): Promise<Result<string>[]> => this.tryCall('WETH9()', args.map((arg) => [arg, []]))
  }

  WETH9 = this['WETH9()']

  'balanceOf(address)' = {
    call: (args: [string, [owner: string]][]): Promise<ethers.BigNumber[]> => this.call('balanceOf(address)', args),
    tryCall: (args: [string, [owner: string]][]): Promise<Result<ethers.BigNumber>[]> => this.tryCall('balanceOf(address)', args)
  }

  balanceOf = this['balanceOf(address)']

  'factory()' = {
    call: (args: string[]): Promise<string[]> => this.call('factory()', args.map((arg) => [arg, []])),
    tryCall: (args: string[]): Promise<Result<string>[]> => this.tryCall('factory()', args.map((arg) => [arg, []]))
  }

  factory = this['factory()']

  'getApproved(uint256)' = {
    call: (args: [string, [tokenId: ethers.BigNumber]][]): Promise<string[]> => this.call('getApproved(uint256)', args),
    tryCall: (args: [string, [tokenId: ethers.BigNumber]][]): Promise<Result<string>[]> => this.tryCall('getApproved(uint256)', args)
  }

  getApproved = this['getApproved(uint256)']

  'isApprovedForAll(address,address)' = {
    call: (args: [string, [owner: string, operator: string]][]): Promise<boolean[]> => this.call('isApprovedForAll(address,address)', args),
    tryCall: (args: [string, [owner: string, operator: string]][]): Promise<Result<boolean>[]> => this.tryCall('isApprovedForAll(address,address)', args)
  }

  isApprovedForAll = this['isApprovedForAll(address,address)']

  'name()' = {
    call: (args: string[]): Promise<string[]> => this.call('name()', args.map((arg) => [arg, []])),
    tryCall: (args: string[]): Promise<Result<string>[]> => this.tryCall('name()', args.map((arg) => [arg, []]))
  }

  name = this['name()']

  'ownerOf(uint256)' = {
    call: (args: [string, [tokenId: ethers.BigNumber]][]): Promise<string[]> => this.call('ownerOf(uint256)', args),
    tryCall: (args: [string, [tokenId: ethers.BigNumber]][]): Promise<Result<string>[]> => this.tryCall('ownerOf(uint256)', args)
  }

  ownerOf = this['ownerOf(uint256)']

  'positions(uint256)' = {
    call: (args: [string, [tokenId: ethers.BigNumber]][]): Promise<([nonce: ethers.BigNumber, operator: string, token0: string, token1: string, fee: number, tickLower: number, tickUpper: number, liquidity: ethers.BigNumber, feeGrowthInside0LastX128: ethers.BigNumber, feeGrowthInside1LastX128: ethers.BigNumber, tokensOwed0: ethers.BigNumber, tokensOwed1: ethers.BigNumber] & {nonce: ethers.BigNumber, operator: string, token0: string, token1: string, fee: number, tickLower: number, tickUpper: number, liquidity: ethers.BigNumber, feeGrowthInside0LastX128: ethers.BigNumber, feeGrowthInside1LastX128: ethers.BigNumber, tokensOwed0: ethers.BigNumber, tokensOwed1: ethers.BigNumber})[]> => this.call('positions(uint256)', args),
    tryCall: (args: [string, [tokenId: ethers.BigNumber]][]): Promise<Result<([nonce: ethers.BigNumber, operator: string, token0: string, token1: string, fee: number, tickLower: number, tickUpper: number, liquidity: ethers.BigNumber, feeGrowthInside0LastX128: ethers.BigNumber, feeGrowthInside1LastX128: ethers.BigNumber, tokensOwed0: ethers.BigNumber, tokensOwed1: ethers.BigNumber] & {nonce: ethers.BigNumber, operator: string, token0: string, token1: string, fee: number, tickLower: number, tickUpper: number, liquidity: ethers.BigNumber, feeGrowthInside0LastX128: ethers.BigNumber, feeGrowthInside1LastX128: ethers.BigNumber, tokensOwed0: ethers.BigNumber, tokensOwed1: ethers.BigNumber})>[]> => this.tryCall('positions(uint256)', args)
  }

  positions = this['positions(uint256)']

  'supportsInterface(bytes4)' = {
    call: (args: [string, [interfaceId: string]][]): Promise<boolean[]> => this.call('supportsInterface(bytes4)', args),
    tryCall: (args: [string, [interfaceId: string]][]): Promise<Result<boolean>[]> => this.tryCall('supportsInterface(bytes4)', args)
  }

  supportsInterface = this['supportsInterface(bytes4)']

  'symbol()' = {
    call: (args: string[]): Promise<string[]> => this.call('symbol()', args.map((arg) => [arg, []])),
    tryCall: (args: string[]): Promise<Result<string>[]> => this.tryCall('symbol()', args.map((arg) => [arg, []]))
  }

  symbol = this['symbol()']

  'tokenByIndex(uint256)' = {
    call: (args: [string, [index: ethers.BigNumber]][]): Promise<ethers.BigNumber[]> => this.call('tokenByIndex(uint256)', args),
    tryCall: (args: [string, [index: ethers.BigNumber]][]): Promise<Result<ethers.BigNumber>[]> => this.tryCall('tokenByIndex(uint256)', args)
  }

  tokenByIndex = this['tokenByIndex(uint256)']

  'tokenOfOwnerByIndex(address,uint256)' = {
    call: (args: [string, [owner: string, index: ethers.BigNumber]][]): Promise<ethers.BigNumber[]> => this.call('tokenOfOwnerByIndex(address,uint256)', args),
    tryCall: (args: [string, [owner: string, index: ethers.BigNumber]][]): Promise<Result<ethers.BigNumber>[]> => this.tryCall('tokenOfOwnerByIndex(address,uint256)', args)
  }

  tokenOfOwnerByIndex = this['tokenOfOwnerByIndex(address,uint256)']

  'tokenURI(uint256)' = {
    call: (args: [string, [tokenId: ethers.BigNumber]][]): Promise<string[]> => this.call('tokenURI(uint256)', args),
    tryCall: (args: [string, [tokenId: ethers.BigNumber]][]): Promise<Result<string>[]> => this.tryCall('tokenURI(uint256)', args)
  }

  tokenURI = this['tokenURI(uint256)']

  'totalSupply()' = {
    call: (args: string[]): Promise<ethers.BigNumber[]> => this.call('totalSupply()', args.map((arg) => [arg, []])),
    tryCall: (args: string[]): Promise<Result<ethers.BigNumber>[]> => this.tryCall('totalSupply()', args.map((arg) => [arg, []]))
  }

  totalSupply = this['totalSupply()']

  private async call(signature: string, args: [string, any[]][]) : Promise<any> {
    const encodedArgs = args.map((arg) => [arg[0], abi.encodeFunctionData(signature, arg[1])])
    const data = multicallAbi.encodeFunctionData('aggregate', [encodedArgs])
    const response = await this._chain.client.call('eth_call', [{to: this.address, data}, this.blockHeight])
    const batch = multicallAbi.decodeFunctionResult('aggregate', response).returnData
    const result: any[] = []
    for (const item of batch) {
      const decodedItem = abi.decodeFunctionResult(signature, item)
      result.push(decodedItem.length > 1 ? decodedItem : decodedItem[0])
    }
    return result
  }

  private async tryCall(signature: string, args: [string, any[]][]) : Promise<Result<any>[]> {
    const encodedArgs = args.map((arg) => [arg[0], abi.encodeFunctionData(signature, arg[1])])
    const data = multicallAbi.encodeFunctionData('tryAggregate', [false, encodedArgs])
    const response = await this._chain.client.call('eth_call', [{to: this.address, data}, this.blockHeight])
    const batch = multicallAbi.decodeFunctionResult('tryAggregate', response).returnData
    const result: any[] = []
    for (const item of batch) {
      try {
        if (!item.success) throw new Error()
        const decodedItem = abi.decodeFunctionResult(signature, item.returnData)
        result.push({success:true, value: decodedItem.length > 1 ? decodedItem : decodedItem[0]})
      } catch {
        result.push({success: false})
      }
    }
    return result
  }
}
