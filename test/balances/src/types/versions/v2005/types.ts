
export const Hash = sts.bytes()

export const DispatchResult = sts.closedEnum(() => {
    return  {
        Err: DispatchError,
        Ok: sts.unit(),
    }
})

export const BlockNumber = sts.number()

export const Type_20 = sts.number()

export const AccountId = sts.bytes()

export const ProxyType = sts.closedEnum(() => {
    return  {
        Any: sts.unit(),
        Auction: sts.unit(),
        CancelProxy: sts.unit(),
        Governance: sts.unit(),
        IdentityJudgement: sts.unit(),
        NonTransfer: sts.unit(),
        Staking: sts.unit(),
    }
})

export const Type_85 = sts.number()

export const Timepoint = sts.struct(() => {
    return  {
        height: BlockNumber,
        index: Type_20,
    }
})

export const CallHash = sts.bytes()

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

export const ArithmeticError = sts.closedEnum(() => {
    return  {
        DivisionByZero: sts.unit(),
        Overflow: sts.unit(),
        Underflow: sts.unit(),
    }
})

export const DispatchErrorModule = sts.struct(() => {
    return  {
        index: Type_5,
        error: Type_5,
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

export const Type_5 = sts.number()
