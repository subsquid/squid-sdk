import {Extrinsic} from '@polkadot/types/interfaces'
import {Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn} from 'typeorm'
import {formatId} from "../util/format"
import {fullName} from '../model'
import {ExtrinsicArg, SubstrateExtrinsic,} from '../substrate/data'
import {AbstractWarthogModel} from './AbstractWarthogModel'
import {SubstrateBlockEntity} from './SubstrateBlockEntity'
import {SubstrateEventEntity} from './SubstrateEventEntity'

export const EXTRINSIC_TABLE_NAME = 'substrate_extrinsic'

/**
 * TypeORM Entity class representing Extrinsic data
 */
@Entity({
  name: EXTRINSIC_TABLE_NAME,
})
export class SubstrateExtrinsicEntity
  extends AbstractWarthogModel
  implements SubstrateExtrinsic
{
  @PrimaryColumn()
  id!: string

  @Column({
    type: 'numeric',
  })
  tip!: bigint

  @Column('bigint')
  @Index()
  blockNumber!: number

  @Column()
  @Index()
  blockHash!: string

  @Column()
  versionInfo!: string

  @Column({
    type: 'jsonb',
  })
  meta!: unknown

  @Column()
  @Index()
  method!: string

  @Column()
  indexInBlock!: number

  @Column()
  @Index()
  section!: string

  @Column()
  @Index()
  name!: string

  @Column({
    type: 'jsonb',
  })
  args!: ExtrinsicArg[]

  @Column()
  signer!: string

  @Column()
  signature!: string

  @Column()
  nonce!: number

  @Column({
    type: 'jsonb',
  })
  era!: unknown

  @Column()
  hash!: string

  @Column()
  isSigned!: boolean

  @OneToMany(
    () => SubstrateEventEntity,
    (event: SubstrateEventEntity) => event.extrinsic
  ) // specify inverse side as a second parameter
  events!: SubstrateEventEntity[]

  @ManyToOne(() => SubstrateBlockEntity)
  @JoinColumn({ name: 'block_id', referencedColumnName: 'id' })
  block!: SubstrateBlockEntity
}

export function fromBlockExtrinsic(data: {
  e: Extrinsic
  blockEntity: SubstrateBlockEntity
  indexInBlock: number
}): SubstrateExtrinsicEntity {
  const extr = new SubstrateExtrinsicEntity()
  const { e, indexInBlock, blockEntity } = data
  const { height, hash } = blockEntity

  extr.id = formatId({
    height,
    index: indexInBlock,
    hash,
  })
  extr.block = blockEntity

  extr.blockNumber = height
  extr.blockHash = hash
  extr.indexInBlock = indexInBlock
  extr.signature = e.signature ? e.signature.toString() : ''
  extr.signer = e.signer ? e.signer.toString() : ''

  extr.method = (e.method && e.method.method) || 'NO_METHOD'
  extr.section = (e.method && e.method.section) || 'NO_SECTION'
  extr.name = fullName(e.method)

  extr.meta = e.meta?.toJSON() || {}
  extr.hash = e.hash?.toString() || ''

  extr.isSigned = e.isSigned
  extr.tip = e.tip ? e.tip.toBigInt() : BigInt(0)
  extr.versionInfo = e.version ? e.version.toString() : ''
  extr.nonce = e.nonce ? e.nonce.toNumber() : 0
  extr.era = e.era?.toJSON() || {}

  extr.args = []

  e.method.args.forEach((data, index) => {
    const name = e.meta.args[index].name.toString()
    const value = data.toJSON()
    const type = data.toRawType()

    extr.args.push({
      type,
      value,
      name,
    })
  })

  return extr
}
