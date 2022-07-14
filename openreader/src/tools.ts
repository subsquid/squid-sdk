import {mergeTypeDefs} from "@graphql-tools/merge"
import * as fs from "fs"
import * as path from "path"
import {parse, Source} from "graphql"
import process from "process"
import {buildModel, buildSchema} from "./model.schema"
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


export function resolveGraphqlSchema(projectDir?: string): string {
    let dir = projectDir || process.cwd()
    let loc = path.resolve(dir, 'schema.graphql')
    if (fs.existsSync(loc)) return loc
    loc = path.resolve(dir, 'schema')
    let stat = fs.statSync(loc, {throwIfNoEntry: false})
    if (stat?.isDirectory()) {
        let hasGraphql = fs.readdirSync(loc).some(item => item.endsWith('.graphql') || item.endsWith('.gql'))
        if (hasGraphql) return loc
    }
    throw new Error(`Failed to locate schema.graphql at ${dir}`)
}
