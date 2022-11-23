import {InvalidArgumentError} from "commander"


export function nat(s: string): number {
    let n = parseInt(s, 10)
    if (Number.isSafeInteger(n) && n >= 0) return n
    throw new InvalidArgumentError('Not a natural number')
}


export function Url(protocols?: string[]): (s: string) => string {
    return function(s: string) {
        let url: URL
        try {
            url = new URL(s)
        } catch(e: any) {
            throw new InvalidArgumentError('Invalid url')
        }
        if (protocols?.length && protocols.indexOf(url.protocol) < 0) {
            throw new InvalidArgumentError(`Unsupported protocol. Use one of: ${protocols.join(', ')}`)
        }
        return url.toString()
    }
}
