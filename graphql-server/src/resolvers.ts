import assert from "assert"
import {DocumentNode, parse} from "graphql"
import {buildTypeDefsAndResolvers, ContainerType, ResolverData, ResolversMap} from "type-graphql"
import type {EntityManager} from "typeorm"
import {BigInteger, Bytes, DateTime} from "./scalars"
import {TypeormTransaction} from "./typeorm"


export interface CustomResolvers {
    typeDefs: DocumentNode
    resolvers: ResolversMap
}


export async function loadCustomResolvers(mod: string): Promise<CustomResolvers> {
    let {typeDefs, resolvers} = await buildTypeDefsAndResolvers({
        resolvers: [mod],
        scalarsMap: [
            { type: Date, scalar: DateTime },
            { type: BigInt, scalar: BigInteger },
            { type: Buffer, scalar: Bytes }
        ],
        container: resolverData => new CustomResolversContainer(resolverData)
    })
    return {
        resolvers,
        typeDefs: parse(typeDefs)
    }
}


export interface CustomResolverClass {
    new (tx: () => Promise<EntityManager>): this
}


class CustomResolversContainer implements ContainerType {
    private transaction: TypeormTransaction

    constructor(resolverData: ResolverData<any>) {
        let transaction = resolverData.context.openReaderTransaction
        assert(typeof transaction?.getEntityManager == 'function', 'expected typeorm transaction in the context')
        this.transaction = transaction
    }

    get(resolverClass: CustomResolverClass): CustomResolverClass {
        return new resolverClass(() => this.transaction.getEntityManager())
    }
}
