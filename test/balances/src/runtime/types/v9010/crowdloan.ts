import {sts} from '../../pallet.support'
import {AccountId, ParaId, MultiSigner, MultiSignature, Balance, DispatchResult} from './types'

/**
 *  Withdraw full balance of a specific contributor.
 * 
 *  Origin must be signed, but can come from anyone.
 * 
 *  The fund must be either in, or ready for, retirement. For a fund to be *in* retirement, then the retirement
 *  flag must be set. For a fund to be ready for retirement, then:
 *  - it must not already be in retirement;
 *  - the amount of raised funds must be bigger than the _free_ balance of the account;
 *  - and either:
 *    - the block number must be at least `end`; or
 *    - the current lease period must be greater than the fund's `last_period`.
 * 
 *  In this case, the fund's retirement flag is set and its `end` is reset to the current block
 *  number.
 * 
 *  - `who`: The account whose contribution should be withdrawn.
 *  - `index`: The parachain to whose crowdloan the contribution was made.
 */
export type CrowdloanWithdrawCall = {
    who: AccountId,
    index: number,
}

export const CrowdloanWithdrawCall: sts.Type<CrowdloanWithdrawCall> = sts.struct(() => {
    return  {
        who: AccountId,
        index: sts.number(),
    }
})

/**
 *  Automatically refund contributors of an ended crowdloan.
 *  Due to weight restrictions, this function may need to be called multiple
 *  times to fully refund all users. We will refund `RemoveKeysLimit` users at a time.
 * 
 *  Origin must be signed, but can come from anyone.
 */
export type CrowdloanRefundCall = {
    index: number,
}

export const CrowdloanRefundCall: sts.Type<CrowdloanRefundCall> = sts.struct(() => {
    return  {
        index: sts.number(),
    }
})

/**
 *  Poke the fund into NewRaise
 * 
 *  Origin must be Signed, and the fund has non-zero raise.
 */
export type CrowdloanPokeCall = {
    index: ParaId,
}

export const CrowdloanPokeCall: sts.Type<CrowdloanPokeCall> = sts.struct(() => {
    return  {
        index: ParaId,
    }
})

/**
 *  Edit the configuration for an in-progress crowdloan.
 * 
 *  Can only be called by Root origin.
 */
export type CrowdloanEditCall = {
    index: number,
    cap: bigint,
    first_period: number,
    last_period: number,
    end: number,
    verifier?: (MultiSigner | undefined),
}

export const CrowdloanEditCall: sts.Type<CrowdloanEditCall> = sts.struct(() => {
    return  {
        index: sts.number(),
        cap: sts.bigint(),
        first_period: sts.number(),
        last_period: sts.number(),
        end: sts.number(),
        verifier: sts.option(() => MultiSigner),
    }
})

/**
 *  Remove a fund after the retirement period has ended and all funds have been returned.
 */
export type CrowdloanDissolveCall = {
    index: number,
}

export const CrowdloanDissolveCall: sts.Type<CrowdloanDissolveCall> = sts.struct(() => {
    return  {
        index: sts.number(),
    }
})

/**
 *  Create a new crowdloaning campaign for a parachain slot with the given lease period range.
 * 
 *  This applies a lock to your parachain configuration, ensuring that it cannot be changed
 *  by the parachain manager.
 */
export type CrowdloanCreateCall = {
    index: number,
    cap: bigint,
    first_period: number,
    last_period: number,
    end: number,
    verifier?: (MultiSigner | undefined),
}

export const CrowdloanCreateCall: sts.Type<CrowdloanCreateCall> = sts.struct(() => {
    return  {
        index: sts.number(),
        cap: sts.bigint(),
        first_period: sts.number(),
        last_period: sts.number(),
        end: sts.number(),
        verifier: sts.option(() => MultiSigner),
    }
})

/**
 *  Contribute to a crowd sale. This will transfer some balance over to fund a parachain
 *  slot. It will be withdrawable when the crowdloan has ended and the funds are unused.
 */
export type CrowdloanContributeCall = {
    index: number,
    value: bigint,
    signature?: (MultiSignature | undefined),
}

export const CrowdloanContributeCall: sts.Type<CrowdloanContributeCall> = sts.struct(() => {
    return  {
        index: sts.number(),
        value: sts.bigint(),
        signature: sts.option(() => MultiSignature),
    }
})

/**
 *  Add an optional memo to an existing crowdloan contribution.
 * 
 *  Origin must be Signed, and the user must have contributed to the crowdloan.
 */
export type CrowdloanAddMemoCall = {
    index: ParaId,
    memo: Bytes,
}

export const CrowdloanAddMemoCall: sts.Type<CrowdloanAddMemoCall> = sts.struct(() => {
    return  {
        index: ParaId,
        memo: sts.bytes(),
    }
})

/**
 *  Withdrew full balance of a contributor. [who, fund_index, amount]
 */
export type CrowdloanWithdrewEvent = [AccountId, ParaId, Balance]

export const CrowdloanWithdrewEvent: sts.Type<CrowdloanWithdrewEvent> = sts.tuple(() => AccountId, ParaId, Balance)

/**
 *  The loans in a fund have been partially dissolved, i.e. there are some left
 *  over child keys that still need to be killed. [fund_index]
 */
export type CrowdloanPartiallyRefundedEvent = [ParaId]

export const CrowdloanPartiallyRefundedEvent: sts.Type<CrowdloanPartiallyRefundedEvent> = sts.tuple(() => ParaId)

/**
 *  On-boarding process for a winning parachain fund is completed. [find_index, parachain_id]
 */
export type CrowdloanOnboardedEvent = [ParaId, ParaId]

export const CrowdloanOnboardedEvent: sts.Type<CrowdloanOnboardedEvent> = sts.tuple(() => ParaId, ParaId)

/**
 *  A memo has been updated. [who, fund_index, memo]
 */
export type CrowdloanMemoUpdatedEvent = [AccountId, ParaId, Bytes]

export const CrowdloanMemoUpdatedEvent: sts.Type<CrowdloanMemoUpdatedEvent> = sts.tuple(() => AccountId, ParaId, sts.bytes())

/**
 *  The result of trying to submit a new bid to the Slots pallet.
 */
export type CrowdloanHandleBidResultEvent = [ParaId, DispatchResult]

export const CrowdloanHandleBidResultEvent: sts.Type<CrowdloanHandleBidResultEvent> = sts.tuple(() => ParaId, DispatchResult)

/**
 *  The configuration to a crowdloan has been edited. [fund_index]
 */
export type CrowdloanEditedEvent = [ParaId]

export const CrowdloanEditedEvent: sts.Type<CrowdloanEditedEvent> = sts.tuple(() => ParaId)

/**
 *  Fund is dissolved. [fund_index]
 */
export type CrowdloanDissolvedEvent = [ParaId]

export const CrowdloanDissolvedEvent: sts.Type<CrowdloanDissolvedEvent> = sts.tuple(() => ParaId)

/**
 *  The deploy data of the funded parachain is set. [fund_index]
 */
export type CrowdloanDeployDataFixedEvent = [ParaId]

export const CrowdloanDeployDataFixedEvent: sts.Type<CrowdloanDeployDataFixedEvent> = sts.tuple(() => ParaId)

/**
 *  Create a new crowdloaning campaign. [fund_index]
 */
export type CrowdloanCreatedEvent = [ParaId]

export const CrowdloanCreatedEvent: sts.Type<CrowdloanCreatedEvent> = sts.tuple(() => ParaId)

/**
 *  Contributed to a crowd sale. [who, fund_index, amount]
 */
export type CrowdloanContributedEvent = [AccountId, ParaId, Balance]

export const CrowdloanContributedEvent: sts.Type<CrowdloanContributedEvent> = sts.tuple(() => AccountId, ParaId, Balance)

/**
 *  All loans in a fund have been refunded. [fund_index]
 */
export type CrowdloanAllRefundedEvent = [ParaId]

export const CrowdloanAllRefundedEvent: sts.Type<CrowdloanAllRefundedEvent> = sts.tuple(() => ParaId)

/**
 *  A parachain has been moved to NewRaise
 */
export type CrowdloanAddedToNewRaiseEvent = [ParaId]

export const CrowdloanAddedToNewRaiseEvent: sts.Type<CrowdloanAddedToNewRaiseEvent> = sts.tuple(() => ParaId)
