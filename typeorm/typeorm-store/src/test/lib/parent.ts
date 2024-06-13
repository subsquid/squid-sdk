import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { Child } from './child';

@Entity()
export class Parent {
  @PrimaryColumn()
  id!: string

  @Column()
  name?: string

  @OneToMany(() => Child, item => item.parent)
  children?: Child[]

  constructor(id?: string, name?: string) {
    if (id != null) {
      this.id = id
      this.name = name
    }
  }
}