export function unique<T>(items: Iterable<T>): T[] {
    let set = new Set(items)
    return Array.from(set)
}

export function timeInterval(seconds: number): string {
    if (seconds < 60) {
        return Math.round(seconds) + 's'
    }
    let minutes = Math.ceil(seconds / 60)
    if (minutes < 60) {
        return minutes + 'm'
    }
    let hours = Math.floor(minutes / 60)
    minutes = minutes - hours * 60
    return hours + 'h ' + minutes + 'm'
}

export function addErrorContext<T extends Error>(err: T, ctx: any): T {
    let e = err as any
    for (let key in ctx) {
        switch (key) {
            case 'blockHeight':
            case 'blockHash':
                if (e.blockHeight == null && e.blockHash == null) {
                    e.blockHeight = ctx.blockHeight
                    e.blockHash = ctx.blockHash
                }
                break
            default:
                if (e[key] == null) {
                    e[key] = ctx[key]
                }
        }
    }
    return err
}

export function withErrorContext(ctx: any): (err: Error) => never {
    return function (err: Error): never {
        throw addErrorContext(err, ctx)
    }
}
