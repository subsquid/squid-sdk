import type {Dialect} from "../dialect"
import type {Model} from "../model"
import type {EntityListArguments} from "./args"
import type {FieldRequest} from "./fields"
import {mapRows} from "./mapping"
import {EntityListQueryPrinter} from "./printer"
import {AliasSet} from "./util"


export interface Query<T> {
    readonly sql: string
    readonly params: unknown[]
    map(rows: any[][]): T
}


export class EntityListQuery implements Query<any> {
    public readonly sql: string
    public readonly params: unknown[] = []

    constructor(
        model: Model,
        dialect: Dialect,
        entityName: string,
        args: EntityListArguments,
        private fields: FieldRequest[]
    ) {
        this.sql = new EntityListQueryPrinter(
            model,
            dialect,
            this.params,
            new AliasSet(),
            entityName,
            args,
            fields
        ).print()
    }

    map(rows: any[][]): any {
        return mapRows(rows, this.fields)
    }
}
