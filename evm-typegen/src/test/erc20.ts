import assert from 'assert'
import * as ethers from 'ethers'
import {EvmLog, EvmTransaction, Block, ChainContext, BlockContext, Chain, Result, rawMulticallAbi} from './support'

export const rawAbi = [{"type":"function","name":"name","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"string"}]},{"type":"function","name":"approve","constant":false,"payable":false,"inputs":[{"type":"address","name":"_spender"},{"type":"uint256","name":"_value"}],"outputs":[{"type":"bool"}]},{"type":"function","name":"totalSupply","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"uint256"}]},{"type":"function","name":"transferFrom","constant":false,"payable":false,"inputs":[{"type":"address","name":"_from"},{"type":"address","name":"_to"},{"type":"uint256","name":"_value"}],"outputs":[{"type":"bool"}]},{"type":"function","name":"decimals","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"uint8"}]},{"type":"function","name":"balanceOf","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"address","name":"_owner"}],"outputs":[{"type":"uint256","name":"balance"}]},{"type":"function","name":"symbol","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"string"}]},{"type":"function","name":"transfer","constant":false,"payable":false,"inputs":[{"type":"address","name":"_to"},{"type":"uint256","name":"_value"}],"outputs":[{"type":"bool"}]},{"type":"function","name":"allowance","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"address","name":"_owner"},{"type":"address","name":"_spender"}],"outputs":[{"type":"uint256"}]},{"type":"event","anonymous":false,"name":"Approval","inputs":[{"type":"address","name":"owner","indexed":true},{"type":"address","name":"spender","indexed":true},{"type":"uint256","name":"value","indexed":false}]},{"type":"event","anonymous":false,"name":"Transfer","inputs":[{"type":"address","name":"from","indexed":true},{"type":"address","name":"to","indexed":true},{"type":"uint256","name":"value","indexed":false}]}]

export const abi = new ethers.utils.Interface(rawAbi);
export const multicallAbi = new ethers.utils.Interface(rawMulticallAbi);

export type Approval0Event = ([owner: string, spender: string, value: ethers.BigNumber] & {owner: string, spender: string, value: ethers.BigNumber})

export type Transfer0Event = ([from: string, to: string, value: ethers.BigNumber] & {from: string, to: string, value: ethers.BigNumber})

class Events {

  'Approval(address,address,uint256)' = {
    topic: abi.getEventTopic('Approval(address,address,uint256)'),
    decode(data: EvmLog): Approval0Event {
      return abi.decodeEventLog('Approval(address,address,uint256)', data.data, data.topics) as any
    }
  }

  Approval = this['Approval(address,address,uint256)']

  'Transfer(address,address,uint256)' = {
    topic: abi.getEventTopic('Transfer(address,address,uint256)'),
    decode(data: EvmLog): Transfer0Event {
      return abi.decodeEventLog('Transfer(address,address,uint256)', data.data, data.topics) as any
    }
  }

  Transfer = this['Transfer(address,address,uint256)']
}

export const events = new Events()

export type Approve0Function = ([_spender: string, _value: ethers.BigNumber] & {_spender: string, _value: ethers.BigNumber})

export type TransferFrom0Function = ([_from: string, _to: string, _value: ethers.BigNumber] & {_from: string, _to: string, _value: ethers.BigNumber})

export type Transfer0Function = ([_to: string, _value: ethers.BigNumber] & {_to: string, _value: ethers.BigNumber})

class Functions {

  'approve(address,uint256)' = {
    sighash: abi.getSighash('approve(address,uint256)'),
    decode(data: EvmTransaction | string): Approve0Function {
      return abi.decodeFunctionData('approve(address,uint256)', typeof data === 'string' ? data : data.input) as any
    }
  }

  approve = this['approve(address,uint256)']

  'transferFrom(address,address,uint256)' = {
    sighash: abi.getSighash('transferFrom(address,address,uint256)'),
    decode(data: EvmTransaction | string): TransferFrom0Function {
      return abi.decodeFunctionData('transferFrom(address,address,uint256)', typeof data === 'string' ? data : data.input) as any
    }
  }

  transferFrom = this['transferFrom(address,address,uint256)']

  'transfer(address,uint256)' = {
    sighash: abi.getSighash('transfer(address,uint256)'),
    decode(data: EvmTransaction | string): Transfer0Function {
      return abi.decodeFunctionData('transfer(address,uint256)', typeof data === 'string' ? data : data.input) as any
    }
  }

  transfer = this['transfer(address,uint256)']
}

export const functions = new Functions()

export class Contract {
  private readonly _chain: Chain
  private readonly blockHeight: string
  readonly address: string

  constructor(ctx: BlockContext, address: string)
  constructor(ctx: ChainContext, block: Block, address: string)
  constructor(ctx: BlockContext, blockOrAddress: Block | string, address?: string) {
    this._chain = ctx._chain
    if (typeof blockOrAddress === 'string')  {
      this.blockHeight = '0x' + ctx.block.height.toString(16)
      this.address = ethers.utils.getAddress(blockOrAddress)
    }
    else  {
      assert(address != null)
      this.blockHeight = '0x' + blockOrAddress.height.toString(16)
      this.address = ethers.utils.getAddress(address)
    }
  }

  'name()' = {
    call: (): Promise<string> => this.call('name()', []),
    tryCall: (): Promise<Result<string>> => this.tryCall('name()', [])
  }

  name = this['name()']

  'totalSupply()' = {
    call: (): Promise<ethers.BigNumber> => this.call('totalSupply()', []),
    tryCall: (): Promise<Result<ethers.BigNumber>> => this.tryCall('totalSupply()', [])
  }

  totalSupply = this['totalSupply()']

  'decimals()' = {
    call: (): Promise<number> => this.call('decimals()', []),
    tryCall: (): Promise<Result<number>> => this.tryCall('decimals()', [])
  }

  decimals = this['decimals()']

  'balanceOf(address)' = {
    call: (_owner: string): Promise<ethers.BigNumber> => this.call('balanceOf(address)', [_owner]),
    tryCall: (_owner: string): Promise<Result<ethers.BigNumber>> => this.tryCall('balanceOf(address)', [_owner])
  }

  balanceOf = this['balanceOf(address)']

  'symbol()' = {
    call: (): Promise<string> => this.call('symbol()', []),
    tryCall: (): Promise<Result<string>> => this.tryCall('symbol()', [])
  }

  symbol = this['symbol()']

  'allowance(address,address)' = {
    call: (_owner: string, _spender: string): Promise<ethers.BigNumber> => this.call('allowance(address,address)', [_owner, _spender]),
    tryCall: (_owner: string, _spender: string): Promise<Result<ethers.BigNumber>> => this.tryCall('allowance(address,address)', [_owner, _spender])
  }

  allowance = this['allowance(address,address)']

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
  private readonly blockHeight: string
  readonly address: string

  constructor(ctx: BlockContext, multicallAddress: string)
  constructor(ctx: ChainContext, block: Block, multicallAddress: string)
  constructor(ctx: BlockContext, blockOrAddress: Block | string, address?: string) {
    this._chain = ctx._chain
    if (typeof blockOrAddress === 'string')  {
      this.blockHeight = '0x' + ctx.block.height.toString(16)
      this.address = ethers.utils.getAddress(blockOrAddress)
    }
    else  {
      assert(address != null)
      this.blockHeight = '0x' + blockOrAddress.height.toString(16)
      this.address = ethers.utils.getAddress(address)
    }
  }

  'name()' = {
    call: (args: string[]): Promise<string[]> => this.call('name()', args.map((arg) => [arg, []])),
    try: (args: string[]): Promise<Result<string>[]> => this.try('name()', args.map((arg) => [arg, []]))
  }

  name = this['name()']

  'totalSupply()' = {
    call: (args: string[]): Promise<ethers.BigNumber[]> => this.call('totalSupply()', args.map((arg) => [arg, []])),
    try: (args: string[]): Promise<Result<ethers.BigNumber>[]> => this.try('totalSupply()', args.map((arg) => [arg, []]))
  }

  totalSupply = this['totalSupply()']

  'decimals()' = {
    call: (args: string[]): Promise<number[]> => this.call('decimals()', args.map((arg) => [arg, []])),
    try: (args: string[]): Promise<Result<number>[]> => this.try('decimals()', args.map((arg) => [arg, []]))
  }

  decimals = this['decimals()']

  'balanceOf(address)' = {
    call: (args: [string, [_owner: string]][]): Promise<ethers.BigNumber[]> => this.call('balanceOf(address)', args),
    try: (args: [string, [_owner: string]][]): Promise<Result<ethers.BigNumber>[]> => this.try('balanceOf(address)', args)
  }

  balanceOf = this['balanceOf(address)']

  'symbol()' = {
    call: (args: string[]): Promise<string[]> => this.call('symbol()', args.map((arg) => [arg, []])),
    try: (args: string[]): Promise<Result<string>[]> => this.try('symbol()', args.map((arg) => [arg, []]))
  }

  symbol = this['symbol()']

  'allowance(address,address)' = {
    call: (args: [string, [_owner: string, _spender: string]][]): Promise<ethers.BigNumber[]> => this.call('allowance(address,address)', args),
    try: (args: [string, [_owner: string, _spender: string]][]): Promise<Result<ethers.BigNumber>[]> => this.try('allowance(address,address)', args)
  }

  allowance = this['allowance(address,address)']

  private async call(signature: string, args: [string, any[]][]) : Promise<any> {
    const encodedArgs = args.map((arg) => [arg[0], abi.encodeFunctionData(signature, arg[1])])
    const data = multicallAbi.encodeFunctionData('aggregate', [encodedArgs])
    const response = await this._chain.client.call('eth_call', [{to: this.address, data}, this.blockHeight])
    const batch = multicallAbi.decodeFunctionResult('aggregate', response).returnData
    return batch.map((item: any) => {
      const decodedItem = abi.decodeFunctionResult(signature, item.returnData)
      return decodedItem.length > 1 ? decodedItem : decodedItem[0]
    })
  }

  private async try(signature: string, args: [string, any[]][]) : Promise<Result<any>[]> {
    const encodedArgs = args.map((arg) => [arg[0], abi.encodeFunctionData(signature, arg[1])])
    const data = multicallAbi.encodeFunctionData('tryAggregate', [false, encodedArgs])
    const response = await this._chain.client.call('eth_call', [{to: this.address, data}, this.blockHeight])
    const batch = multicallAbi.decodeFunctionResult('tryAggregate', response).returnData
    return batch.map((item: any) => {
      try {
        if (!item.success) throw false
        const decodedItem = abi.decodeFunctionResult(signature, item.returnData)
        return {success: true, value: decodedItem.length > 1 ? decodedItem : decodedItem[0]}
      } catch {
        return {success: false}
      }
    })
  }
}
