import {Model} from '@subsquid/openreader/lib/model'
import {assertNotNull} from '@subsquid/util-internal'
import {PluginDefinition, GraphQLRequest} from '@subsquid/apollo-server-core'
import {GraphQLSchema, OperationDefinitionNode} from 'graphql'


export interface HttpHeaders extends Iterable<[string, string]> {
    get(name: string): string | null
    has(name: string): boolean
    entries(): Iterator<[string, string]>
    keys(): Iterator<string>
}


export interface HttpRequest {
    readonly url: string
    readonly method: string
    readonly headers: HttpHeaders
}


export interface RequestCheckContext {
    http: HttpRequest
    request: GraphQLRequest
    operation: OperationDefinitionNode
    operationName: string | null
    schema: GraphQLSchema
    context: Record<string, any>
    model: Model
}


export interface RequestCheckFunction {
    (req: RequestCheckContext): Promise<boolean | string>
}


export function createCheckPlugin(requestCheck: RequestCheckFunction, model: Model): PluginDefinition {
    return {
        async requestDidStart() {
            return {
                async responseForOperation(ctx) {
                    let ok = await requestCheck({
                        http: assertNotNull(ctx.request.http),
                        request: ctx.request,
                        operation: ctx.operation,
                        operationName: ctx.operationName,
                        schema: ctx.schema,
                        context: ctx.context,
                        model
                    })
                    if (typeof ok == 'string') {
                        return {errors: [{message: ok}]}
                    } else if (ok) {
                        return null
                    } else {
                        return {errors: [{message: 'not allowed'}]}
                    }
                }
            }
        }
    }
}
