import {Column, Entity, ManyToOne, PrimaryColumn} from "typeorm"


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


@Entity()
export class Order {
    @PrimaryColumn()
    id!: string

    @ManyToOne(() => Item, {nullable: false})
    item!: Item

    @Column({nullable: false})
    qty!: number
}
