import type {EntityManager} from 'typeorm'

export function escapeIdentifier(em: EntityManager, name: string): string {
    return em.connection.driver.escape(name)
}
