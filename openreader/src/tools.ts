import {mergeTypeDefs} from "@graphql-tools/merge"
import * as fs from "fs"
import * as path from "path"
import {parse, Source} from "graphql"
import {buildModel, buildSchema} from "./gql/schema"
import type {Model} from "./model"


export function loadModel(schemaFile: string): Model {
    let files: string[] = []
    if (fs.statSync(schemaFile).isDirectory()) {
        fs.readdirSync(schemaFile, {withFileTypes: true}).forEach(item => {
            if (item.isFile() && (item.name.endsWith('.graphql') || item.name.endsWith('.gql'))) {
                files.push(path.join(schemaFile, item.name))
            }
        })
    } else {
        files.push(schemaFile)
    }

    let docs = files.map(f => {
        let src = new Source(
            fs.readFileSync(f, 'utf-8'),
            f
        )
        return parse(src)
    })

    if (docs.length == 0) return {}
    let doc = docs.length == 1 ? docs[0] : mergeTypeDefs(docs)
    let schema = buildSchema(doc)
    return buildModel(schema)
}
