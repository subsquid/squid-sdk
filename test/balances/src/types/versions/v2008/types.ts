
export const AccountId = sts.bytes()

export const Balance = sts.bigint()

export const BalanceStatus = sts.closedEnum(() => {
    return  {
        Free: sts.unit(),
        Reserved: sts.unit(),
    }
})
