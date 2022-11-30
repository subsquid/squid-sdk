import assert from "assert"
import {EntityManager, FindOptionsOrder, FindOptionsRelations, FindOptionsWhere} from "typeorm"
import {EntityTarget} from "typeorm/common/EntityTarget"
import {ColumnMetadata} from 'typeorm/metadata/ColumnMetadata'


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
    where?: FindOptionsWhere<Entity>[] | FindOptionsWhere<Entity>
    /**
     * Indicates what relations of entity should be loaded (simplified left join form).
     */
    relations?: FindOptionsRelations<Entity>;
    /**
     * Order, in which entities should be ordered.
     */
    order?: FindOptionsOrder<Entity>
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
     * Upserts a given entity or entities into the database.
     *
     * Unlike {@link EntityManager.save} it always
     * executes a primitive operation without cascades, relations, etc.
     */
    save<E extends Entity>(entity: E): Promise<void>
    save<E extends Entity>(entities: E[]): Promise<void>
    async save<E extends Entity>(e: E | E[]): Promise<void> {
        if (Array.isArray(e)) {
            if (e.length == 0) return
            let entityClass = e[0].constructor as EntityClass<E>
            for (let i = 1; i < e.length; i++) {
                assert(entityClass === e[i].constructor, 'mass saving allowed only for entities of the same class')
            }
            await this.em().then(em => this.saveMany(em, entityClass, e))
        } else {
            await this.em().then(em => em.upsert(e.constructor as EntityClass<E>, e as any, ['id']))
        }
    }

    private async saveMany(em: EntityManager, entityClass: EntityClass<any>, entities: any[]): Promise<void> {
        assert(entities.length > 0)
        let metadata = em.connection.getMetadata(entityClass)
        let fk = metadata.columns.filter(c => c.relationMetadata)
        if (fk.length == 0) return this.upsertMany(em, entityClass, entities)
        let currentSignature = this.getFkSignature(fk, entities[0])
        let batch = []
        for (let e of entities) {
            let sig = this.getFkSignature(fk, e)
            if (sig === currentSignature) {
                batch.push(e)
            } else {
                await this.upsertMany(em, entityClass, batch)
                currentSignature = sig
                batch = [e]
            }
        }
        if (batch.length) {
            await this.upsertMany(em, entityClass, batch)
        }
    }

    private getFkSignature(fk: ColumnMetadata[], entity: any): bigint {
        let sig = 0n
        for (let i = 0; i < fk.length; i++) {
            let bit = fk[i].getEntityValue(entity) === undefined ? 0n : 1n
            sig |= (bit << BigInt(i))
        }
        return sig
    }

    private async upsertMany(em: EntityManager, entityClass: EntityClass<any>, entities: any[]): Promise<void> {
        for (let b of splitIntoBatches(entities, 1000)) {
            await em.upsert(entityClass, b as any, ['id'])
        }
    }

    /**
     * Inserts a given entity or entities into the database.
     * Does not check if the entity(s) exist in the database and will fail if a duplicate is inserted.
     *
     * Executes a primitive INSERT operation without cascades, relations, etc.
     */
    insert<E extends Entity>(entity: E): Promise<void>
    insert<E extends Entity>(entities: E[]): Promise<void>
    async insert<E extends Entity>(e: E | E[]): Promise<void> {
        if (Array.isArray(e)) {
            if (e.length == 0) return
            let entityClass = e[0].constructor as EntityClass<E>
            for (let i = 1; i < e.length; i++) {
                assert(entityClass === e[i].constructor, 'mass saving allowed only for entities of the same class')
            }
            await this.em().then(async em => {
                for (let b of splitIntoBatches(e, 1000)) {
                    await em.insert(entityClass, b as any)
                }
            })
        } else {
            await this.em().then(em => em.insert(e.constructor as EntityClass<E>, e as any))
        }
    }

    /**
     * Deletes a given entity or entities from the database.
     *
     * Unlike {@link EntityManager.remove} executes a primitive DELETE query without cascades, relations, etc.
     */
    remove<E extends Entity>(entity: E): Promise<void>
    remove<E extends Entity>(entities: E[]): Promise<void>
    remove<E extends Entity>(entityClass: EntityClass<E>, id: string | string[]): Promise<void>
    async remove<E extends Entity>(e: E | E[] | EntityClass<E>, id?: string | string[]): Promise<void>{
        if (id == null) {
            if (Array.isArray(e)) {
                if (e.length == 0) return
                let entityClass = e[0].constructor as EntityClass<E>
                for (let i = 1; i < e.length; i++) {
                    assert(entityClass === e[i].constructor, 'mass deletion allowed only for entities of the same class')
                }
                await this.em().then(em => em.delete(entityClass, e.map(i => i.id)))
            } else {
                let entity = e as E
                await this.em().then(em => em.delete(entity.constructor, entity.id))
            }
        } else {
            await this.em().then(em => em.delete(e as EntityClass<E>, id))
        }
    }

    count<E extends Entity>(entityClass: EntityClass<E>, options?: FindManyOptions<E>): Promise<number> {
        return this.em().then(em => em.count(entityClass, options))
    }

    countBy<E extends Entity>(entityClass: EntityClass<E>, where: FindOptionsWhere<E> | FindOptionsWhere<E>[]): Promise<number> {
        return this.em().then(em => em.countBy(entityClass, where))
    }

    find<E extends Entity>(entityClass: EntityClass<E>, options?: FindManyOptions<E>): Promise<E[]> {
        return this.em().then(em => em.find(entityClass, options))
    }

    findBy<E extends Entity>(entityClass: EntityClass<E>, where: FindOptionsWhere<E> | FindOptionsWhere<E>[]): Promise<E[]> {
        return this.em().then(em => em.findBy(entityClass, where))
    }

    findOne<E extends Entity>(entityClass: EntityClass<E>, options: FindOneOptions<E>): Promise<E | undefined> {
        return this.em().then(em => em.findOne(entityClass, options)).then(noNull)
    }

    findOneBy<E extends Entity>(entityClass: EntityClass<E>, where: FindOptionsWhere<E> | FindOptionsWhere<E>[]): Promise<E | undefined> {
        return this.em().then(em => em.findOneBy(entityClass, where)).then(noNull)
    }

    findOneOrFail<E extends Entity>(entityClass: EntityTarget<E>, options: FindOneOptions<E>): Promise<E> {
        return this.em().then(em => em.findOneOrFail(entityClass, options))
    }

    findOneByOrFail<E extends Entity>(entityClass: EntityTarget<E>, where: FindOptionsWhere<E> | FindOptionsWhere<E>[]): Promise<E> {
        return this.em().then(em => em.findOneByOrFail(entityClass, where))
    }

    get<E extends Entity>(entityClass: EntityClass<E>, optionsOrId: FindOneOptions<E> | string): Promise<E | undefined> {
        if (typeof optionsOrId == 'string') {
            return this.findOneBy(entityClass, {id: optionsOrId} as any)
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


function noNull<T>(val: null | undefined | T): T | undefined {
    return val == null ? undefined : val
}
