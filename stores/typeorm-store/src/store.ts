import type {EntityManager, EntityTarget, FindConditions, FindManyOptions, FindOneOptions} from "typeorm"


export class Store {
    constructor(private em: () => Promise<EntityManager>) {}

    query(query: string, parameters?: any[]): Promise<any> {
        return this.em().then(em => em.query(query, parameters))
    }

    save<Entity>(entity: Entity): Promise<Entity>
    save<Entity>(entities: Entity[]): Promise<Entity[]>
    save<Entity>(e: Entity | Entity[]): Promise<Entity | Entity[]>{
        return this.em().then(em => em.save(e))
    }

    remove<Entity>(entity: Entity): Promise<Entity>
    remove<Entity>(entities: Entity[]): Promise<Entity[]>
    remove<Entity>(e: Entity | Entity[]): Promise<Entity | Entity[]>{
        return this.em().then(em => em.remove(e))
    }

    count<Entity>(entityClass: EntityTarget<Entity>, options?: FindOneOptions<Entity>): Promise<number>
    count<Entity>(entityClass: EntityTarget<Entity>, options?: FindManyOptions<Entity>): Promise<number>
    count<Entity>(entityClass: EntityTarget<Entity>, conditions?: FindConditions<Entity>): Promise<number>
    count(entityClass: any, options?: any): Promise<number> {
        return this.em().then(em => em.count(entityClass, options))
    }

    find<Entity>(entityClass: EntityTarget<Entity>, options?: FindManyOptions<Entity>): Promise<Entity[]>
    find<Entity>(entityClass: EntityTarget<Entity>, conditions?: FindConditions<Entity>): Promise<Entity[]>
    find(entityClass: any, options?: any): Promise<any[]> {
        return this.em().then(em => em.find(entityClass, options))
    }

    findByIds<Entity>(entityClass: EntityTarget<Entity>, ids: string[], options?: FindManyOptions<Entity>): Promise<Entity[]>
    findByIds<Entity>(entityClass: EntityTarget<Entity>, ids: string[], conditions?: FindConditions<Entity>): Promise<Entity[]>
    findByIds(entityClass: any, ids: any[], options?: any): Promise<any[]> {
        return this.em().then(em => em.findByIds(entityClass, ids, options))
    }

    findOne<Entity>(entityClass: EntityTarget<Entity>, id?: string, options?: FindOneOptions<Entity>): Promise<Entity | undefined>
    findOne<Entity>(entityClass: EntityTarget<Entity>, options?: FindOneOptions<Entity>): Promise<Entity | undefined>
    findOne<Entity>(entityClass: EntityTarget<Entity>, conditions?: FindConditions<Entity>, options?: FindOneOptions<Entity>): Promise<Entity | undefined>
    findOne(entityClass: any, conditions?: any, options?: any): Promise<any | undefined> {
        return this.em().then(em => em.findOne(entityClass, conditions, options))
    }

    findOneOrFail<Entity>(entityClass: EntityTarget<Entity>, id?: string, options?: FindOneOptions<Entity>): Promise<Entity>
    findOneOrFail<Entity>(entityClass: EntityTarget<Entity>, options?: FindOneOptions<Entity>): Promise<Entity>
    findOneOrFail<Entity>(entityClass: EntityTarget<Entity>, conditions?: FindConditions<Entity>, options?: FindOneOptions<Entity>): Promise<Entity>
    findOneOrFail(entityClass: any, conditions?: any, options?: any): Promise<any | undefined> {
        return this.em().then(em => em.findOneOrFail(entityClass, conditions, options))
    }

    clear<Entity>(entityClass: EntityTarget<Entity>): Promise<void> {
        return this.em().then(em => em.clear(entityClass))
    }

    get<Entity>(entityClass: EntityTarget<Entity>, optionsOrId?: FindOneOptions<Entity> | string): Promise<Entity | undefined> {
        if (typeof optionsOrId == 'string') { // please compiler
            return this.findOne(entityClass, optionsOrId)
        } else {
            return this.findOne(entityClass, optionsOrId)
        }
    }
}
