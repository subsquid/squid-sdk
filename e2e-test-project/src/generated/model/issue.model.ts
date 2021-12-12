import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToOne as OneToOne_} from "typeorm"
import {IssuePayment} from "./issuePayment.model"
import {IssueCancellation} from "./issueCancellation.model"

@Entity_()
export class Issue {
  constructor(props?: Partial<Issue>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @OneToOne_(() => IssuePayment)
  payment!: IssuePayment | undefined | null

  @OneToOne_(() => IssueCancellation)
  cancellation!: IssueCancellation | undefined | null
}
