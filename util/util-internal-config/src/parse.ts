import * as jsonc from 'jsonc-parser'


export function parse(text: string): any {
    let errors: jsonc.ParseError[] = []

    let obj = jsonc.parse(text, errors, {
        allowTrailingComma: true,
        allowEmptyContent: false
    })

    if (errors.length > 0) {
        let err = errors[0]
        throw new JsonSyntaxError(
            jsonc.printParseErrorCode(err.error),
            err.offset,
            err.length
        )
    }

    return obj
}


export class JsonSyntaxError extends Error {
    constructor(
        public readonly code: string,
        public readonly offset: number,
        public readonly length: number
    ) {
        super()
    }
}
