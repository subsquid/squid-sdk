import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const calls = {
    set_uncles: createCall(
        'Authorship.set_uncles',
        {
            v1020: AuthorshipSetUnclesCall,
            v9111: AuthorshipSetUnclesCall,
            v9130: AuthorshipSetUnclesCall,
        }
    ),
}

export const constants = {
    UncleGenerations: createConstant(
        'Authorship.UncleGenerations',
        {
            v9090: AuthorshipUncleGenerationsConstant,
        }
    ),
}

export const storage = {
    Author: createStorage(
        'Authorship.Author',
        {
            v1020: AuthorshipAuthorStorage,
        }
    ),
    DidSetUncles: createStorage(
        'Authorship.DidSetUncles',
        {
            v1020: AuthorshipDidSetUnclesStorage,
        }
    ),
    Uncles: createStorage(
        'Authorship.Uncles',
        {
            v1020: AuthorshipUnclesStorage,
            v9111: AuthorshipUnclesStorage,
        }
    ),
}

export default {calls, constants}
