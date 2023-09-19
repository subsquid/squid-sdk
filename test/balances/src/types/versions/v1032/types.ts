
export const DispatchError = sts.closedEnum(() => {
    return  {
        Arithmetic: ArithmeticError,
        BadOrigin: sts.unit(),
        CannotLookup: sts.unit(),
        ConsumerRemaining: sts.unit(),
        Module: DispatchErrorModule,
        NoProviders: sts.unit(),
        Other: sts.unit(),
        Token: TokenError,
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

export const Balance = sts.bigint()

export const ProposalIndex = sts.number()

export const Type_5 = sts.number()

export const Timepoint = sts.struct(() => {
    return  {
        height: BlockNumber,
        index: Type_5,
    }
})

export const DispatchResult = sts.closedEnum(() => {
    return  {
        Err: DispatchError,
        Ok: sts.unit(),
    }
})

export const ArithmeticError = sts.closedEnum(() => {
    return  {
        DivisionByZero: sts.unit(),
        Overflow: sts.unit(),
        Underflow: sts.unit(),
    }
})

export const DispatchErrorModule = sts.struct(() => {
    return  {
        index: Type_11,
        error: Type_11,
    }
})

export const TokenError = sts.closedEnum(() => {
    return  {
        BelowMinimum: sts.unit(),
        CannotCreate: sts.unit(),
        Frozen: sts.unit(),
        NoFunds: sts.unit(),
        Overflow: sts.unit(),
        Underflow: sts.unit(),
        UnknownAsset: sts.unit(),
        WouldDie: sts.unit(),
    }
})

export const Weight = sts.number()

export const DispatchClass = sts.closedEnum(() => {
    return  {
        Mandatory: sts.unit(),
        Normal: sts.unit(),
        Operational: sts.unit(),
    }
})

export const Type_115 = sts.boolean()

export const BlockNumber = sts.number()

export const Type_11 = sts.number()
