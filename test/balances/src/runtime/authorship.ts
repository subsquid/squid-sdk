import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9130 from './types/v9130'
import * as v9111 from './types/v9111'
import * as v9090 from './types/v9090'
import * as v1020 from './types/v1020'

export const calls = {
    set_uncles: createCall(
        'Authorship.set_uncles',
        {
            v1020: v1020.AuthorshipSetUnclesCall,
            v9111: v9111.AuthorshipSetUnclesCall,
            v9130: v9130.AuthorshipSetUnclesCall,
        }
    ),
}

export const constants = {
    UncleGenerations: createConstant(
        'Authorship.UncleGenerations',
        {
            v9090: v9090.AuthorshipUncleGenerationsConstant,
        }
    ),
}

export const storage = {
    Author: createStorage(
        'Authorship.Author',
        {
            v1020: v1020.AuthorshipAuthorStorage,
        }
    ),
    DidSetUncles: createStorage(
        'Authorship.DidSetUncles',
        {
            v1020: v1020.AuthorshipDidSetUnclesStorage,
        }
    ),
    Uncles: createStorage(
        'Authorship.Uncles',
        {
            v1020: v1020.AuthorshipUnclesStorage,
            v9111: v9111.AuthorshipUnclesStorage,
        }
    ),
}

export default {calls, constants}
