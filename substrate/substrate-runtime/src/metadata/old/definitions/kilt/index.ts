import {OldTypesBundle} from '../../types'
import {types10} from './types_10'
import {types12} from './types_12'
import {types17} from './types_17'
import {types18} from './types_18'
import {types19} from './types_19'
import {types20} from './types_20'
import {types21} from './types_21'
import {types23} from './types_23'
import {types25} from './types_25'
import {types2700} from './types_2700'
import {types8} from './types_8'
import {types9} from './types_9'


export const bundle: OldTypesBundle = {
    types: {},
    versions: [
        {
            minmax: [0, 8],
            types: types8,
        },
        {
            minmax: [9, 9],
            types: types9,
        },
        {
            minmax: [10, 11],
            types: types10,
        },
        {
            minmax: [12, 16],
            types: types12,
        },
        {
            minmax: [17, 17],
            types: types17,
        },
        {
            minmax: [18, 18],
            types: types18,
        },
        {
            minmax: [19, 19],
            types: types19,
        },
        {
            minmax: [20, 20],
            types: types20,
        },
        {
            minmax: [21, 22],
            types: types21,
        },
        {
            minmax: [23, 24],
            types: types23,
        },
        {
            minmax: [25, 2699],
            types: types25,
        },
        {
            minmax: [2700, 10409],
            types: types2700,
        }
    ]
}
