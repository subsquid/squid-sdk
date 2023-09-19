
export const DispatchError = sts.struct(() => {
    return  {
        module: Type_165,
        error: Type_11,
    }
})

export const DispatchInfo = sts.struct(() => {
    return  {
        weight: Weight,
        class: DispatchClass,
        paysFee: Type_115,
    }
})

export const AccountId = sts.bytes()

export const AccountIndex = sts.number()

export const Balance = sts.bigint()

export const Kind = sts.bytes()

export const OpaqueTimeSlot = sts.bytes()

export const AuthorityId = sts.bytes()

export const AuthorityWeight = sts.bigint()

export const NextAuthority = sts.tuple(AuthorityId, AuthorityWeight)

export const ValidatorId = sts.bytes()

export const FullIdentification = sts.struct(() => {
    return  {
        total: Type_25,
        own: Type_25,
        others: Type_189,
    }
})

export const IdentificationTuple = sts.tuple(ValidatorId, FullIdentification)

export const ReferendumIndex = sts.number()

export const Type_115 = sts.boolean()

export const PropIndex = sts.number()

export const VoteThreshold = sts.closedEnum(() => {
    return  {
        SimpleMajority: sts.unit(),
        SuperMajorityAgainst: sts.unit(),
        SuperMajorityApprove: sts.unit(),
    }
})

export const Type_80 = sts.array(AccountId)

export const Hash = sts.bytes()

export const BlockNumber = sts.number()

export const ProposalIndex = sts.number()

export const MemberCount = sts.number()

export const Type_197 = sts.tuple(AccountId, Balance)

export const EthereumAddress = sts.bytes()

export const AuctionIndex = sts.number()

export const LeasePeriod = sts.number()

export const NewBidder = sts.struct(() => {
    return  {
        who: AccountId,
        sub: SubId,
    }
})

export const SlotRange = sts.closedEnum(() => {
    return  {
        OneOne: sts.unit(),
        OneThree: sts.unit(),
        OneTwo: sts.unit(),
        ThreeThree: sts.unit(),
        TwoThree: sts.unit(),
        TwoTwo: sts.unit(),
        ZeroOne: sts.unit(),
        ZeroThree: sts.unit(),
        ZeroTwo: sts.unit(),
        ZeroZero: sts.unit(),
    }
})

export const ParaId = sts.number()

export const Type_11 = sts.number()

export const Type_165 = sts.option(() => Type_11)

export const Weight = sts.number()

export const DispatchClass = sts.closedEnum(() => {
    return  {
        Mandatory: sts.unit(),
        Normal: sts.unit(),
        Operational: sts.unit(),
    }
})

export const Type_25 = bigint

export const IndividualExposure = sts.struct(() => {
    return  {
        who: AccountId,
        value: Type_25,
    }
})

export const Type_189 = sts.array(IndividualExposure)

export const SubId = sts.number()
