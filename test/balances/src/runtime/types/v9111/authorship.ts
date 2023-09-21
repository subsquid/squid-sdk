import {sts} from '../../pallet.support'
import {Header} from './types'

/**
 * Provide a set of uncles.
 */
export type AuthorshipSetUnclesCall = {
    newUncles: Header[],
}

export const AuthorshipSetUnclesCall: sts.Type<AuthorshipSetUnclesCall> = sts.struct(() => {
    return  {
        newUncles: sts.array(() => Header),
    }
})
