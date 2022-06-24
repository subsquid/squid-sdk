import assert from "assert"
import type {EntityManager, FindConditions} from "typeorm"
import {EntityFieldsNames} from "typeorm/common/EntityFieldsNames"
import {ObjectLiteral} from "typeorm/common/ObjectLiteral"


export interface EntityClass<T> {
    new (): T
}


export interface Entity {
    id: string
}


/**
 * Defines a special criteria to find specific entity.
 */
export interface FindOneOptions<Entity = any> {
    /**
     * Adds a comment with the supplied string in the generated query.  This is
     * helpful for debugging purposes, such as finding a specific query in the
     * database server's logs, or for categorization using an APM product.
     */
    comment?: string
    /**
     * Simple condition that should be applied to match entities.
     */
    where?: FindConditions<Entity>[] | FindConditions<Entity> | ObjectLiteral | string;
    /**
     * Indicates what relations of entity should be loaded (simplified left join form).
     */
    relations?: string[];
    /**
     * Order, in which entities should be ordered.
     */
    order?: {
        [P in EntityFieldsNames<Entity>]?: "ASC" | "DESC" | 1 | -1;
    }
}


export interface FindManyOptions<Entity = any> extends FindOneOptions<Entity> {
    /**
     * Offset (paginated) where from entities should be taken.
     */
    skip?: number;
    /**
     * Limit (paginated) - max number of entities should be taken.
     */
    take?: number;
}


/**
 * Restricted version of TypeORM entity manager for squid data handlers.
 */
export class Store {
    constructor(private em: () => Promise<EntityManager>) {}

    /**
     * Saves a given entity or entities into the database.
     *
     * Unlike {@link EntityManager.save} it always
     * executes a primitive operation without cascades, relations, etc.
     */
    save<E extends Entity>(entity: E): Promise<void>
    save<E extends Entity>(entities: E[]): Promise<void>
    save<E extends Entity>(e: E | E[]): Promise<void> {
        return this.em().then(async em => {
            if (Array.isArray(e)) {
                if (e.length == 0) return
                let entityClass = e[0].constructor as EntityClass<E>
                for (let i = 1; i < e.length; i++) {
                    assert(entityClass === e[i].constructor, 'mass saving allowed only for entities of the same class')
                }
                for (let b of splitIntoBatches(e, 1000)) {
                    await em.upsert(entityClass, b as any, ['id'])
                }
            } else {
                await em.upsert(e.constructor as EntityClass<E>, e as any, ['id'])
            }
        })
    }

    /**
     * Inserts a given entity or entities into the database. 
     * Does not check if the entity(s) exist in the database and will fail if a duplicate is inserted.
     *
     * Executes a primitive INSERT operation without cascades, relations, etc.
     */
    insert<E extends Entity>(entity: E): Promise<void>
    insert<E extends Entity>(entities: E[]): Promise<void>
    insert<E extends Entity>(e: E | E[]): Promise<void> {
        return this.em().then(async em => {
            if (Array.isArray(e)) {
                if (e.length == 0) return
                let entityClass = e[0].constructor as EntityClass<E>
                for (let i = 1; i < e.length; i++) {
                    assert(entityClass === e[i].constructor, 'mass saving allowed only for entities of the same class')
                }
                for (let b of splitIntoBatches(e, 1000)) {
                    await em.insert(entityClass, b as any)
                }
            } else {
                await em.insert(e.constructor as EntityClass<E>, e as any)
            }
        })
    }

    /**
     * Deletes a given entity or entities from the database.
     *
     * Unlike {@link EntityManager.remove} executes a primitive DELETE query without cascades, relations, etc.
     */
    remove<E extends Entity>(entity: E): Promise<void>
    remove<E extends Entity>(entities: E[]): Promise<void>
    remove<E extends Entity>(entityClass: EntityClass<E>, id: string | string[]): Promise<void>
    remove<E extends Entity>(e: E | E[] | EntityClass<E>, id?: string | string[]): Promise<void>{
        return this.em().then(async em => {
            if (id == null) {
                if (Array.isArray(e)) {
                    if (e.length == 0) return
                    let entityClass = e[0].constructor as EntityClass<E>
                    for (let i = 1; i < e.length; i++) {
                        assert(entityClass === e[i].constructor, 'mass deletion allowed only for entities of the same class')
                    }
                    for (let b of splitIntoBatches(e, 10000)) {
                        await em.delete(entityClass, b.map(e => e.id))
                    }
                } else {
                    let entity = e as E
                    await em.delete(entity.constructor, entity.id)
                }
            } else {
                await em.delete(e as EntityClass<E>, id)
            }
        })
    }

    count<E extends Entity>(entityClass: EntityClass<E>, options?: FindOneOptions<E>): Promise<number>
    count<E extends Entity>(entityClass: EntityClass<E>, options?: FindManyOptions<E>): Promise<number>
    count<E extends Entity>(entityClass: EntityClass<E>, conditions?: FindConditions<E>): Promise<number>
    count(entityClass: any, options?: any): Promise<number> {
        return this.em().then(em => em.count(entityClass, options))
    }

    find<E extends Entity>(entityClass: EntityClass<E>, options?: FindManyOptions<E>): Promise<E[]>
    find<E extends Entity>(entityClass: EntityClass<E>, conditions?: FindConditions<E>): Promise<E[]>
    find(entityClass: any, options?: any): Promise<any[]> {
        return this.em().then(em => em.find(entityClass, options))
    }

    findByIds<E extends Entity>(entityClass: EntityClass<E>, ids: string[], options?: FindManyOptions<E>): Promise<E[]>
    findByIds<E extends Entity>(entityClass: EntityClass<E>, ids: string[], conditions?: FindConditions<E>): Promise<E[]>
    findByIds(entityClass: any, ids: any[], options?: any): Promise<any[]> {
        return this.em().then(em => em.findByIds(entityClass, ids, options))
    }

    findOne<E extends Entity>(entityClass: EntityClass<E>, id?: string, options?: FindOneOptions<E>): Promise<E | undefined>
    findOne<E extends Entity>(entityClass: EntityClass<E>, options?: FindOneOptions<E>): Promise<E | undefined>
    findOne<E extends Entity>(entityClass: EntityClass<E>, conditions?: FindConditions<E>, options?: FindOneOptions<E>): Promise<E | undefined>
    findOne(entityClass: any, conditions?: any, options?: any): Promise<any | undefined> {
        return this.em().then(em => em.findOne(entityClass, conditions, options))
    }

    findOneOrFail<E extends Entity>(entityClass: EntityClass<E>, id?: string, options?: FindOneOptions<E>): Promise<E>
    findOneOrFail<E extends Entity>(entityClass: EntityClass<E>, options?: FindOneOptions<E>): Promise<E>
    findOneOrFail<E extends Entity>(entityClass: EntityClass<E>, conditions?: FindConditions<E>, options?: FindOneOptions<E>): Promise<E>
    findOneOrFail(entityClass: any, conditions?: any, options?: any): Promise<any | undefined> {
        return this.em().then(em => em.findOneOrFail(entityClass, conditions, options))
    }

    get<E extends Entity>(entityClass: EntityClass<E>, optionsOrId?: FindOneOptions<E> | string): Promise<E | undefined> {
        if (typeof optionsOrId == 'string') { // please compiler
            return this.findOne(entityClass, optionsOrId)
        } else {
            return this.findOne(entityClass, optionsOrId)
        }
    }
}


function* splitIntoBatches<T>(list: T[], maxBatchSize: number): Generator<T[]> {
    if (list.length <= maxBatchSize) {
        yield list
    } else {
        let offset = 0
        while (list.length - offset > maxBatchSize) {
            yield list.slice(offset, offset + maxBatchSize)
            offset += maxBatchSize
        }
        yield list.slice(offset)
    }
}
