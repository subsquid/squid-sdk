import {unexpectedCase} from "@subsquid/util-internal"
import assert from "assert"


export function printGqlArguments(args: object): string {
    let exp = print(args)
    assert(exp[0] == '{' && exp[exp.length - 1] == '}')
    return exp.slice(1, exp.length - 1)
}


function print(args: any): string {
    if (args == null) return ''
    switch(typeof args) {
        case 'string':
            return `"${args}"`
        case 'number':
        case 'boolean':
            return ''+args
        case 'object':
            if (Array.isArray(args)) {
                if (args.length == 0) return ''
                return `[${args.map(i => print(i)).filter(e => !!e).join(', ')}]`
            } else if (args.$) {
                return args.$
            } else {
                let fields: string[] = []
                for (let key in args) {
                    let exp = print(args[key])
                    if (exp) {
                        fields.push(`${key}: ${exp}`)
                    }
                }
                return fields.length ? `{${fields.join(', ')}}` : ''
            }
        default:
            throw unexpectedCase(typeof args)
    }
}
