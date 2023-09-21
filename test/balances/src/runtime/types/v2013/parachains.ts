import {sts} from '../../pallet.support'
import {ParaId, Balance, Remark} from './types'

/**
 *  Transfer some tokens into a parachain and leave a message in the downward queue for it.
 */
export type ParachainsTransferToParachainCall = {
    to: ParaId,
    amount: Balance,
    remark: Remark,
}

export const ParachainsTransferToParachainCall: sts.Type<ParachainsTransferToParachainCall> = sts.struct(() => {
    return  {
        to: ParaId,
        amount: Balance,
        remark: Remark,
    }
})

/**
 *  Send a XCMP message to the given parachain.
 * 
 *  The origin must be another parachain.
 */
export type ParachainsSendXcmpMessageCall = {
    to: ParaId,
    msg: Bytes,
}

export const ParachainsSendXcmpMessageCall: sts.Type<ParachainsSendXcmpMessageCall> = sts.struct(() => {
    return  {
        to: ParaId,
        msg: sts.bytes(),
    }
})
