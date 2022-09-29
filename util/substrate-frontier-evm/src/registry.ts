import {OldTypes} from '@subsquid/substrate-metadata'
import {OldTypeRegistry} from '@subsquid/substrate-metadata/lib/old/typeRegistry'
import {substrateBundle} from '@subsquid/substrate-metadata/lib/old/definitions//substrate'
import {Registry} from '@subsquid/substrate-metadata/lib/events-and-calls'

const types: OldTypes = {
    types: {
        ...substrateBundle.types,
        EVM: {
            _enum: {
                LogV0: 'EvmLog',
                LogV1: {
                    log: 'EvmLog',
                },
            },
        },
        Ethereum: {
            _enum: {
                transactV0: {
                    transaction: 'TransactionV0',
                },
                transactV1: {
                    transaction: 'TransactionV1',
                },
                transactV2: {
                    transaction: 'TransactionV2',
                },
            },
        },
        V14EthTransactionAction: {
            _enum: {
                Call: 'H160',
                Create: null,
            },
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
        V14EthAccessListItem: {
            address: 'H160',
            storageKeys: 'Vec<H256>',
        },
        V14EthAccessList: 'Vec<V14EthAccessListItem>',
        V14EIP2930Transaction: {
            chainId: 'u64',
            nonce: '[u64; 4]',
            gasPrice: '[u64; 4]',
            gasLimit: '[u64; 4]',
            action: 'V14EthTransactionAction',
            value: '[u64; 4]',
            input: 'Bytes',
            accessList: 'V14EthAccessList',
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
            accessList: 'V14EthAccessList',
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
                    transaction: 'V14TransactionV0',
                },
                transactV1: {
                    transaction: 'V14TransactionV1',
                },
                transactV2: {
                    transaction: 'V14TransactionV2',
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
    },
}

const typeRegistry = new OldTypeRegistry(types)
const pallets = typeRegistry.use('P')

export const registry = new Registry(typeRegistry.getTypes(), pallets)
