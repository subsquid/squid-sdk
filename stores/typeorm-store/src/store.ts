import assert from "assert"
import type {EntityManager, FindConditions} from "typeorm"
import {EntityFieldsNames} from "typeorm/common/EntityFieldsNames"
import {ObjectLiteral} from "typeorm/common/ObjectLiteral"


export interface EntityClass<T> {
    new (): T
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


export class Store {
    constructor(private em: () => Promise<EntityManager>) {}

    save<Entity extends object>(entity: Entity): Promise<void>
    save<Entity extends object>(entities: Entity[]): Promise<void>
    save<Entity extends object>(e: Entity | Entity[]): Promise<void> {
        return this.em().then(em => {
            let entityClass: EntityClass<Entity>
            if (Array.isArray(e)) {
                if (e.length == 0) return
                entityClass = e[0].constructor as any
                for (let i = 1; i < e.length; i++) {
                    assert(entityClass === e[i], 'mass saving allowed only for entities of the same class')
                }
            } else {
                entityClass = e.constructor as any
            }
            return em.upsert(entityClass, e, ['id']).then()
        })
    }

    insert<Entity extends object>(e: Entity): Promise<void> {
        return this.em().then(em => em.insert(e.constructor, e)).then()
    }

    remove<Entity>(entity: Entity): Promise<void>
    remove<Entity>(entities: Entity[]): Promise<void>
    remove<Entity>(e: Entity | Entity[]): Promise<void>{
        return this.em().then(em => em.remove(e).then())
    }

    count<Entity>(entityClass: EntityClass<Entity>, options?: FindOneOptions<Entity>): Promise<number>
    count<Entity>(entityClass: EntityClass<Entity>, options?: FindManyOptions<Entity>): Promise<number>
    count<Entity>(entityClass: EntityClass<Entity>, conditions?: FindConditions<Entity>): Promise<number>
    count(entityClass: any, options?: any): Promise<number> {
        return this.em().then(em => em.count(entityClass, options))
    }

    find<Entity>(entityClass: EntityClass<Entity>, options?: FindManyOptions<Entity>): Promise<Entity[]>
    find<Entity>(entityClass: EntityClass<Entity>, conditions?: FindConditions<Entity>): Promise<Entity[]>
    find(entityClass: any, options?: any): Promise<any[]> {
        return this.em().then(em => em.find(entityClass, options))
    }

    findByIds<Entity>(entityClass: EntityClass<Entity>, ids: string[], options?: FindManyOptions<Entity>): Promise<Entity[]>
    findByIds<Entity>(entityClass: EntityClass<Entity>, ids: string[], conditions?: FindConditions<Entity>): Promise<Entity[]>
    findByIds(entityClass: any, ids: any[], options?: any): Promise<any[]> {
        return this.em().then(em => em.findByIds(entityClass, ids, options))
    }

    findOne<Entity>(entityClass: EntityClass<Entity>, id?: string, options?: FindOneOptions<Entity>): Promise<Entity | undefined>
    findOne<Entity>(entityClass: EntityClass<Entity>, options?: FindOneOptions<Entity>): Promise<Entity | undefined>
    findOne<Entity>(entityClass: EntityClass<Entity>, conditions?: FindConditions<Entity>, options?: FindOneOptions<Entity>): Promise<Entity | undefined>
    findOne(entityClass: any, conditions?: any, options?: any): Promise<any | undefined> {
        return this.em().then(em => em.findOne(entityClass, conditions, options))
    }

    findOneOrFail<Entity>(entityClass: EntityClass<Entity>, id?: string, options?: FindOneOptions<Entity>): Promise<Entity>
    findOneOrFail<Entity>(entityClass: EntityClass<Entity>, options?: FindOneOptions<Entity>): Promise<Entity>
    findOneOrFail<Entity>(entityClass: EntityClass<Entity>, conditions?: FindConditions<Entity>, options?: FindOneOptions<Entity>): Promise<Entity>
    findOneOrFail(entityClass: any, conditions?: any, options?: any): Promise<any | undefined> {
        return this.em().then(em => em.findOneOrFail(entityClass, conditions, options))
    }

    get<Entity>(entityClass: EntityClass<Entity>, optionsOrId?: FindOneOptions<Entity> | string): Promise<Entity | undefined> {
        if (typeof optionsOrId == 'string') { // please compiler
            return this.findOne(entityClass, optionsOrId)
        } else {
            return this.findOne(entityClass, optionsOrId)
        }
    }
}
