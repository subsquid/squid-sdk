import type {Model} from '@subsquid/openreader/lib/model'
import {loadModel} from '@subsquid/openreader/lib/tools'
import {OutDir} from '@subsquid/util-internal-code-printer'
import fs from 'fs'
import os from 'os'
import path from 'path'


const tmpDirs: string[] = []


function tmpDir(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sqd-codegen-'))
    tmpDirs.push(dir)
    return dir
}


/**
 * Build a {@link Model} from an in-memory `schema.graphql` string by writing it
 * to a temp file and running openreader's `loadModel` — the same path the CLI
 * uses. openreader's base schema predeclares `@entity`/`@index`/`@unique`/
 * `@fulltext` and all scalars, so the string only needs the `type X @entity {…}`
 * definitions.
 */
export function modelFromSchema(schema: string): Model {
    const dir = tmpDir()
    const file = path.join(dir, 'schema.graphql')
    fs.writeFileSync(file, schema)
    return loadModel(file)
}


/**
 * A fresh {@link OutDir} pointed at a throwaway temp directory. `generateOrmModels`
 * writes real files, so tests read them back from `root`.
 */
export function makeOutDir(): {dir: OutDir; root: string} {
    const root = tmpDir()
    return {dir: new OutDir(root), root}
}


export function readGenerated(root: string, file: string): string {
    return fs.readFileSync(path.join(root, file), 'utf8')
}


export function listGenerated(root: string): string[] {
    return fs.existsSync(root) ? fs.readdirSync(root) : []
}


/** Remove every temp directory created during the test run. Call from `afterEach`. */
export function cleanupAll(): void {
    while (tmpDirs.length > 0) {
        const dir = tmpDirs.pop()!
        fs.rmSync(dir, {recursive: true, force: true})
    }
}
