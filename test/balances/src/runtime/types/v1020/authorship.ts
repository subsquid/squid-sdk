import {sts} from '../../pallet.support'
import {Header} from './types'

/**
 *  Provide a set of uncles.
 */
export type AuthorshipSetUnclesCall = {
    new_uncles: Header[],
}

export const AuthorshipSetUnclesCall: sts.Type<AuthorshipSetUnclesCall> = sts.struct(() => {
    return  {
        new_uncles: sts.array(() => Header),
    }
})
