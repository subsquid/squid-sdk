type GetPatternParamNames<P> = P extends `${string}{${infer Rest}`
    ? Rest extends `${infer Name}}${infer End}`
        ? Name | GetPatternParamNames<End>
        : never
    : never


export type GetPatternParams<P> = {
    [K in GetPatternParamNames<P>]: string
}


export class PathPattern {
    private regex: RegExp
    private names: string[]

    constructor(pattern: string) {
        let names: string[] = []
        let parts = pattern.split('{')
        let re = escapeRegex(parts[0])
        for (let part of parts.slice(1)) {
            let pair = part.split('}')
            if (pair.length != 2) throw new Error(`invalid pattern: ${pattern}`)
            names.push(pair[0])
            re += '([^\\\\/]+)'
            re += escapeRegex(pair[1])
        }
        this.regex = new RegExp('^' + re + '$')
        this.names = names
    }

    match(path: string): Record<string, string> | undefined {
        let m = this.regex.exec(path)
        if (m) return this.toParams(m)
    }

    private toParams(m: string[]): Record<string, string>  | undefined {
        let params: Record<string, string> = {}
        for (let i = 0; i < this.names.length; i++) {
            try {
                params[this.names[i]] = decodeURIComponent(m[i+1])
            } catch(err: any) {
                return undefined
            }
        }
        return params
    }
}


function escapeRegex(s: string): string {
    return s.replace(/([.*+?=^!:${}()|[\]\/\\])/g, '\\$1')
}
