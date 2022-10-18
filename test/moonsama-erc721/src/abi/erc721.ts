import assert from 'assert'
import * as ethers from 'ethers'
import {EvmLog, EvmTransaction, ChainContext, BlockContext, BaseContract, decodeEvent, decodeFunction} from './support'

export const abi = new ethers.utils.Interface(getJsonAbi());

export type Approval0Event = ([owner: string, approved: string, tokenId: ethers.BigNumber] & {owner: string, approved: string, tokenId: ethers.BigNumber})

export type ApprovalForAll0Event = ([owner: string, operator: string, approved: boolean] & {owner: string, operator: string, approved: boolean})

export type Transfer0Event = ([from: string, to: string, tokenId: ethers.BigNumber] & {from: string, to: string, tokenId: ethers.BigNumber})


export const events = {
  "Approval(address,address,uint256)": {
    topic: abi.getEventTopic('Approval(address,address,uint256)'),
    decode(data: EvmLog): Approval0Event {
      return decodeEvent(abi, 'Approval(address,address,uint256)', data)
    }
  }
  ,
  "ApprovalForAll(address,address,bool)": {
    topic: abi.getEventTopic('ApprovalForAll(address,address,bool)'),
    decode(data: EvmLog): ApprovalForAll0Event {
      return decodeEvent(abi, 'ApprovalForAll(address,address,bool)', data)
    }
  }
  ,
  "Transfer(address,address,uint256)": {
    topic: abi.getEventTopic('Transfer(address,address,uint256)'),
    decode(data: EvmLog): Transfer0Event {
      return decodeEvent(abi, 'Transfer(address,address,uint256)', data)
    }
  }
  ,
}

export type Approve0Function = ([to: string, tokenId: ethers.BigNumber] & {to: string, tokenId: ethers.BigNumber})

export type BalanceOf0Function = ([owner: string] & {owner: string})

export type GetApproved0Function = ([tokenId: ethers.BigNumber] & {tokenId: ethers.BigNumber})

export type IsApprovedForAll0Function = ([owner: string, operator: string] & {owner: string, operator: string})

export type OwnerOf0Function = ([tokenId: ethers.BigNumber] & {tokenId: ethers.BigNumber})

export type SafeTransferFrom0Function = ([from: string, to: string, tokenId: ethers.BigNumber] & {from: string, to: string, tokenId: ethers.BigNumber})

export type SafeTransferFrom1Function = ([from: string, to: string, tokenId: ethers.BigNumber, _data: string] & {from: string, to: string, tokenId: ethers.BigNumber, _data: string})

export type SetApprovalForAll0Function = ([operator: string, approved: boolean] & {operator: string, approved: boolean})

export type SupportsInterface0Function = ([interfaceId: string] & {interfaceId: string})

export type TokenByIndex0Function = ([index: ethers.BigNumber] & {index: ethers.BigNumber})

export type TokenOfOwnerByIndex0Function = ([owner: string, index: ethers.BigNumber] & {owner: string, index: ethers.BigNumber})

export type TokenURI0Function = ([tokenId: ethers.BigNumber] & {tokenId: ethers.BigNumber})

export type TransferFrom0Function = ([from: string, to: string, tokenId: ethers.BigNumber] & {from: string, to: string, tokenId: ethers.BigNumber})


export class Functions {
  static approve = this['approve(address,uint256)']
  static "approve(address,uint256)" = {
    sighash: abi.getSighash('approve(address,uint256)'),
    decode(transaction: EvmTransaction | string): Approve0Function {
      return decodeFunction(abi, 'approve(address,uint256)', transaction)
    }
  }

  "balanceOf(address)": {
    sighash: abi.getSighash('balanceOf(address)'),
    decode(transaction: EvmTransaction | string): BalanceOf0Function {
      return decodeFunction(abi, 'balanceOf(address)', transaction)
    }
  }
  ,
  "baseURI()": {
    sighash: abi.getSighash('baseURI()'),
  }
  ,
  "getApproved(uint256)": {
    sighash: abi.getSighash('getApproved(uint256)'),
    decode(transaction: EvmTransaction | string): GetApproved0Function {
      return decodeFunction(abi, 'getApproved(uint256)', transaction)
    }
  }
  ,
  "isApprovedForAll(address,address)": {
    sighash: abi.getSighash('isApprovedForAll(address,address)'),
    decode(transaction: EvmTransaction | string): IsApprovedForAll0Function {
      return decodeFunction(abi, 'isApprovedForAll(address,address)', transaction)
    }
  }
  ,
  "name()": {
    sighash: abi.getSighash('name()'),
  }
  ,
  "ownerOf(uint256)": {
    sighash: abi.getSighash('ownerOf(uint256)'),
    decode(transaction: EvmTransaction | string): OwnerOf0Function {
      return decodeFunction(abi, 'ownerOf(uint256)', transaction)
    }
  }
  ,
  "safeTransferFrom(address,address,uint256)": {
    sighash: abi.getSighash('safeTransferFrom(address,address,uint256)'),
    decode(transaction: EvmTransaction | string): SafeTransferFrom0Function {
      return decodeFunction(abi, 'safeTransferFrom(address,address,uint256)', transaction)
    }
  }
  ,
  "safeTransferFrom(address,address,uint256,bytes)": {
    sighash: abi.getSighash('safeTransferFrom(address,address,uint256,bytes)'),
    decode(transaction: EvmTransaction | string): SafeTransferFrom1Function {
      return decodeFunction(abi, 'safeTransferFrom(address,address,uint256,bytes)', transaction)
    }
  }
  ,
  "setApprovalForAll(address,bool)": {
    sighash: abi.getSighash('setApprovalForAll(address,bool)'),
    decode(transaction: EvmTransaction | string): SetApprovalForAll0Function {
      return decodeFunction(abi, 'setApprovalForAll(address,bool)', transaction)
    }
  }
  ,
  "supportsInterface(bytes4)": {
    sighash: abi.getSighash('supportsInterface(bytes4)'),
    decode(transaction: EvmTransaction | string): SupportsInterface0Function {
      return decodeFunction(abi, 'supportsInterface(bytes4)', transaction)
    }
  }
  ,
  "symbol()": {
    sighash: abi.getSighash('symbol()'),
  }
  ,
  "tokenByIndex(uint256)": {
    sighash: abi.getSighash('tokenByIndex(uint256)'),
    decode(transaction: EvmTransaction | string): TokenByIndex0Function {
      return decodeFunction(abi, 'tokenByIndex(uint256)', transaction)
    }
  }
  ,
  "tokenOfOwnerByIndex(address,uint256)": {
    sighash: abi.getSighash('tokenOfOwnerByIndex(address,uint256)'),
    decode(transaction: EvmTransaction | string): TokenOfOwnerByIndex0Function {
      return decodeFunction(abi, 'tokenOfOwnerByIndex(address,uint256)', transaction)
    }
  }
  ,
  "tokenURI(uint256)": {
    sighash: abi.getSighash('tokenURI(uint256)'),
    decode(transaction: EvmTransaction | string): TokenURI0Function {
      return decodeFunction(abi, 'tokenURI(uint256)', transaction)
    }
  }
  ,
  "totalSupply()": {
    sighash: abi.getSighash('totalSupply()'),
  }
  ,
  "transferFrom(address,address,uint256)": {
    sighash: abi.getSighash('transferFrom(address,address,uint256)'),
    decode(transaction: EvmTransaction | string): TransferFrom0Function {
      return decodeFunction(abi, 'transferFrom(address,address,uint256)', transaction)
    }
  }
  ,
}

export class Contract extends BaseContract {
  constructor(ctx: BlockContext, address: string)
  constructor(ctx: ChainContext, block: Block, address: string)
  constructor(ctx: BlockContext, blockOrAddress: Block | string, address?: string) {
    super(ctx, blockOrAddress, address)
    this._abi = abi
  }

}

function getJsonAbi(): any {
  return [
    {
      "name": null,
      "type": "constructor",
      "inputs": [
        {
          "name": "name",
          "type": "string",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "string",
          "_isParamType": true
        },
        {
          "name": "symbol",
          "type": "string",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "string",
          "_isParamType": true
        },
        {
          "name": "baseURI",
          "type": "string",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "string",
          "_isParamType": true
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "gas": null,
      "_isFragment": true
    },
    {
      "name": "Approval",
      "anonymous": false,
      "inputs": [
        {
          "name": "owner",
          "type": "address",
          "indexed": true,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "address",
          "_isParamType": true
        },
        {
          "name": "approved",
          "type": "address",
          "indexed": true,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "address",
          "_isParamType": true
        },
        {
          "name": "tokenId",
          "type": "uint256",
          "indexed": true,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "uint256",
          "_isParamType": true
        }
      ],
      "type": "event",
      "_isFragment": true
    },
    {
      "name": "ApprovalForAll",
      "anonymous": false,
      "inputs": [
        {
          "name": "owner",
          "type": "address",
          "indexed": true,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "address",
          "_isParamType": true
        },
        {
          "name": "operator",
          "type": "address",
          "indexed": true,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "address",
          "_isParamType": true
        },
        {
          "name": "approved",
          "type": "bool",
          "indexed": false,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "bool",
          "_isParamType": true
        }
      ],
      "type": "event",
      "_isFragment": true
    },
    {
      "name": "Transfer",
      "anonymous": false,
      "inputs": [
        {
          "name": "from",
          "type": "address",
          "indexed": true,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "address",
          "_isParamType": true
        },
        {
          "name": "to",
          "type": "address",
          "indexed": true,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "address",
          "_isParamType": true
        },
        {
          "name": "tokenId",
          "type": "uint256",
          "indexed": true,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "uint256",
          "_isParamType": true
        }
      ],
      "type": "event",
      "_isFragment": true
    },
    {
      "type": "function",
      "name": "approve",
      "constant": false,
      "inputs": [
        {
          "name": "to",
          "type": "address",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "address",
          "_isParamType": true
        },
        {
          "name": "tokenId",
          "type": "uint256",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "uint256",
          "_isParamType": true
        }
      ],
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "gas": null,
      "_isFragment": true
    },
    {
      "type": "function",
      "name": "balanceOf",
      "constant": true,
      "inputs": [
        {
          "name": "owner",
          "type": "address",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "address",
          "_isParamType": true
        }
      ],
      "outputs": [
        {
          "name": null,
          "type": "uint256",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "uint256",
          "_isParamType": true
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "gas": null,
      "_isFragment": true
    },
    {
      "type": "function",
      "name": "baseURI",
      "constant": true,
      "inputs": [],
      "outputs": [
        {
          "name": null,
          "type": "string",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "string",
          "_isParamType": true
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "gas": null,
      "_isFragment": true
    },
    {
      "type": "function",
      "name": "getApproved",
      "constant": true,
      "inputs": [
        {
          "name": "tokenId",
          "type": "uint256",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "uint256",
          "_isParamType": true
        }
      ],
      "outputs": [
        {
          "name": null,
          "type": "address",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "address",
          "_isParamType": true
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "gas": null,
      "_isFragment": true
    },
    {
      "type": "function",
      "name": "isApprovedForAll",
      "constant": true,
      "inputs": [
        {
          "name": "owner",
          "type": "address",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "address",
          "_isParamType": true
        },
        {
          "name": "operator",
          "type": "address",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "address",
          "_isParamType": true
        }
      ],
      "outputs": [
        {
          "name": null,
          "type": "bool",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "bool",
          "_isParamType": true
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "gas": null,
      "_isFragment": true
    },
    {
      "type": "function",
      "name": "name",
      "constant": true,
      "inputs": [],
      "outputs": [
        {
          "name": null,
          "type": "string",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "string",
          "_isParamType": true
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "gas": null,
      "_isFragment": true
    },
    {
      "type": "function",
      "name": "ownerOf",
      "constant": true,
      "inputs": [
        {
          "name": "tokenId",
          "type": "uint256",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "uint256",
          "_isParamType": true
        }
      ],
      "outputs": [
        {
          "name": null,
          "type": "address",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "address",
          "_isParamType": true
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "gas": null,
      "_isFragment": true
    },
    {
      "type": "function",
      "name": "safeTransferFrom",
      "constant": false,
      "inputs": [
        {
          "name": "from",
          "type": "address",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "address",
          "_isParamType": true
        },
        {
          "name": "to",
          "type": "address",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "address",
          "_isParamType": true
        },
        {
          "name": "tokenId",
          "type": "uint256",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "uint256",
          "_isParamType": true
        }
      ],
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "gas": null,
      "_isFragment": true
    },
    {
      "type": "function",
      "name": "safeTransferFrom",
      "constant": false,
      "inputs": [
        {
          "name": "from",
          "type": "address",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "address",
          "_isParamType": true
        },
        {
          "name": "to",
          "type": "address",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "address",
          "_isParamType": true
        },
        {
          "name": "tokenId",
          "type": "uint256",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "uint256",
          "_isParamType": true
        },
        {
          "name": "_data",
          "type": "bytes",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "bytes",
          "_isParamType": true
        }
      ],
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "gas": null,
      "_isFragment": true
    },
    {
      "type": "function",
      "name": "setApprovalForAll",
      "constant": false,
      "inputs": [
        {
          "name": "operator",
          "type": "address",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "address",
          "_isParamType": true
        },
        {
          "name": "approved",
          "type": "bool",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "bool",
          "_isParamType": true
        }
      ],
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "gas": null,
      "_isFragment": true
    },
    {
      "type": "function",
      "name": "supportsInterface",
      "constant": true,
      "inputs": [
        {
          "name": "interfaceId",
          "type": "bytes4",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "bytes4",
          "_isParamType": true
        }
      ],
      "outputs": [
        {
          "name": null,
          "type": "bool",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "bool",
          "_isParamType": true
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "gas": null,
      "_isFragment": true
    },
    {
      "type": "function",
      "name": "symbol",
      "constant": true,
      "inputs": [],
      "outputs": [
        {
          "name": null,
          "type": "string",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "string",
          "_isParamType": true
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "gas": null,
      "_isFragment": true
    },
    {
      "type": "function",
      "name": "tokenByIndex",
      "constant": true,
      "inputs": [
        {
          "name": "index",
          "type": "uint256",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "uint256",
          "_isParamType": true
        }
      ],
      "outputs": [
        {
          "name": null,
          "type": "uint256",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "uint256",
          "_isParamType": true
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "gas": null,
      "_isFragment": true
    },
    {
      "type": "function",
      "name": "tokenOfOwnerByIndex",
      "constant": true,
      "inputs": [
        {
          "name": "owner",
          "type": "address",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "address",
          "_isParamType": true
        },
        {
          "name": "index",
          "type": "uint256",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "uint256",
          "_isParamType": true
        }
      ],
      "outputs": [
        {
          "name": null,
          "type": "uint256",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "uint256",
          "_isParamType": true
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "gas": null,
      "_isFragment": true
    },
    {
      "type": "function",
      "name": "tokenURI",
      "constant": true,
      "inputs": [
        {
          "name": "tokenId",
          "type": "uint256",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "uint256",
          "_isParamType": true
        }
      ],
      "outputs": [
        {
          "name": null,
          "type": "string",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "string",
          "_isParamType": true
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "gas": null,
      "_isFragment": true
    },
    {
      "type": "function",
      "name": "totalSupply",
      "constant": true,
      "inputs": [],
      "outputs": [
        {
          "name": null,
          "type": "uint256",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "uint256",
          "_isParamType": true
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "gas": null,
      "_isFragment": true
    },
    {
      "type": "function",
      "name": "transferFrom",
      "constant": false,
      "inputs": [
        {
          "name": "from",
          "type": "address",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "address",
          "_isParamType": true
        },
        {
          "name": "to",
          "type": "address",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "address",
          "_isParamType": true
        },
        {
          "name": "tokenId",
          "type": "uint256",
          "indexed": null,
          "components": null,
          "arrayLength": null,
          "arrayChildren": null,
          "baseType": "uint256",
          "_isParamType": true
        }
      ],
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "gas": null,
      "_isFragment": true
    }
  ]
}

