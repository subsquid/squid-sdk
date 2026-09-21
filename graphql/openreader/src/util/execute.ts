import {Logger, LogLevel} from '@subsquid/logger'
import {addErrorContext} from '@subsquid/util-internal'
import {UserInputError} from '@subsquid/apollo-server-core'
import {getOperationRootType, GraphQLError, subscribe as graphqlSubscribe} from 'graphql'
import {ExecutionResult} from 'graphql-ws'
import {
    assertValidExecutionArguments,
    buildExecutionContext,
    collectFields,
    execute as graphqlExecute,
    ExecutionArgs,
    ExecutionContext
} from 'graphql/execution/execute'
import {getDocumentCtx, logGraphQLErrors} from './error-handling'


export interface ExecuteOptions {
    maxRootFields?: number
}


export async function openreaderExecute(args: ExecutionArgs, options: ExecuteOptions): Promise<ExecutionResult> {
    let log: Logger | undefined = args.contextValue.openreader.log?.child('gql')
    if (log?.isDebug()) {
        log.debug(getDocumentCtx(args), 'graphql query')
    }

    let result: ExecutionResult
    let errors = validate(args, options)
    if (errors.length > 0) {
        result = {errors}
    } else {
        result = await graphqlExecute(args)
    }

    logResult('graphql result', log, args, result)

    return result
}


type SubscriptionResult = AsyncIterableIterator<ExecutionResult> | ExecutionResult


export async function openreaderSubscribe(args: ExecutionArgs): Promise<SubscriptionResult> {
    let log: Logger | undefined = args.contextValue.openreader.log?.child('gql')
    if (log?.isDebug()) {
        log.debug(getDocumentCtx(args), 'graphql subscription')
    }

    let result: SubscriptionResult
    let errors = validate(args, {})
    if (errors.length > 0) {
        result = {errors}
    } else {
        result = await graphqlSubscribe(args)
    }

    if ((result as any)[Symbol.asyncIterator]) {
        log?.debug('graphql subscription initiated')
        if (log) return logSubscriptionResults(
            log,
            args,
            result as AsyncIterableIterator<ExecutionResult>
        )
    } else {
        logResult('graphql subscription result', log, args, result as ExecutionResult)
    }

    return result
}


async function *logSubscriptionResults(
    log: Logger,
    args: ExecutionArgs,
    results: AsyncIterableIterator<ExecutionResult>
): AsyncIterableIterator<ExecutionResult> {
    for await (let result of results) {
        logResult('graphql subscription result', log, args, result)
        yield result
    }
    log.debug('graphql subscription ended')
}


function logResult(msg: string, log: Logger | undefined, args: ExecutionArgs, result: ExecutionResult): void {
    if (log == null) return
    if (log.isDebug()) {
        log.debug({
            graphqlResult: log.isTrace() ? result : undefined
        }, msg)
    }
    logGraphQLErrors(log, args, result.errors)
}


function validate(args: ExecutionArgs, {maxRootFields}: ExecuteOptions): GraphQLError[] {
    assertValidExecutionArguments(args.schema, args.document, args.variableValues)

    let xtx = buildExecutionContext(
        args.schema,
        args.document,
        args.rootValue,
        args.contextValue,
        args.variableValues,
        args.operationName,
        args.fieldResolver,
        args.typeResolver
    )

    if (Array.isArray(xtx)) return xtx.map(err => addErrorContext(err, {
        __openreaderLogLevel: LogLevel.WARN
    }))

    let etx = xtx as ExecutionContext
    if (maxRootFields && etx.operation.operation == 'query') {
        let query = getOperationRootType(etx.schema, etx.operation)
        let fields = collectFields(
            etx,
            query,
            etx.operation.selectionSet,
            Object.create(null),
            Object.create(null)
        )
        let fieldsCount = Object.keys(fields).length
        if (fieldsCount > maxRootFields) {
            return  [
                new UserInputError(`only ${maxRootFields} root fields allowed, but got ${fieldsCount}`)
            ]
        }
    }

    return []
}
