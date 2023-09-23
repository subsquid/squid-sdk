import {Abi, Bytes, encodeCall, decodeResult} from '@subsquid/ink-abi'
import * as sts from '@subsquid/substrate-runtime/lib/sts'

export const metadata = {
  "source": {
    "hash": "0x58e808d79134018aeae9a70082be8562e6970a3e4c292dbafbf5d4c05df01521",
    "language": "ink! 3.4.0",
    "compiler": "rustc 1.65.0-nightly"
  },
  "contract": {
    "name": "psp22_token",
    "version": "2.1.0",
    "authors": [
      "Supercolony <green.baneling@supercolony.net>"
    ]
  },
  "V3": {
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
            },
            {
              "label": "name",
              "type": {
                "displayName": [
                  "Option"
                ],
                "type": 13
              }
            },
            {
              "label": "symbol",
              "type": {
                "displayName": [
                  "Option"
                ],
                "type": 13
              }
            },
            {
              "label": "decimals",
              "type": {
                "displayName": [
                  "u8"
                ],
                "type": 4
              }
            }
          ],
          "docs": [],
          "label": "new",
          "payable": false,
          "selector": "0x9bae9d5e"
        }
      ],
      "docs": [],
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
                "type": 16
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
                "type": 16
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
          "docs": [],
          "label": "Transfer"
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
          "docs": [],
          "label": "Approval"
        }
      ],
      "messages": [
        {
          "args": [
            {
              "label": "account",
              "type": {
                "displayName": [
                  "AccountId"
                ],
                "type": 2
              }
            },
            {
              "label": "amount",
              "type": {
                "displayName": [
                  "Balance"
                ],
                "type": 0
              }
            }
          ],
          "docs": [],
          "label": "mint",
          "mutates": true,
          "payable": false,
          "returnType": {
            "displayName": [
              "Result"
            ],
            "type": 14
          },
          "selector": "0xcfdd9aa2"
        },
        {
          "args": [
            {
              "label": "owner",
              "type": {
                "displayName": [
                  "psp22_external",
                  "AllowanceInput1"
                ],
                "type": 2
              }
            },
            {
              "label": "spender",
              "type": {
                "displayName": [
                  "psp22_external",
                  "AllowanceInput2"
                ],
                "type": 2
              }
            }
          ],
          "docs": [
            " Returns the amount which `spender` is still allowed to withdraw from `owner`.",
            "",
            " Returns `0` if no allowance has been set `0`."
          ],
          "label": "PSP22::allowance",
          "mutates": false,
          "payable": false,
          "returnType": {
            "displayName": [
              "psp22_external",
              "AllowanceOutput"
            ],
            "type": 0
          },
          "selector": "0x4d47d921"
        },
        {
          "args": [
            {
              "label": "spender",
              "type": {
                "displayName": [
                  "psp22_external",
                  "ApproveInput1"
                ],
                "type": 2
              }
            },
            {
              "label": "value",
              "type": {
                "displayName": [
                  "psp22_external",
                  "ApproveInput2"
                ],
                "type": 0
              }
            }
          ],
          "docs": [
            " Allows `spender` to withdraw from the caller's account multiple times, up to",
            " the `value` amount.",
            "",
            " If this function is called again it overwrites the current allowance with `value`.",
            "",
            " An `Approval` event is emitted.",
            "",
            " # Errors",
            "",
            " Returns `ZeroSenderAddress` error if sender's address is zero.",
            "",
            " Returns `ZeroRecipientAddress` error if recipient's address is zero."
          ],
          "label": "PSP22::approve",
          "mutates": true,
          "payable": false,
          "returnType": {
            "displayName": [
              "psp22_external",
              "ApproveOutput"
            ],
            "type": 14
          },
          "selector": "0xb20f1bbd"
        },
        {
          "args": [
            {
              "label": "spender",
              "type": {
                "displayName": [
                  "psp22_external",
                  "IncreaseAllowanceInput1"
                ],
                "type": 2
              }
            },
            {
              "label": "delta_value",
              "type": {
                "displayName": [
                  "psp22_external",
                  "IncreaseAllowanceInput2"
                ],
                "type": 0
              }
            }
          ],
          "docs": [
            " Atomically increases the allowance granted to `spender` by the caller.",
            "",
            " An `Approval` event is emitted.",
            "",
            " # Errors",
            "",
            " Returns `ZeroSenderAddress` error if sender's address is zero.",
            "",
            " Returns `ZeroRecipientAddress` error if recipient's address is zero."
          ],
          "label": "PSP22::increase_allowance",
          "mutates": true,
          "payable": false,
          "returnType": {
            "displayName": [
              "psp22_external",
              "IncreaseAllowanceOutput"
            ],
            "type": 14
          },
          "selector": "0x96d6b57a"
        },
        {
          "args": [
            {
              "label": "from",
              "type": {
                "displayName": [
                  "psp22_external",
                  "TransferFromInput1"
                ],
                "type": 2
              }
            },
            {
              "label": "to",
              "type": {
                "displayName": [
                  "psp22_external",
                  "TransferFromInput2"
                ],
                "type": 2
              }
            },
            {
              "label": "value",
              "type": {
                "displayName": [
                  "psp22_external",
                  "TransferFromInput3"
                ],
                "type": 0
              }
            },
            {
              "label": "data",
              "type": {
                "displayName": [
                  "psp22_external",
                  "TransferFromInput4"
                ],
                "type": 12
              }
            }
          ],
          "docs": [
            " Transfers `value` tokens on the behalf of `from` to the account `to`",
            " with additional `data` in unspecified format.",
            "",
            " This can be used to allow a contract to transfer tokens on ones behalf and/or",
            " to charge fees in sub-currencies, for example.",
            "",
            " On success a `Transfer` and `Approval` events are emitted.",
            "",
            " # Errors",
            "",
            " Returns `InsufficientAllowance` error if there are not enough tokens allowed",
            " for the caller to withdraw from `from`.",
            "",
            " Returns `InsufficientBalance` error if there are not enough tokens on",
            " the the account Balance of `from`.",
            "",
            " Returns `ZeroSenderAddress` error if sender's address is zero.",
            "",
            " Returns `ZeroRecipientAddress` error if recipient's address is zero."
          ],
          "label": "PSP22::transfer_from",
          "mutates": true,
          "payable": false,
          "returnType": {
            "displayName": [
              "psp22_external",
              "TransferFromOutput"
            ],
            "type": 14
          },
          "selector": "0x54b3c76e"
        },
        {
          "args": [],
          "docs": [
            " Returns the total token supply."
          ],
          "label": "PSP22::total_supply",
          "mutates": false,
          "payable": false,
          "returnType": {
            "displayName": [
              "psp22_external",
              "TotalSupplyOutput"
            ],
            "type": 0
          },
          "selector": "0x162df8c2"
        },
        {
          "args": [
            {
              "label": "to",
              "type": {
                "displayName": [
                  "psp22_external",
                  "TransferInput1"
                ],
                "type": 2
              }
            },
            {
              "label": "value",
              "type": {
                "displayName": [
                  "psp22_external",
                  "TransferInput2"
                ],
                "type": 0
              }
            },
            {
              "label": "data",
              "type": {
                "displayName": [
                  "psp22_external",
                  "TransferInput3"
                ],
                "type": 12
              }
            }
          ],
          "docs": [
            " Transfers `value` amount of tokens from the caller's account to account `to`",
            " with additional `data` in unspecified format.",
            "",
            " On success a `Transfer` event is emitted.",
            "",
            " # Errors",
            "",
            " Returns `InsufficientBalance` error if there are not enough tokens on",
            " the caller's account Balance.",
            "",
            " Returns `ZeroSenderAddress` error if sender's address is zero.",
            "",
            " Returns `ZeroRecipientAddress` error if recipient's address is zero."
          ],
          "label": "PSP22::transfer",
          "mutates": true,
          "payable": false,
          "returnType": {
            "displayName": [
              "psp22_external",
              "TransferOutput"
            ],
            "type": 14
          },
          "selector": "0xdb20f9f5"
        },
        {
          "args": [
            {
              "label": "spender",
              "type": {
                "displayName": [
                  "psp22_external",
                  "DecreaseAllowanceInput1"
                ],
                "type": 2
              }
            },
            {
              "label": "delta_value",
              "type": {
                "displayName": [
                  "psp22_external",
                  "DecreaseAllowanceInput2"
                ],
                "type": 0
              }
            }
          ],
          "docs": [
            " Atomically decreases the allowance granted to `spender` by the caller.",
            "",
            " An `Approval` event is emitted.",
            "",
            " # Errors",
            "",
            " Returns `InsufficientAllowance` error if there are not enough tokens allowed",
            " by owner for `spender`.",
            "",
            " Returns `ZeroSenderAddress` error if sender's address is zero.",
            "",
            " Returns `ZeroRecipientAddress` error if recipient's address is zero."
          ],
          "label": "PSP22::decrease_allowance",
          "mutates": true,
          "payable": false,
          "returnType": {
            "displayName": [
              "psp22_external",
              "DecreaseAllowanceOutput"
            ],
            "type": 14
          },
          "selector": "0xfecb57d5"
        },
        {
          "args": [
            {
              "label": "owner",
              "type": {
                "displayName": [
                  "psp22_external",
                  "BalanceOfInput1"
                ],
                "type": 2
              }
            }
          ],
          "docs": [
            " Returns the account Balance for the specified `owner`.",
            "",
            " Returns `0` if the account is non-existent."
          ],
          "label": "PSP22::balance_of",
          "mutates": false,
          "payable": false,
          "returnType": {
            "displayName": [
              "psp22_external",
              "BalanceOfOutput"
            ],
            "type": 0
          },
          "selector": "0x6568382f"
        },
        {
          "args": [],
          "docs": [
            " Returns the token decimals."
          ],
          "label": "PSP22Metadata::token_decimals",
          "mutates": false,
          "payable": false,
          "returnType": {
            "displayName": [
              "psp22metadata_external",
              "TokenDecimalsOutput"
            ],
            "type": 4
          },
          "selector": "0x7271b782"
        },
        {
          "args": [],
          "docs": [
            " Returns the token name."
          ],
          "label": "PSP22Metadata::token_name",
          "mutates": false,
          "payable": false,
          "returnType": {
            "displayName": [
              "psp22metadata_external",
              "TokenNameOutput"
            ],
            "type": 13
          },
          "selector": "0x3d261bd4"
        },
        {
          "args": [],
          "docs": [
            " Returns the token symbol."
          ],
          "label": "PSP22Metadata::token_symbol",
          "mutates": false,
          "payable": false,
          "returnType": {
            "displayName": [
              "psp22metadata_external",
              "TokenSymbolOutput"
            ],
            "type": 13
          },
          "selector": "0x34205be5"
        }
      ]
    },
    "storage": {
      "struct": {
        "fields": [
          {
            "layout": {
              "struct": {
                "fields": [
                  {
                    "layout": {
                      "cell": {
                        "key": "0xf232311200000000000000000000000000000000000000000000000000000000",
                        "ty": 0
                      }
                    },
                    "name": "supply"
                  },
                  {
                    "layout": {
                      "cell": {
                        "key": "0xf332311200000000000000000000000000000000000000000000000000000000",
                        "ty": 1
                      }
                    },
                    "name": "balances"
                  },
                  {
                    "layout": {
                      "cell": {
                        "key": "0xf432311200000000000000000000000000000000000000000000000000000000",
                        "ty": 7
                      }
                    },
                    "name": "allowances"
                  },
                  {
                    "layout": {
                      "enum": {
                        "dispatchKey": "0xf532311200000000000000000000000000000000000000000000000000000000",
                        "variants": {
                          "0": {
                            "fields": [
                              {
                                "layout": {
                                  "cell": {
                                    "key": "0xf632311200000000000000000000000000000000000000000000000000000000",
                                    "ty": 11
                                  }
                                },
                                "name": null
                              }
                            ]
                          },
                          "1": {
                            "fields": []
                          }
                        }
                      }
                    },
                    "name": "_reserved"
                  }
                ]
              }
            },
            "name": "psp22"
          },
          {
            "layout": {
              "struct": {
                "fields": [
                  {
                    "layout": {
                      "enum": {
                        "dispatchKey": "0x89ae8e4b00000000000000000000000000000000000000000000000000000000",
                        "variants": {
                          "0": {
                            "fields": [
                              {
                                "layout": {
                                  "cell": {
                                    "key": "0x8aae8e4b00000000000000000000000000000000000000000000000000000000",
                                    "ty": 12
                                  }
                                },
                                "name": null
                              }
                            ]
                          },
                          "1": {
                            "fields": []
                          }
                        }
                      }
                    },
                    "name": "name"
                  },
                  {
                    "layout": {
                      "enum": {
                        "dispatchKey": "0x8aae8e4b00000000000000000000000000000000000000000000000000000000",
                        "variants": {
                          "0": {
                            "fields": [
                              {
                                "layout": {
                                  "cell": {
                                    "key": "0x8bae8e4b00000000000000000000000000000000000000000000000000000000",
                                    "ty": 12
                                  }
                                },
                                "name": null
                              }
                            ]
                          },
                          "1": {
                            "fields": []
                          }
                        }
                      }
                    },
                    "name": "symbol"
                  },
                  {
                    "layout": {
                      "cell": {
                        "key": "0x8bae8e4b00000000000000000000000000000000000000000000000000000000",
                        "ty": 4
                      }
                    },
                    "name": "decimals"
                  },
                  {
                    "layout": {
                      "enum": {
                        "dispatchKey": "0x8cae8e4b00000000000000000000000000000000000000000000000000000000",
                        "variants": {
                          "0": {
                            "fields": [
                              {
                                "layout": {
                                  "cell": {
                                    "key": "0x8dae8e4b00000000000000000000000000000000000000000000000000000000",
                                    "ty": 11
                                  }
                                },
                                "name": null
                              }
                            ]
                          },
                          "1": {
                            "fields": []
                          }
                        }
                      }
                    },
                    "name": "_reserved"
                  }
                ]
              }
            },
            "name": "metadata"
          }
        ]
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
            "composite": {
              "fields": [
                {
                  "type": 5
                }
              ]
            }
          },
          "params": [
            {
              "name": "K",
              "type": 2
            },
            {
              "name": "V",
              "type": 0
            }
          ],
          "path": [
            "openbrush_lang",
            "storage",
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
            "ink_env",
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
            "sequence": {
              "type": 6
            }
          }
        }
      },
      {
        "id": 6,
        "type": {
          "def": {
            "tuple": [
              2,
              0
            ]
          }
        }
      },
      {
        "id": 7,
        "type": {
          "def": {
            "composite": {
              "fields": [
                {
                  "type": 9
                }
              ]
            }
          },
          "params": [
            {
              "name": "K",
              "type": 8
            },
            {
              "name": "V",
              "type": 0
            }
          ],
          "path": [
            "openbrush_lang",
            "storage",
            "mapping",
            "Mapping"
          ]
        }
      },
      {
        "id": 8,
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
        "id": 9,
        "type": {
          "def": {
            "sequence": {
              "type": 10
            }
          }
        }
      },
      {
        "id": 10,
        "type": {
          "def": {
            "tuple": [
              8,
              0
            ]
          }
        }
      },
      {
        "id": 11,
        "type": {
          "def": {
            "tuple": []
          }
        }
      },
      {
        "id": 12,
        "type": {
          "def": {
            "sequence": {
              "type": 4
            }
          }
        }
      },
      {
        "id": 13,
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
                      "type": 12
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
              "type": 12
            }
          ],
          "path": [
            "Option"
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
                      "type": 11
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
              "type": 11
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
                  "fields": [
                    {
                      "type": 12,
                      "typeName": "String"
                    }
                  ],
                  "index": 0,
                  "name": "Custom"
                },
                {
                  "index": 1,
                  "name": "InsufficientBalance"
                },
                {
                  "index": 2,
                  "name": "InsufficientAllowance"
                },
                {
                  "index": 3,
                  "name": "ZeroRecipientAddress"
                },
                {
                  "index": 4,
                  "name": "ZeroSenderAddress"
                },
                {
                  "fields": [
                    {
                      "type": 12,
                      "typeName": "String"
                    }
                  ],
                  "index": 5,
                  "name": "SafeTransferCheckFailed"
                }
              ]
            }
          },
          "path": [
            "openbrush_contracts",
            "traits",
            "errors",
            "psp22",
            "PSP22Error"
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
      }
    ]
  }
}

const _abi = new Abi(metadata)

export function decodeEvent(bytes: Bytes): Event {
    return _abi.decodeEvent(bytes)
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

    PSP22_allowance(owner: AccountId, spender: AccountId): Promise<Balance> {
        return this.stateCall('0x4d47d921', [owner, spender])
    }

    PSP22_total_supply(): Promise<Balance> {
        return this.stateCall('0x162df8c2', [])
    }

    PSP22_balance_of(owner: AccountId): Promise<Balance> {
        return this.stateCall('0x6568382f', [owner])
    }

    PSP22Metadata_token_decimals(): Promise<u8> {
        return this.stateCall('0x7271b782', [])
    }

    PSP22Metadata_token_name(): Promise<(TransferFromInput4 | undefined)> {
        return this.stateCall('0x3d261bd4', [])
    }

    PSP22Metadata_token_symbol(): Promise<(TransferFromInput4 | undefined)> {
        return this.stateCall('0x34205be5', [])
    }

    private async stateCall<T>(selector: string, args: any[]): Promise<T> {
        let input = _abi.encodeMessageInput(selector, args)
        let data = encodeCall(this.address, input)
        let result = await this.ctx._chain.rpc.call('state_call', ['ContractsApi_call', data, this.blockHash])
        let value = decodeResult(result)
        return _abi.decodeMessageOutput(selector, value)
    }
}

export type TransferFromInput4 = Bytes

export const TransferFromInput4: sts.Type<TransferFromInput4> = sts.bytes()

export type u8 = number

export const u8: sts.Type<u8> = sts.number()

export type Balance = bigint

export const Balance: sts.Type<Balance> = sts.bigint()

export type AccountId = Bytes

export const AccountId: sts.Type<AccountId> = sts.bytes()

export type Constructor = Constructor_new

export type Constructor_new = {
    __kind: 'new'
    totalSupply: Balance,
    name?: (TransferFromInput4 | undefined),
    symbol?: (TransferFromInput4 | undefined),
    decimals: u8,
}

export const Constructor: sts.Type<Constructor> = sts.closedEnum(() => {
    return {
        new: sts.enumStruct({
            totalSupply: Balance,
            name: sts.option(() => TransferFromInput4),
            symbol: sts.option(() => TransferFromInput4),
            decimals: u8,
        }),
    }
})

export type Message = Message_PSP22Metadata_token_decimals | Message_PSP22Metadata_token_name | Message_PSP22Metadata_token_symbol | Message_PSP22_allowance | Message_PSP22_approve | Message_PSP22_balance_of | Message_PSP22_decrease_allowance | Message_PSP22_increase_allowance | Message_PSP22_total_supply | Message_PSP22_transfer | Message_PSP22_transfer_from | Message_mint

/**
 *  Returns the token decimals.
 */
export type Message_PSP22Metadata_token_decimals = {
    __kind: 'PSP22Metadata_token_decimals'
}

/**
 *  Returns the token name.
 */
export type Message_PSP22Metadata_token_name = {
    __kind: 'PSP22Metadata_token_name'
}

/**
 *  Returns the token symbol.
 */
export type Message_PSP22Metadata_token_symbol = {
    __kind: 'PSP22Metadata_token_symbol'
}

/**
 *  Returns the amount which `spender` is still allowed to withdraw from `owner`.
 * 
 *  Returns `0` if no allowance has been set `0`.
 */
export type Message_PSP22_allowance = {
    __kind: 'PSP22_allowance'
    owner: AccountId,
    spender: AccountId,
}

/**
 *  Allows `spender` to withdraw from the caller's account multiple times, up to
 *  the `value` amount.
 * 
 *  If this function is called again it overwrites the current allowance with `value`.
 * 
 *  An `Approval` event is emitted.
 * 
 *  # Errors
 * 
 *  Returns `ZeroSenderAddress` error if sender's address is zero.
 * 
 *  Returns `ZeroRecipientAddress` error if recipient's address is zero.
 */
export type Message_PSP22_approve = {
    __kind: 'PSP22_approve'
    spender: AccountId,
    value: Balance,
}

/**
 *  Returns the account Balance for the specified `owner`.
 * 
 *  Returns `0` if the account is non-existent.
 */
export type Message_PSP22_balance_of = {
    __kind: 'PSP22_balance_of'
    owner: AccountId,
}

/**
 *  Atomically decreases the allowance granted to `spender` by the caller.
 * 
 *  An `Approval` event is emitted.
 * 
 *  # Errors
 * 
 *  Returns `InsufficientAllowance` error if there are not enough tokens allowed
 *  by owner for `spender`.
 * 
 *  Returns `ZeroSenderAddress` error if sender's address is zero.
 * 
 *  Returns `ZeroRecipientAddress` error if recipient's address is zero.
 */
export type Message_PSP22_decrease_allowance = {
    __kind: 'PSP22_decrease_allowance'
    spender: AccountId,
    deltaValue: Balance,
}

/**
 *  Atomically increases the allowance granted to `spender` by the caller.
 * 
 *  An `Approval` event is emitted.
 * 
 *  # Errors
 * 
 *  Returns `ZeroSenderAddress` error if sender's address is zero.
 * 
 *  Returns `ZeroRecipientAddress` error if recipient's address is zero.
 */
export type Message_PSP22_increase_allowance = {
    __kind: 'PSP22_increase_allowance'
    spender: AccountId,
    deltaValue: Balance,
}

/**
 *  Returns the total token supply.
 */
export type Message_PSP22_total_supply = {
    __kind: 'PSP22_total_supply'
}

/**
 *  Transfers `value` amount of tokens from the caller's account to account `to`
 *  with additional `data` in unspecified format.
 * 
 *  On success a `Transfer` event is emitted.
 * 
 *  # Errors
 * 
 *  Returns `InsufficientBalance` error if there are not enough tokens on
 *  the caller's account Balance.
 * 
 *  Returns `ZeroSenderAddress` error if sender's address is zero.
 * 
 *  Returns `ZeroRecipientAddress` error if recipient's address is zero.
 */
export type Message_PSP22_transfer = {
    __kind: 'PSP22_transfer'
    to: AccountId,
    value: Balance,
    data: TransferFromInput4,
}

/**
 *  Transfers `value` tokens on the behalf of `from` to the account `to`
 *  with additional `data` in unspecified format.
 * 
 *  This can be used to allow a contract to transfer tokens on ones behalf and/or
 *  to charge fees in sub-currencies, for example.
 * 
 *  On success a `Transfer` and `Approval` events are emitted.
 * 
 *  # Errors
 * 
 *  Returns `InsufficientAllowance` error if there are not enough tokens allowed
 *  for the caller to withdraw from `from`.
 * 
 *  Returns `InsufficientBalance` error if there are not enough tokens on
 *  the the account Balance of `from`.
 * 
 *  Returns `ZeroSenderAddress` error if sender's address is zero.
 * 
 *  Returns `ZeroRecipientAddress` error if recipient's address is zero.
 */
export type Message_PSP22_transfer_from = {
    __kind: 'PSP22_transfer_from'
    from: AccountId,
    to: AccountId,
    value: Balance,
    data: TransferFromInput4,
}

export type Message_mint = {
    __kind: 'mint'
    account: AccountId,
    amount: Balance,
}

export const Message: sts.Type<Message> = sts.closedEnum(() => {
    return {
        PSP22Metadata_token_decimals: sts.unit(),
        PSP22Metadata_token_name: sts.unit(),
        PSP22Metadata_token_symbol: sts.unit(),
        PSP22_allowance: sts.enumStruct({
            owner: AccountId,
            spender: AccountId,
        }),
        PSP22_approve: sts.enumStruct({
            spender: AccountId,
            value: Balance,
        }),
        PSP22_balance_of: sts.enumStruct({
            owner: AccountId,
        }),
        PSP22_decrease_allowance: sts.enumStruct({
            spender: AccountId,
            deltaValue: Balance,
        }),
        PSP22_increase_allowance: sts.enumStruct({
            spender: AccountId,
            deltaValue: Balance,
        }),
        PSP22_total_supply: sts.unit(),
        PSP22_transfer: sts.enumStruct({
            to: AccountId,
            value: Balance,
            data: TransferFromInput4,
        }),
        PSP22_transfer_from: sts.enumStruct({
            from: AccountId,
            to: AccountId,
            value: Balance,
            data: TransferFromInput4,
        }),
        mint: sts.enumStruct({
            account: AccountId,
            amount: Balance,
        }),
    }
})

export type Event = Event_Approval | Event_Transfer

export type Event_Approval = {
    __kind: 'Approval'
    owner: AccountId,
    spender: AccountId,
    value: Balance,
}

export type Event_Transfer = {
    __kind: 'Transfer'
    from?: (AccountId | undefined),
    to?: (AccountId | undefined),
    value: Balance,
}

export const Event: sts.Type<Event> = sts.closedEnum(() => {
    return {
        Approval: sts.enumStruct({
            owner: AccountId,
            spender: AccountId,
            value: Balance,
        }),
        Transfer: sts.enumStruct({
            from: sts.option(() => AccountId),
            to: sts.option(() => AccountId),
            value: Balance,
        }),
    }
})

export type Result<T, E> = {__kind: 'Ok', value: T} | {__kind: 'Err', value: E}
