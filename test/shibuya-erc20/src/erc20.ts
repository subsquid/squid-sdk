import {Abi, Bytes, encodeCall, decodeResult} from "@subsquid/ink-abi"

export const metadata = {
    "source": {
        "hash": "0xe2c7d139a0e643e2cc621cfdba430ce101d615115dba61bdf9e3265267c8192f",
        "language": "ink! 5.0.0",
        "compiler": "rustc 1.76.0",
        "build_info": {
            "build_mode": "Release",
            "cargo_contract_version": "4.1.1",
            "rust_toolchain": "stable-aarch64-apple-darwin",
            "wasm_opt_settings": {
                "keep_debug_symbols": false,
                "optimization_passes": "Z"
            }
        }
    },
    "contract": {
        "name": "erc20",
        "version": "5.0.0",
        "authors": [
            "Parity Technologies <admin@parity.io>"
        ]
    },
    "image": null,
    "spec": {
        "constructors": [
            {
                "args": [
                    {
                        "label": "total_supply",
                        "type": {
                            "displayName": [
                                "Balance"
                            ],
                            "type": 0
                        }
                    }
                ],
                "default": false,
                "docs": [
                    "Creates a new ERC-20 contract with the specified initial supply."
                ],
                "label": "new",
                "payable": false,
                "returnType": {
                    "displayName": [
                        "ink_primitives",
                        "ConstructorResult"
                    ],
                    "type": 14
                },
                "selector": "0x9bae9d5e"
            }
        ],
        "docs": [],
        "environment": {
            "accountId": {
                "displayName": [
                    "AccountId"
                ],
                "type": 2
            },
            "balance": {
                "displayName": [
                    "Balance"
                ],
                "type": 0
            },
            "blockNumber": {
                "displayName": [
                    "BlockNumber"
                ],
                "type": 23
            },
            "chainExtension": {
                "displayName": [
                    "ChainExtension"
                ],
                "type": 24
            },
            "hash": {
                "displayName": [
                    "Hash"
                ],
                "type": 21
            },
            "maxEventTopics": 4,
            "staticBufferSize": 16384,
            "timestamp": {
                "displayName": [
                    "Timestamp"
                ],
                "type": 22
            }
        },
        "events": [
            {
                "args": [
                    {
                        "docs": [],
                        "indexed": true,
                        "label": "from",
                        "type": {
                            "displayName": [
                                "Option"
                            ],
                            "type": 20
                        }
                    },
                    {
                        "docs": [],
                        "indexed": true,
                        "label": "to",
                        "type": {
                            "displayName": [
                                "Option"
                            ],
                            "type": 20
                        }
                    },
                    {
                        "docs": [],
                        "indexed": false,
                        "label": "value",
                        "type": {
                            "displayName": [
                                "Balance"
                            ],
                            "type": 0
                        }
                    }
                ],
                "docs": [
                    "Event emitted when a token transfer occurs."
                ],
                "label": "Transfer",
                "module_path": "erc20::erc20",
                "signature_topic": null
            },
            {
                "args": [
                    {
                        "docs": [],
                        "indexed": true,
                        "label": "owner",
                        "type": {
                            "displayName": [
                                "AccountId"
                            ],
                            "type": 2
                        }
                    },
                    {
                        "docs": [],
                        "indexed": true,
                        "label": "spender",
                        "type": {
                            "displayName": [
                                "AccountId"
                            ],
                            "type": 2
                        }
                    },
                    {
                        "docs": [],
                        "indexed": false,
                        "label": "value",
                        "type": {
                            "displayName": [
                                "Balance"
                            ],
                            "type": 0
                        }
                    }
                ],
                "docs": [
                    "Event emitted when an approval occurs that `spender` is allowed to withdraw",
                    "up to the amount of `value` tokens from `owner`."
                ],
                "label": "Approval",
                "module_path": "erc20::erc20",
                "signature_topic": "0x1a35e726f5feffda199144f6097b2ba23713e549bfcbe090c0981e3bcdfbcc1d"
            }
        ],
        "lang_error": {
            "displayName": [
                "ink",
                "LangError"
            ],
            "type": 15
        },
        "messages": [
            {
                "args": [],
                "default": false,
                "docs": [
                    " Returns the total token supply."
                ],
                "label": "total_supply",
                "mutates": false,
                "payable": false,
                "returnType": {
                    "displayName": [
                        "ink",
                        "MessageResult"
                    ],
                    "type": 16
                },
                "selector": "0xdb6375a8"
            },
            {
                "args": [
                    {
                        "label": "owner",
                        "type": {
                            "displayName": [
                                "AccountId"
                            ],
                            "type": 2
                        }
                    }
                ],
                "default": false,
                "docs": [
                    " Returns the account balance for the specified `owner`.",
                    "",
                    " Returns `0` if the account is non-existent."
                ],
                "label": "balance_of",
                "mutates": false,
                "payable": false,
                "returnType": {
                    "displayName": [
                        "ink",
                        "MessageResult"
                    ],
                    "type": 16
                },
                "selector": "0x0f755a56"
            },
            {
                "args": [
                    {
                        "label": "owner",
                        "type": {
                            "displayName": [
                                "AccountId"
                            ],
                            "type": 2
                        }
                    },
                    {
                        "label": "spender",
                        "type": {
                            "displayName": [
                                "AccountId"
                            ],
                            "type": 2
                        }
                    }
                ],
                "default": false,
                "docs": [
                    " Returns the amount which `spender` is still allowed to withdraw from `owner`.",
                    "",
                    " Returns `0` if no allowance has been set."
                ],
                "label": "allowance",
                "mutates": false,
                "payable": false,
                "returnType": {
                    "displayName": [
                        "ink",
                        "MessageResult"
                    ],
                    "type": 16
                },
                "selector": "0x6a00165e"
            },
            {
                "args": [
                    {
                        "label": "to",
                        "type": {
                            "displayName": [
                                "AccountId"
                            ],
                            "type": 2
                        }
                    },
                    {
                        "label": "value",
                        "type": {
                            "displayName": [
                                "Balance"
                            ],
                            "type": 0
                        }
                    }
                ],
                "default": false,
                "docs": [
                    " Transfers `value` amount of tokens from the caller's account to account `to`.",
                    "",
                    " On success a `Transfer` event is emitted.",
                    "",
                    " # Errors",
                    "",
                    " Returns `InsufficientBalance` error if there are not enough tokens on",
                    " the caller's account balance."
                ],
                "label": "transfer",
                "mutates": true,
                "payable": false,
                "returnType": {
                    "displayName": [
                        "ink",
                        "MessageResult"
                    ],
                    "type": 17
                },
                "selector": "0x84a15da1"
            },
            {
                "args": [
                    {
                        "label": "spender",
                        "type": {
                            "displayName": [
                                "AccountId"
                            ],
                            "type": 2
                        }
                    },
                    {
                        "label": "value",
                        "type": {
                            "displayName": [
                                "Balance"
                            ],
                            "type": 0
                        }
                    }
                ],
                "default": false,
                "docs": [
                    " Allows `spender` to withdraw from the caller's account multiple times, up to",
                    " the `value` amount.",
                    "",
                    " If this function is called again it overwrites the current allowance with",
                    " `value`.",
                    "",
                    " An `Approval` event is emitted."
                ],
                "label": "approve",
                "mutates": true,
                "payable": false,
                "returnType": {
                    "displayName": [
                        "ink",
                        "MessageResult"
                    ],
                    "type": 17
                },
                "selector": "0x681266a0"
            },
            {
                "args": [
                    {
                        "label": "from",
                        "type": {
                            "displayName": [
                                "AccountId"
                            ],
                            "type": 2
                        }
                    },
                    {
                        "label": "to",
                        "type": {
                            "displayName": [
                                "AccountId"
                            ],
                            "type": 2
                        }
                    },
                    {
                        "label": "value",
                        "type": {
                            "displayName": [
                                "Balance"
                            ],
                            "type": 0
                        }
                    }
                ],
                "default": false,
                "docs": [
                    " Transfers `value` tokens on the behalf of `from` to the account `to`.",
                    "",
                    " This can be used to allow a contract to transfer tokens on ones behalf and/or",
                    " to charge fees in sub-currencies, for example.",
                    "",
                    " On success a `Transfer` event is emitted.",
                    "",
                    " # Errors",
                    "",
                    " Returns `InsufficientAllowance` error if there are not enough tokens allowed",
                    " for the caller to withdraw from `from`.",
                    "",
                    " Returns `InsufficientBalance` error if there are not enough tokens on",
                    " the account balance of `from`."
                ],
                "label": "transfer_from",
                "mutates": true,
                "payable": false,
                "returnType": {
                    "displayName": [
                        "ink",
                        "MessageResult"
                    ],
                    "type": 17
                },
                "selector": "0x0b396f18"
            }
        ]
    },
    "storage": {
        "root": {
            "layout": {
                "struct": {
                    "fields": [
                        {
                            "layout": {
                                "leaf": {
                                    "key": "0x00000000",
                                    "ty": 0
                                }
                            },
                            "name": "total_supply"
                        },
                        {
                            "layout": {
                                "root": {
                                    "layout": {
                                        "leaf": {
                                            "key": "0xe7dc2326",
                                            "ty": 0
                                        }
                                    },
                                    "root_key": "0xe7dc2326",
                                    "ty": 1
                                }
                            },
                            "name": "balances"
                        },
                        {
                            "layout": {
                                "root": {
                                    "layout": {
                                        "leaf": {
                                            "key": "0xb721a0ec",
                                            "ty": 0
                                        }
                                    },
                                    "root_key": "0xb721a0ec",
                                    "ty": 9
                                }
                            },
                            "name": "allowances"
                        }
                    ],
                    "name": "Erc20"
                }
            },
            "root_key": "0x00000000",
            "ty": 13
        }
    },
    "types": [
        {
            "id": 0,
            "type": {
                "def": {
                    "primitive": "u128"
                }
            }
        },
        {
            "id": 1,
            "type": {
                "def": {
                    "composite": {}
                },
                "params": [
                    {
                        "name": "K",
                        "type": 2
                    },
                    {
                        "name": "V",
                        "type": 0
                    },
                    {
                        "name": "KeyType",
                        "type": 5
                    }
                ],
                "path": [
                    "ink_storage",
                    "lazy",
                    "mapping",
                    "Mapping"
                ]
            }
        },
        {
            "id": 2,
            "type": {
                "def": {
                    "composite": {
                        "fields": [
                            {
                                "type": 3,
                                "typeName": "[u8; 32]"
                            }
                        ]
                    }
                },
                "path": [
                    "ink_primitives",
                    "types",
                    "AccountId"
                ]
            }
        },
        {
            "id": 3,
            "type": {
                "def": {
                    "array": {
                        "len": 32,
                        "type": 4
                    }
                }
            }
        },
        {
            "id": 4,
            "type": {
                "def": {
                    "primitive": "u8"
                }
            }
        },
        {
            "id": 5,
            "type": {
                "def": {
                    "composite": {}
                },
                "params": [
                    {
                        "name": "L",
                        "type": 6
                    },
                    {
                        "name": "R",
                        "type": 7
                    }
                ],
                "path": [
                    "ink_storage_traits",
                    "impls",
                    "ResolverKey"
                ]
            }
        },
        {
            "id": 6,
            "type": {
                "def": {
                    "composite": {}
                },
                "path": [
                    "ink_storage_traits",
                    "impls",
                    "AutoKey"
                ]
            }
        },
        {
            "id": 7,
            "type": {
                "def": {
                    "composite": {}
                },
                "params": [
                    {
                        "name": "ParentKey",
                        "type": 8
                    }
                ],
                "path": [
                    "ink_storage_traits",
                    "impls",
                    "ManualKey"
                ]
            }
        },
        {
            "id": 8,
            "type": {
                "def": {
                    "tuple": []
                }
            }
        },
        {
            "id": 9,
            "type": {
                "def": {
                    "composite": {}
                },
                "params": [
                    {
                        "name": "K",
                        "type": 10
                    },
                    {
                        "name": "V",
                        "type": 0
                    },
                    {
                        "name": "KeyType",
                        "type": 11
                    }
                ],
                "path": [
                    "ink_storage",
                    "lazy",
                    "mapping",
                    "Mapping"
                ]
            }
        },
        {
            "id": 10,
            "type": {
                "def": {
                    "tuple": [
                        2,
                        2
                    ]
                }
            }
        },
        {
            "id": 11,
            "type": {
                "def": {
                    "composite": {}
                },
                "params": [
                    {
                        "name": "L",
                        "type": 6
                    },
                    {
                        "name": "R",
                        "type": 12
                    }
                ],
                "path": [
                    "ink_storage_traits",
                    "impls",
                    "ResolverKey"
                ]
            }
        },
        {
            "id": 12,
            "type": {
                "def": {
                    "composite": {}
                },
                "params": [
                    {
                        "name": "ParentKey",
                        "type": 8
                    }
                ],
                "path": [
                    "ink_storage_traits",
                    "impls",
                    "ManualKey"
                ]
            }
        },
        {
            "id": 13,
            "type": {
                "def": {
                    "composite": {
                        "fields": [
                            {
                                "name": "total_supply",
                                "type": 0,
                                "typeName": "<Balance as::ink::storage::traits::AutoStorableHint<::ink::\nstorage::traits::ManualKey<375105693u32, ()>,>>::Type"
                            },
                            {
                                "name": "balances",
                                "type": 1,
                                "typeName": "<Mapping<AccountId, Balance> as::ink::storage::traits::\nAutoStorableHint<::ink::storage::traits::ManualKey<639884519u32, ()\n>,>>::Type"
                            },
                            {
                                "name": "allowances",
                                "type": 9,
                                "typeName": "<Mapping<(AccountId, AccountId), Balance> as::ink::storage::traits\n::AutoStorableHint<::ink::storage::traits::ManualKey<\n3969917367u32, ()>,>>::Type"
                            }
                        ]
                    }
                },
                "path": [
                    "erc20",
                    "erc20",
                    "Erc20"
                ]
            }
        },
        {
            "id": 14,
            "type": {
                "def": {
                    "variant": {
                        "variants": [
                            {
                                "fields": [
                                    {
                                        "type": 8
                                    }
                                ],
                                "index": 0,
                                "name": "Ok"
                            },
                            {
                                "fields": [
                                    {
                                        "type": 15
                                    }
                                ],
                                "index": 1,
                                "name": "Err"
                            }
                        ]
                    }
                },
                "params": [
                    {
                        "name": "T",
                        "type": 8
                    },
                    {
                        "name": "E",
                        "type": 15
                    }
                ],
                "path": [
                    "Result"
                ]
            }
        },
        {
            "id": 15,
            "type": {
                "def": {
                    "variant": {
                        "variants": [
                            {
                                "index": 1,
                                "name": "CouldNotReadInput"
                            }
                        ]
                    }
                },
                "path": [
                    "ink_primitives",
                    "LangError"
                ]
            }
        },
        {
            "id": 16,
            "type": {
                "def": {
                    "variant": {
                        "variants": [
                            {
                                "fields": [
                                    {
                                        "type": 0
                                    }
                                ],
                                "index": 0,
                                "name": "Ok"
                            },
                            {
                                "fields": [
                                    {
                                        "type": 15
                                    }
                                ],
                                "index": 1,
                                "name": "Err"
                            }
                        ]
                    }
                },
                "params": [
                    {
                        "name": "T",
                        "type": 0
                    },
                    {
                        "name": "E",
                        "type": 15
                    }
                ],
                "path": [
                    "Result"
                ]
            }
        },
        {
            "id": 17,
            "type": {
                "def": {
                    "variant": {
                        "variants": [
                            {
                                "fields": [
                                    {
                                        "type": 18
                                    }
                                ],
                                "index": 0,
                                "name": "Ok"
                            },
                            {
                                "fields": [
                                    {
                                        "type": 15
                                    }
                                ],
                                "index": 1,
                                "name": "Err"
                            }
                        ]
                    }
                },
                "params": [
                    {
                        "name": "T",
                        "type": 18
                    },
                    {
                        "name": "E",
                        "type": 15
                    }
                ],
                "path": [
                    "Result"
                ]
            }
        },
        {
            "id": 18,
            "type": {
                "def": {
                    "variant": {
                        "variants": [
                            {
                                "fields": [
                                    {
                                        "type": 8
                                    }
                                ],
                                "index": 0,
                                "name": "Ok"
                            },
                            {
                                "fields": [
                                    {
                                        "type": 19
                                    }
                                ],
                                "index": 1,
                                "name": "Err"
                            }
                        ]
                    }
                },
                "params": [
                    {
                        "name": "T",
                        "type": 8
                    },
                    {
                        "name": "E",
                        "type": 19
                    }
                ],
                "path": [
                    "Result"
                ]
            }
        },
        {
            "id": 19,
            "type": {
                "def": {
                    "variant": {
                        "variants": [
                            {
                                "index": 0,
                                "name": "InsufficientBalance"
                            },
                            {
                                "index": 1,
                                "name": "InsufficientAllowance"
                            }
                        ]
                    }
                },
                "path": [
                    "erc20",
                    "erc20",
                    "Error"
                ]
            }
        },
        {
            "id": 20,
            "type": {
                "def": {
                    "variant": {
                        "variants": [
                            {
                                "index": 0,
                                "name": "None"
                            },
                            {
                                "fields": [
                                    {
                                        "type": 2
                                    }
                                ],
                                "index": 1,
                                "name": "Some"
                            }
                        ]
                    }
                },
                "params": [
                    {
                        "name": "T",
                        "type": 2
                    }
                ],
                "path": [
                    "Option"
                ]
            }
        },
        {
            "id": 21,
            "type": {
                "def": {
                    "composite": {
                        "fields": [
                            {
                                "type": 3,
                                "typeName": "[u8; 32]"
                            }
                        ]
                    }
                },
                "path": [
                    "ink_primitives",
                    "types",
                    "Hash"
                ]
            }
        },
        {
            "id": 22,
            "type": {
                "def": {
                    "primitive": "u64"
                }
            }
        },
        {
            "id": 23,
            "type": {
                "def": {
                    "primitive": "u32"
                }
            }
        },
        {
            "id": 24,
            "type": {
                "def": {
                    "variant": {}
                },
                "path": [
                    "ink_env",
                    "types",
                    "NoChainExtension"
                ]
            }
        }
    ],
    "version": 5
}

const _abi = new Abi(metadata)

export function decodeEvent(bytes: Bytes, topics: Bytes[]): Event {
    return _abi.decodeEvent(bytes, topics)
}

export function decodeMessage(bytes: Bytes): Message {
    return _abi.decodeMessage(bytes)
}

export function decodeConstructor(bytes: Bytes): Constructor {
    return _abi.decodeConstructor(bytes)
}

export interface Chain {
    rpc: {
        call<T=any>(method: string, params?: unknown[]): Promise<T>
    }
}

export interface ChainContext {
    _chain: Chain
}

export class Contract {
    constructor(private ctx: ChainContext, private address: Bytes, private blockHash?: Bytes) { }

    total_supply(): Promise<Result<Balance, LangError>> {
        return this.stateCall('0xdb6375a8', [])
    }

    balance_of(owner: AccountId): Promise<Result<Balance, LangError>> {
        return this.stateCall('0x0f755a56', [owner])
    }

    allowance(owner: AccountId, spender: AccountId): Promise<Result<Balance, LangError>> {
        return this.stateCall('0x6a00165e', [owner, spender])
    }

    private async stateCall<T>(selector: string, args: any[]): Promise<T> {
        let input = _abi.encodeMessageInput(selector, args)
        let data = encodeCall(this.address, input)
        let result = await this.ctx._chain.rpc.call('state_call', ['ContractsApi_call', data, this.blockHash])
        let value = decodeResult(result)
        return _abi.decodeMessageOutput(selector, value)
    }
}

export type AccountId = Bytes

export type LangError = LangError_CouldNotReadInput

export interface LangError_CouldNotReadInput {
    __kind: 'CouldNotReadInput'
}

export type Balance = bigint

export type Constructor = Constructor_new

/**
 * Creates a new ERC-20 contract with the specified initial supply.
 */
export interface Constructor_new {
    __kind: 'new'
    totalSupply: Balance
}

export type Message = Message_allowance | Message_approve | Message_balance_of | Message_total_supply | Message_transfer | Message_transfer_from

/**
 *  Returns the amount which `spender` is still allowed to withdraw from `owner`.
 * 
 *  Returns `0` if no allowance has been set.
 */
export interface Message_allowance {
    __kind: 'allowance'
    owner: AccountId
    spender: AccountId
}

/**
 *  Allows `spender` to withdraw from the caller's account multiple times, up to
 *  the `value` amount.
 * 
 *  If this function is called again it overwrites the current allowance with
 *  `value`.
 * 
 *  An `Approval` event is emitted.
 */
export interface Message_approve {
    __kind: 'approve'
    spender: AccountId
    value: Balance
}

/**
 *  Returns the account balance for the specified `owner`.
 * 
 *  Returns `0` if the account is non-existent.
 */
export interface Message_balance_of {
    __kind: 'balance_of'
    owner: AccountId
}

/**
 *  Returns the total token supply.
 */
export interface Message_total_supply {
    __kind: 'total_supply'
}

/**
 *  Transfers `value` amount of tokens from the caller's account to account `to`.
 * 
 *  On success a `Transfer` event is emitted.
 * 
 *  # Errors
 * 
 *  Returns `InsufficientBalance` error if there are not enough tokens on
 *  the caller's account balance.
 */
export interface Message_transfer {
    __kind: 'transfer'
    to: AccountId
    value: Balance
}

/**
 *  Transfers `value` tokens on the behalf of `from` to the account `to`.
 * 
 *  This can be used to allow a contract to transfer tokens on ones behalf and/or
 *  to charge fees in sub-currencies, for example.
 * 
 *  On success a `Transfer` event is emitted.
 * 
 *  # Errors
 * 
 *  Returns `InsufficientAllowance` error if there are not enough tokens allowed
 *  for the caller to withdraw from `from`.
 * 
 *  Returns `InsufficientBalance` error if there are not enough tokens on
 *  the account balance of `from`.
 */
export interface Message_transfer_from {
    __kind: 'transfer_from'
    from: AccountId
    to: AccountId
    value: Balance
}

export type Event = Event_Approval | Event_Transfer

export interface Event_Approval {
    __kind: 'Approval'
    owner: AccountId
    spender: AccountId
    value: Balance
}

export interface Event_Transfer {
    __kind: 'Transfer'
    from?: (AccountId | undefined)
    to?: (AccountId | undefined)
    value: Balance
}

export type Result<T, E> = {__kind: 'Ok', value: T} | {__kind: 'Err', value: E}
