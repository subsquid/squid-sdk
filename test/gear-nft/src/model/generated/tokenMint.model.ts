import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import {Account} from "./account.model"

@Entity_()
export class TokenMint {
  constructor(props?: Partial<TokenMint>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("text", {nullable: false})
  name!: string

  @Column_("text", {nullable: false})
  description!: string

  @Column_("text", {nullable: false})
  media!: string

  @Column_("text", {nullable: false})
  reference!: string

  @Index_()
  @ManyToOne_(() => Account, {nullable: true})
  account!: Account

  @Column_("bool", {nullable: true})
  successful!: boolean | undefined | null
}
