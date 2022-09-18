import {OldTypes} from '@subsquid/substrate-metadata';
import {OldTypeRegistry} from '@subsquid/substrate-metadata/lib/old/typeRegistry'
import {Registry} from '@subsquid/substrate-metadata/lib/events-and-calls'

const types: OldTypes = {
    types: {
        H160: "[u8; 20; H160]",
        H256: "[u8; 32; H256]",
        EvmLog: {
            address: 'H160',
            topics: 'Vec<H256>',
            data: 'Bytes',
        },
        EVM: {
            _enum: {
                LogV0: 'EvmLog',
                LogV1: {
                    log: 'EvmLog',
                },
            },
        },
        EthTransactionAction: {
            '_enum': {
                'Call': 'H160',
                'Create': 'Null'
            }
        },
        "EthTransactionSignature": {
            "v": "u64",
            "r": "H256",
            "s": "H256"
        },
        LegacyTransaction: {
            nonce: 'U256',
            gasPrice: 'U256',
            gasLimit: 'U256',
            action: 'EthTransactionAction',
            value: 'U256',
            input: 'Bytes',
            signature: 'EthTransactionSignature',
        },
        TransactionV0: 'LegacyTransaction',
        "EthAccessListItem": {
            "address": "Vec<u8>",
            "slots": "Vec<H256>"
        },
        "EthAccessList": "Vec<EthAccessListItem>",
        EIP2930Transaction: {
            chainId: 'u64',
            nonce: 'U256',
            gasPrice: 'U256',
            gasLimit: 'U256',
            action: 'EthTransactionAction',
            value: 'U256',
            input: 'Bytes',
            accessList: 'EthAccessList',
            oddYParity: 'bool',
            r: 'H256',
            s: 'H256',
        },
        TransactionV1: {
            _enum: {
                Legacy: 'LegacyTransaction',
                EIP2930: 'EIP2930Transaction',
            },
        },
        EIP1559Transaction: {
            chainId: 'u64',
            nonce: 'U256',
            maxPriorityFeePerGas: 'U256',
            maxFeePerGas: 'U256',
            gasLimit: 'U256',
            action: 'EthTransactionAction',
            value: 'U256',
            input: 'Bytes',
            accessList: 'EthAccessList',
            oddYParity: 'bool',
            r: 'H256',
            s: 'H256',
        },
        TransactionV2: {
            _enum: {
                Legacy: 'LegacyTransaction',
                EIP2930: 'EIP2930Transaction',
                EIP1559: 'EIP1559Transaction',
            },
        },
        Ethereum: {
            _enum: {
                transactV0: {
                    transaction: 'TransactionV0'
                },
                transactV1: {
                    transaction: 'TransactionV1'
                },
                transactV2: {
                    transaction: 'TransactionV2'
                },
            },
        },
        V14EthTransactionAction: {
            '_enum': {
                'Call': 'H160',
                'Create': 'Null'
            }
        },
        V14LegacyTransaction: {
            nonce: '[u64; 4]',
            gasPrice: '[u64; 4]',
            gasLimit: '[u64; 4]',
            action: 'V14EthTransactionAction',
            value: '[u64; 4]',
            input: 'Bytes',
            signature: 'EthTransactionSignature',
        },
        V14TransactionV0: 'V14LegacyTransaction',
        V14EIP2930Transaction: {
            chainId: 'u64',
            nonce: '[u64; 4]',
            gasPrice: '[u64; 4]',
            gasLimit: '[u64; 4]',
            action: 'V14EthTransactionAction',
            value: '[u64; 4]',
            input: 'Bytes',
            accessList: 'EthAccessList',
            oddYParity: 'bool',
            r: 'H256',
            s: 'H256',
        },
        V14TransactionV1: {
            _enum: {
                Legacy: 'V14LegacyTransaction',
                EIP2930: 'V14EIP2930Transaction',
            },
        },
        V14EIP1559Transaction: {
            chainId: 'u64',
            nonce: '[u64; 4]',
            maxPriorityFeePerGas: '[u64; 4]',
            maxFeePerGas: '[u64; 4]',
            gasLimit: '[u64; 4]',
            action: 'V14EthTransactionAction',
            value: '[u64; 4]',
            input: 'Bytes',
            accessList: 'EthAccessList',
            oddYParity: 'bool',
            r: 'H256',
            s: 'H256',
        },
        V14TransactionV2: {
            _enum: {
                Legacy: 'V14LegacyTransaction',
                EIP2930: 'V14EIP2930Transaction',
                EIP1559: 'V14EIP1559Transaction',
            },
        },
        V14Ethereum: {
            _enum: {
                transactV0: {
                    transaction: 'V14TransactionV0'
                },
                transactV1: {
                    transaction: 'V14TransactionV1'
                },
                transactV2: {
                    transaction: 'V14TransactionV2'
                },
            },
        },
        P: {
            _enum: {
                EVM: 'EVM',
                Ethereum: 'Ethereum',
                V14Ethereum: 'V14Ethereum',
            },
        },
    }
};

const typeRegistry = new OldTypeRegistry(types);
const pallets = typeRegistry.use('P');

export const registry = new Registry(typeRegistry.getTypes(), pallets);

console.log(registry.getHash('Ethereum.transactV0'))
console.log(registry.getHash('V14Ethereum.transactV0'))
console.log(registry.getHash('V14Ethereum.transactV1'))
console.log(registry.getHash('V14Ethereum.transactV2'))