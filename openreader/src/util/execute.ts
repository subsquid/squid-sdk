import {getOperationRootType, GraphQLError} from 'graphql'
import {ExecutionResult} from 'graphql-ws'
import {
    assertValidExecutionArguments,
    buildExecutionContext,
    collectFields,
    execute as graphqlExecute,
    ExecutionArgs,
    ExecutionContext
} from 'graphql/execution/execute'
import {PromiseOrValue} from 'graphql/jsutils/PromiseOrValue'


export function executeWithLimit(maxQueries: number, args: ExecutionArgs): PromiseOrValue<ExecutionResult> {
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

    if (Array.isArray(xtx)) {
        return {errors: xtx}
    }

    let etx = xtx as ExecutionContext
    if (etx.operation.operation == 'query') {
        let query = getOperationRootType(etx.schema, etx.operation)
        let fields = collectFields(
            etx,
            query,
            etx.operation.selectionSet,
            Object.create(null),
            Object.create(null)
        )
        let fieldsCount = Object.keys(fields).length
        if (fieldsCount > maxQueries) {
            return {
                errors: [
                    new GraphQLError(`only ${maxQueries} root query fields allowed, but got ${fieldsCount}`)
                ]
            }
        }
    }

    return graphqlExecute(args)
}
