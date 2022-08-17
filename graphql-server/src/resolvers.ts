import {GraphQLSchema} from "graphql"
import {buildSchema, ContainerType, ResolverData} from "type-graphql"
import type {EntityManager} from "typeorm"
import {BigInteger, Bytes, DateTime} from "./scalars"
import {TypeormOpenreaderContext} from "./typeorm"


export async function loadCustomResolvers(mod: string): Promise<GraphQLSchema> {
    return buildSchema({
        resolvers: [mod],
        scalarsMap: [
            { type: Date, scalar: DateTime },
            { type: BigInt, scalar: BigInteger },
            { type: Buffer, scalar: Bytes }
        ],
        container: resolverData => new CustomResolversContainer(resolverData)
    })
}


export interface CustomResolverClass {
    new (tx: () => Promise<EntityManager>): this
}


class CustomResolversContainer implements ContainerType {
    private ctx: TypeormOpenreaderContext

    constructor(resolverData: ResolverData<{openreader: TypeormOpenreaderContext}>) {
        this.ctx = resolverData.context.openreader
    }

    get(resolverClass: CustomResolverClass): CustomResolverClass {
        return new resolverClass(() => this.ctx.getEntityManager())
    }
}
