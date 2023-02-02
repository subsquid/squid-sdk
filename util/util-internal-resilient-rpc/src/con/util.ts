

export function getTime(): bigint {
    return process.hrtime.bigint()
}
