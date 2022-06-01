import type {EntityManager, FindConditions, FindManyOptions, FindOneOptions} from "typeorm"


export interface EntityClass<T> {
    new (): T
}


export class Store {
    constructor(private em: () => Promise<EntityManager>) {}

    query(query: string, parameters?: any[]): Promise<any> {
        return this.em().then(em => em.query(query, parameters))
    }

    save<Entity>(entity: Entity): Promise<Entity>
    save<Entity>(entities: Entity[]): Promise<Entity[]>
    save<Entity>(e: Entity | Entity[]): Promise<Entity | Entity[]> {
        return this.em().then(em => em.save(e))
    }

    insert<Entity extends object>(e: Entity): Promise<void> {
        return this.em().then(em => em.insert(e.constructor, e)).then()
    }

    remove<Entity>(entity: Entity): Promise<Entity>
    remove<Entity>(entities: Entity[]): Promise<Entity[]>
    remove<Entity>(e: Entity | Entity[]): Promise<Entity | Entity[]>{
        return this.em().then(em => em.remove(e))
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

    clear<Entity>(entityClass: EntityClass<Entity>): Promise<void> {
        return this.em().then(em => em.clear(entityClass))
    }

    get<Entity>(entityClass: EntityClass<Entity>, optionsOrId?: FindOneOptions<Entity> | string): Promise<Entity | undefined> {
        if (typeof optionsOrId == 'string') { // please compiler
            return this.findOne(entityClass, optionsOrId)
        } else {
            return this.findOne(entityClass, optionsOrId)
        }
    }
}
