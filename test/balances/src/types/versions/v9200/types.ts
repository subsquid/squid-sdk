
export const AccountId32 = sts.bytes()

export const ValidatorPrefs = sts.struct(() => {
    return  {
        commission: Type_32,
        blocked: Type_34,
    }
})

export const Type_32 = number

export const Type_34 = sts.boolean()
