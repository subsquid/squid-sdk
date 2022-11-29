import {unexpectedCase} from "@subsquid/util-internal"
import {FieldRequest, FieldsByEntity} from '../ir/fields'


export function mapRows(rows: any[][], fields: FieldRequest[]): any[] {
    let result = new Array(rows.length)
    for (let i = 0; i < rows.length; i++) {
        result[i] = mapRow(rows[i], fields)
    }
    return result
}


export function mapRow(row: any[], fields: FieldRequest[], ifType?: string): any {
    let rec: any = {}
    for (let f of fields) {
        if (f.ifType != ifType) continue
        for (let alias of f.aliases) {
            switch(f.kind) {
                case "scalar":
                case "enum":
                case "list":
                    rec[alias] = row[f.index]
                    break
                case "object": {
                    let isNull = row[f.index]
                    rec[alias] = isNull ? null : mapRow(row, f.children)
                    break
                }
                case "union": {
                    let isTypeOf = row[f.index]
                    if (isTypeOf) {
                        let obj = mapRow(row, f.children, isTypeOf)
                        obj.isTypeOf = isTypeOf
                        rec[alias] = obj
                    } else {
                        rec[alias] = null
                    }
                    break
                }
                case "fk":
                case "lookup": {
                    let id = row[f.index]
                    if (id == null) {
                        rec[alias] = null
                    } else {
                        rec[alias] = mapRow(row, f.children)
                    }
                    break
                }
                case "list-lookup": {
                    let rows = row[f.index]
                    if (rows == null) {
                        rec[alias] = []
                    } else {
                        rec[alias] = mapRows(rows, f.children)
                    }
                    break
                }
                default:
                    throw unexpectedCase((f as any).kind)
            }
        }
    }
    return rec
}


export function mapQueryableRows(rows: any[][], fields: FieldsByEntity): any[] {
    let result = new Array(rows.length)
    for (let i = 0; i < rows.length; i++) {
        result[i] = mapQueryableRow(rows[i], fields)
    }
    return result
}


export function mapQueryableRow(row: any[], fields: FieldsByEntity): any {
    let entity = row[0]
    let rec = mapRow(row[1], fields[entity])
    rec._isTypeOf = entity
    return rec
}
