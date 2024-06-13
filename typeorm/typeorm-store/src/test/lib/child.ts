import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { Parent } from './parent';

@Entity()
export class Child {
  @PrimaryColumn()
  id!: string

  @Column()
  name?: string

  @ManyToOne(() => Parent, parent => parent.children)
  parent?: Parent

  constructor(id?: string, name?: string) {
    if (id != null) {
      this.id = id
      this.name = name
    }
  }
}
