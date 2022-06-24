import {Column, Entity, PrimaryColumn} from "typeorm"


@Entity()
export class Item {
    @PrimaryColumn()
    id!: string

    @Column()
    name?: string

    constructor(id?: string, name?: string) {
        if (id != null) {
            this.id = id
            this.name = name
        }
    }
}
