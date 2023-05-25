import {FileOutput, OutDir} from '@subsquid/util-internal-code-printer'
import {StorageTypegen} from '../storageTypegen'
import {RawStorageLayout, StorageLayout} from '../layout.support'
import {createLogger} from '@subsquid/logger'

let LAYOUT = {
    storage: [
        {
            astId: 13,
            contract: 'contracts/2_Owner.sol:StorageLayout',
            label: 'values',
            offset: 0,
            slot: '0',
            type: 't_array(t_uint8)dyn_storage',
        },
    ],
    types: {
        't_array(t_uint8)dyn_storage': {
            base: 't_uint8',
            encoding: 'dynamic_array',
            label: 'uint8[]',
            numberOfBytes: '32',
        },
        t_uint8: {
            encoding: 'inplace',
            label: 'uint8',
            numberOfBytes: '1',
        },
    },
}

new StorageTypegen(new OutDir('./src/test/abi'), new StorageLayout(LAYOUT), 'test', createLogger('a')).generate()
