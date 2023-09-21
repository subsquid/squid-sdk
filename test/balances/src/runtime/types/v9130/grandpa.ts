import {sts} from '../../pallet.support'
import {Public} from './types'

/**
 * New authority set has been applied.
 */
export type GrandpaNewAuthoritiesEvent = {
    authoritySet: [Public, bigint][],
}

export const GrandpaNewAuthoritiesEvent: sts.Type<GrandpaNewAuthoritiesEvent> = sts.struct(() => {
    return  {
        authoritySet: sts.array(() => sts.tuple(() => Public, sts.bigint())),
    }
})
