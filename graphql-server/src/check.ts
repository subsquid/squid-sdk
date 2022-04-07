import {Model} from "@subsquid/openreader/dist/model"
import {assertNotNull} from "@subsquid/util-internal"
import {PluginDefinition} from "apollo-server-core"
import {GraphQLSchema, OperationDefinitionNode} from "graphql"


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
    operation: OperationDefinitionNode
    operationName: string | null
    schema: GraphQLSchema
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
                        operation: ctx.operation,
                        operationName: ctx.operationName,
                        schema: ctx.schema,
                        model
                    })
                    if (typeof ok == 'string') {
                        return {errors: [{message: ok}]}
                    }
                    if (ok) return null
                    return {
                        errors: [{message: 'not allowed'}]
                    }
                }
            }
        }
    }
}
