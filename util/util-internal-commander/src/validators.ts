import {InvalidArgumentError} from "commander"


export function nat(s: string): number {
    let n = parseInt(s, 10)
    if (Number.isSafeInteger(n) && n >= 0) return n
    throw new InvalidArgumentError('not a natural number')
}


export function Url(protocols?: string[]): (s: string) => string {
    return function(s: string) {
        let url: URL
        try {
            url = new URL(s)
        } catch(e: any) {
            throw new InvalidArgumentError('invalid url')
        }
        if (protocols?.length && protocols.indexOf(url.protocol) < 0) {
            throw new InvalidArgumentError(`invalid protocol, use ${protocols.join(', ')}`)
        }
        return url.toString()
    }
}
