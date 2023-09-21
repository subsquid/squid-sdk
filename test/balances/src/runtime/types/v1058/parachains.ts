import {sts} from '../../pallet.support'
import {DoubleVoteReport} from './types'

/**
 *  Provide a proof that some validator has commited a double-vote.
 * 
 *  The weight is 0; in order to avoid DoS a `SignedExtension` validation
 *  is implemented.
 */
export type ParachainsReportDoubleVoteCall = {
    report: DoubleVoteReport,
}

export const ParachainsReportDoubleVoteCall: sts.Type<ParachainsReportDoubleVoteCall> = sts.struct(() => {
    return  {
        report: DoubleVoteReport,
    }
})
