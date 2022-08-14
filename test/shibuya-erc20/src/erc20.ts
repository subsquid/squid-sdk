import {Abi} from "@subsquid/ink-abi"

export const metadata = {
  "source": {
    "hash": "0x2ab457554b75e4fa0be68a2a768a7e422d3f39ffc0fdcb00faeda8f5a8683bdd",
    "language": "ink! 3.0.1",
    "compiler": "rustc 1.63.0-nightly"
  },
  "contract": {
    "name": "erc20",
    "version": "3.2.0",
    "authors": [
      "Parity Technologies <admin@parity.io>"
    ]
  },
  "V3": {
    "spec": {
      "constructors": [
        {
          "args": [
            {
              "label": "initial_supply",
              "type": {
                "displayName": [
                  "Balance"
                ],
                "type": 0
              }
            }
          ],
          "docs": [
            "Creates a new ERC-20 contract with the specified initial supply."
          ],
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
                "type": 11
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
                "type": 11
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
            " Event emitted when a token transfer occurs."
          ],
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
          "docs": [
            " Event emitted when an approval occurs that `spender` is allowed to withdraw",
            " up to the amount of `value` tokens from `owner`."
          ],
          "label": "Approval"
        }
      ],
      "messages": [
        {
          "args": [],
          "docs": [
            " Returns the total token supply."
          ],
          "label": "total_supply",
          "mutates": false,
          "payable": false,
          "returnType": {
            "displayName": [
              "Balance"
            ],
            "type": 0
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
              "Balance"
            ],
            "type": 0
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
              "Balance"
            ],
            "type": 0
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
              "Result"
            ],
            "type": 8
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
          "docs": [
            " Allows `spender` to withdraw from the caller's account multiple times, up to",
            " the `value` amount.",
            "",
            " If this function is called again it overwrites the current allowance with `value`.",
            "",
            " An `Approval` event is emitted."
          ],
          "label": "approve",
          "mutates": true,
          "payable": false,
          "returnType": {
            "displayName": [
              "Result"
            ],
            "type": 8
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
              "Result"
            ],
            "type": 8
          },
          "selector": "0x0b396f18"
        }
      ]
    },
    "storage": {
      "struct": {
        "fields": [
          {
            "layout": {
              "cell": {
                "key": "0x0000000000000000000000000000000000000000000000000000000000000000",
                "ty": 0
              }
            },
            "name": "total_supply"
          },
          {
            "layout": {
              "cell": {
                "key": "0x0100000000000000000000000000000000000000000000000000000000000000",
                "ty": 1
              }
            },
            "name": "balances"
          },
          {
            "layout": {
              "cell": {
                "key": "0x0200000000000000000000000000000000000000000000000000000000000000",
                "ty": 6
              }
            },
            "name": "allowances"
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
                  "name": "offset_key",
                  "type": 5,
                  "typeName": "Key"
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
            "Key"
          ]
        }
      },
      {
        "id": 6,
        "type": {
          "def": {
            "composite": {
              "fields": [
                {
                  "name": "offset_key",
                  "type": 5,
                  "typeName": "Key"
                }
              ]
            }
          },
          "params": [
            {
              "name": "K",
              "type": 7
            },
            {
              "name": "V",
              "type": 0
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
        "id": 7,
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
        "id": 8,
        "type": {
          "def": {
            "variant": {
              "variants": [
                {
                  "fields": [
                    {
                      "type": 9
                    }
                  ],
                  "index": 0,
                  "name": "Ok"
                },
                {
                  "fields": [
                    {
                      "type": 10
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
              "type": 9
            },
            {
              "name": "E",
              "type": 10
            }
          ],
          "path": [
            "Result"
          ]
        }
      },
      {
        "id": 9,
        "type": {
          "def": {
            "tuple": []
          }
        }
      },
      {
        "id": 10,
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
        "id": 11,
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

export function decodeEvent(hex: string): Event {
  return _abi.decodeEvent(hex)
}

export function decodeMessage(hex: string): Message {
  return _abi.decodeMessage(hex)
}

export function decodeConstructor(hex: string): Constructor {
  return _abi.decodeConstructor(hex)
}

export type Event = Event_Transfer | Event_Approval

export interface Event_Transfer {
  __kind: 'Transfer'
  from: (AccountId | undefined)
  to: (AccountId | undefined)
  value: Balance
}

export interface Event_Approval {
  __kind: 'Approval'
  owner: AccountId
  spender: AccountId
  value: Balance
}

export type Message = Message_total_supply | Message_balance_of | Message_allowance | Message_transfer | Message_approve | Message_transfer_from

/**
 *  Returns the total token supply.
 */
export interface Message_total_supply {
  __kind: 'total_supply'
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
 *  Allows `spender` to withdraw from the caller's account multiple times, up to
 *  the `value` amount.
 * 
 *  If this function is called again it overwrites the current allowance with `value`.
 * 
 *  An `Approval` event is emitted.
 */
export interface Message_approve {
  __kind: 'approve'
  spender: AccountId
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

export type Constructor = Constructor_new

/**
 * Creates a new ERC-20 contract with the specified initial supply.
 */
export interface Constructor_new {
  __kind: 'new'
  initialSupply: Balance
}

export type AccountId = Uint8Array

export type Balance = bigint

export type Result<T, E> = {__kind: 'Ok', value: T} | {__kind: 'Err', value: E}
