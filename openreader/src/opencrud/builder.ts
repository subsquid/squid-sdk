import {unexpectedCase} from "@subsquid/util-internal"
import assert from "assert"
import {GraphQLInterfaceType, GraphQLObjectType, GraphQLOutputType} from "graphql"
import {Entity, JsonObject, Model} from "../model"


export class SchemaBuilder {
    private types = new Map<string, GraphQLOutputType>()

    constructor(private model: Model) {
    }

    private get(name: string): GraphQLOutputType
    private get<T extends GraphQLOutputType>(name: string, kind: Type<T>): T
    private get(name: string, kind?: Type<any>): GraphQLOutputType {
        let type = this.types.get(name)
        if (type == null) {
            type = this.buildType(name)
            this.types.set(name, type)
        }
        if (kind) {
            assert(type instanceof kind)
        }
        return type
    }

    private buildType(name: string): GraphQLOutputType {
        let item = this.model[name]
        switch(item.kind) {
            case "entity":
            case "object":
                return this.buildObjectType(name, item)
            default:
                throw unexpectedCase()
        }
    }

    private buildObjectType(name: string, object: Entity | JsonObject): GraphQLObjectType {
        return new GraphQLObjectType({
            name,
            description: object.description,
            interfaces: () => object.interfaces?.map(name => this.get(name, GraphQLInterfaceType)),
            fields: {}
        })
    }
}


interface Type<T> {
    new (...args: any[]): T
}
