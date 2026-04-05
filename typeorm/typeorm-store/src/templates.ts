import type {EntityManager} from 'typeorm'
import {escapeIdentifier} from './misc'

export interface TemplateMutation {
    type: 'add' | 'delete'
    key: string
    value: string
    blockNumber: number
}

export class TemplateRegistryTracker {

    constructor(
        private readonly em: EntityManager,
        private readonly statusSchema: string,
        private readonly height: number,
    ) { }

    async persist(mutations: TemplateMutation[]): Promise<void> {
        if (mutations.length === 0) return
        let s = escapeIdentifier(this.em, this.statusSchema)
        for (let m of mutations) {
            await this.em.query(
                `INSERT INTO ${s}.template_registry (key, value, type, block_number, height) ` +
                    `VALUES ($1, $2, $3, $4, $5) ` +
                    `ON CONFLICT (key, value, type, block_number) DO NOTHING`,
                [m.key, m.value, m.type === 'add', m.blockNumber, this.height]
            )
        }
    }
}
