
export const CandidateHash = sts.bytes()

export const DisputeResult = sts.closedEnum(() => {
    return  {
        Invalid: sts.unit(),
        Valid: sts.unit(),
    }
})

export const DisputeLocation = sts.closedEnum(() => {
    return  {
        Local: sts.unit(),
        Remote: sts.unit(),
    }
})
