
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
        paysFee: Type_181,
    }
})

export const Kind = sts.bytes()

export const OpaqueTimeSlot = sts.bytes()

export const Type_181 = sts.boolean()

export const AccountId = sts.bytes()

export const Timepoint = sts.struct(() => {
    return  {
        height: BlockNumber,
        index: Type_20,
    }
})

export const CallHash = sts.bytes()

export const DispatchResult = sts.closedEnum(() => {
    return  {
        Err: DispatchError,
        Ok: sts.unit(),
    }
})

export const BlockNumber = sts.number()

export const Type_20 = sts.number()

export const TaskAddress = sts.tuple(BlockNumber, Type_20)

export const Type_27 = sts.bytes()

export const Type_343 = sts.option(() => Type_27)

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

export const Weight = sts.bigint()

export const DispatchClass = sts.closedEnum(() => {
    return  {
        Mandatory: sts.unit(),
        Normal: sts.unit(),
        Operational: sts.unit(),
    }
})

export const Type_5 = sts.number()
