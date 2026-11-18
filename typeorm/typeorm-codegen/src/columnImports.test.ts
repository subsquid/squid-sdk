import {afterEach, describe, expect, it} from 'vitest'
import {generateOrmModels} from './codegen'
import {cleanupAll, makeOutDir, modelFromSchema, readGenerated} from './codegen.support'

function generate(schema: string) {
    const {dir, root} = makeOutDir()
    generateOrmModels(modelFromSchema(schema), dir)
    return {read: (file: string) => readGenerated(root, file)}
}

afterEach(cleanupAll)

describe('Column decorator imports', () => {
    it('omits Column for entities using only scalar decorators', () => {
        const model = generate(`
            type Record @entity {
                id: ID!
                name: String!
                count: Int
                amount: BigInt
                createdAt: DateTime
            }
        `).read('record.model.ts')
        expect(model).not.toContain('Column as Column_')
        expect(model).toContain('PrimaryColumn as PrimaryColumn_')
        expect(model).toContain('StringColumn as StringColumn_')
    })

    for (const field of ['status: Status', 'statuses: [Status!]', 'detail: Detail', 'details: [Detail!]']) {
        it(`imports Column for ${field}`, () => {
            const model = generate(`
                type Record @entity { id: ID! ${field} }
                enum Status { ACTIVE INACTIVE }
                type Detail { value: String }
            `).read('record.model.ts')
            expect(model).toContain('Column as Column_')
            expect(model).toContain('@Column_(')
        })
    }
})
