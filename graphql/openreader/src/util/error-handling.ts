import {Logger, LogLevel} from "@subsquid/logger"
import {GraphQLError, printError} from "graphql"


export function logGraphQLError(log: Logger, err: GraphQLError, level: LogLevel = LogLevel.ERROR): void {
    if (log.level > level) return
    let msg = printError(err) + '\n'
    log.write(level, {
        graphqlOriginalError: err.originalError,
        graphqlPath: err.path?.join('.'),
        graphqlQuery: err.source?.body,
    }, msg)
}


export function withErrorContext(ctx: object): (err: unknown) => never {
    return function(err): never {
        throw addErrorContext(err, ctx)
    }
}


export function addErrorContext(error: unknown, ctx: object): Error {
    let e = ensureError(error)
    Object.assign(e, ctx)
    return e
}


export function ensureError(err: unknown): Error {
    if (err instanceof Error) return err
    return new NonErrorThrown(err)
}


export class NonErrorThrown extends Error {
    constructor(public readonly value: unknown) {
        super('Non error object thrown')
    }
}
