import {EntityManager} from "typeorm"
import {EntityTarget} from "typeorm/common/EntityTarget"
import {FindOneOptions} from "typeorm/find-options/FindOneOptions"


export interface Store extends EntityManager {
    get<Entity>(entityClass: EntityTarget<Entity>, optionsOrId?: FindOneOptions<Entity> | string): Promise<Entity | undefined>
}
