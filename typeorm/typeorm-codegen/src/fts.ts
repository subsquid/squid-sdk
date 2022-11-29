import type {FTS_Query, Model} from '@subsquid/openreader/lib/model'
import {OutDir} from '@subsquid/util-internal-code-printer'
import {toSnakeCase} from "@subsquid/util-naming"


const TS = 64060578000000


export function generateFtsMigrations(model: Model, dir: OutDir): void {
    for (const name in model) {
        const item = model[name]
        if (item.kind === 'fts') {
            generateMigration(name, item, dir)
        }
    }
}


function generateMigration(name: string, query: FTS_Query, dir: OutDir): void {
    const out = dir.file(`${name}.search.js`)

    out.block(`module.exports = class ${name}${TS}`, () => {
        out.line(`name = '${name}${TS}'`)

        const sources = query.sources.map((src) => {
            const table = toSnakeCase(src.entity)
            const ginIndex = `${toSnakeCase(name)}_${toSnakeCase(src.entity)}_idx`
            const tsvColumn = `${toSnakeCase(name)}_tsv`
            const tsvectorValue = src.fields
                .map((f) => {
                    return `setweight(to_tsvector('english', coalesce(${toSnakeCase(
                        f
                    )}, '')), 'A')`
                })
                .join(' || ')
            return {table, ginIndex, tsvColumn, tsvectorValue}
        })

        out.line()
        out.block('async up(queryRunner)', () => {
            sources.forEach((src) => {
                out.line(
                    `await queryRunner.query(\`ALTER TABLE "${src.table}" ADD COLUMN "${src.tsvColumn}" tsvector GENERATED ALWAYS AS (${src.tsvectorValue}) STORED\`)`
                )
                out.line(
                    `await queryRunner.query(\`CREATE INDEX "${src.ginIndex}" ON "${src.table}" USING GIN ("${src.tsvColumn}")\`)`
                )
            })
        })

        out.line()
        out.block('async down(queryRunner)', () => {
            sources.forEach((src) => {
                out.line(`await queryRunner.query('DROP INDEX "${src.ginIndex}"')`)
                out.line(
                    `await queryRunner.query('ALTER TABLE "${src.table}" DROP "${src.tsvColumn}"')`
                )
            })
        })
    })

    out.write()
}
