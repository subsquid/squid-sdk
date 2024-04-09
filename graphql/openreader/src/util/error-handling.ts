import {Logger, LogLevel} from '@subsquid/logger'
import {weakMemo} from '@subsquid/util-internal'
import {ExecutionArgs, GraphQLError, print} from 'graphql'


export interface DocumentCtx {
    graphqlOperationName?: string
    graphqlDocument: string
    graphqlVariables: any
}


export const getDocumentCtx = weakMemo((args: ExecutionArgs): DocumentCtx => {
    return {
        graphqlOperationName: args.operationName || undefined,
        graphqlDocument: print(args.document),
        graphqlVariables: args.variableValues
    }
})


export function logGraphQLErrors(
    log: Logger,
    args: ExecutionArgs,
    errors: readonly GraphQLError[] | undefined,
): void {
    if (!errors?.length) return
    let level = 0
    let graphqlErrors = errors.map(err => {
        level = Math.max(level, getErrorLevel(err))
        return {
            message: err.message,
            path: err.path?.join('.'),
            extensions: err.extensions,
            originalError: err.originalError
        }
    })
    if (log.level > level) return
    log.write(level, {
        graphqlErrors,
        ...getDocumentCtx(args)
    }, 'graphql query ended with errors')
}


function getErrorLevel(err: GraphQLError): LogLevel {
    if ((err as any).__openreaderLogLevel) return (err as any).__openreaderLogLevel
    if (err.extensions?.code === 'BAD_USER_INPUT') return LogLevel.WARN
    return LogLevel.ERROR
}
