import fs from 'fs'
import path from 'path'
import {afterEach, describe, expect, it} from 'vitest'
import {generateFtsMigrations} from './fts'
import {cleanupAll, makeOutDir, modelFromSchema} from './codegen.support'


afterEach(() => cleanupAll())


describe('generateFtsMigrations', () => {
    it('generates a deterministic fulltext-search migration', () => {
        const {dir, root} = makeOutDir()
        const model = modelFromSchema(`
            type Comment @entity {
                id: ID!
                text: String! @fulltext(query: "commentSearch")
            }
        `)
        generateFtsMigrations(model, dir)

        const file = path.join(root, 'commentSearch.search.js')
        expect(fs.existsSync(file)).toBe(true)
        const migration = fs.readFileSync(file, 'utf8')
        // fixed timestamp keeps the class/migration name stable across runs
        expect(migration).toContain('64060578000000')
        expect(migration).toContain('ALTER TABLE "comment" ADD COLUMN')
        expect(migration).toContain('tsvector GENERATED ALWAYS AS')
        expect(migration).toContain('CREATE INDEX')
    })
})
