import {formatId} from "../util/format"
import {
  EventInfo,
  ExtrinsicInfo,
  SubstrateBlock,
} from '../substrate/data'
import { Column, Entity, Index, PrimaryColumn } from 'typeorm'
import { BlockData, fullName, getExtrinsic } from '../model'
import { AbstractWarthogModel } from './AbstractWarthogModel'

/**
 * TypeORM Entity class representing block data
 */
@Entity({
  name: 'substrate_block',
})
export class SubstrateBlockEntity
  extends AbstractWarthogModel
  implements SubstrateBlock
{
  @PrimaryColumn()
  id!: string

  @Column()
  @Index()
  height!: number

  @Column('bigint')
  timestamp!: number

  @Column()
  @Index()
  hash!: string

  @Column()
  @Index()
  parentHash!: string

  @Column()
  stateRoot!: string

  @Column()
  extrinsicsRoot!: string

  @Column()
  validatorId!: string

  @Column({ type: 'jsonb' })
  runtimeVersion!: unknown

  @Column({ type: 'jsonb' })
  lastRuntimeUpgrade!: unknown

  @Column({ type: 'jsonb' })
  events!: EventInfo[]

  @Column({ type: 'jsonb' })
  extrinsics!: ExtrinsicInfo[]

  static fromBlockData({
    lastRuntimeUpgrade,
    runtimeVersion,
    events,
    signedBlock: { block },
    timestamp,
    validatorId,
  }: BlockData): SubstrateBlockEntity {
    const { header } = block
    const entity = new SubstrateBlockEntity()

    entity.lastRuntimeUpgrade = lastRuntimeUpgrade
      ? lastRuntimeUpgrade.toJSON()
      : {}

    entity.runtimeVersion = runtimeVersion ? runtimeVersion.toJSON() : {}

    entity.hash = header.hash.toHex()
    entity.parentHash = header.parentHash.toHex()
    entity.stateRoot = header.stateRoot.toHex()
    entity.height = header.number.toNumber()
    entity.extrinsicsRoot = header.extrinsicsRoot.toHex()
    entity.validatorId = validatorId?.toHuman()
    entity.timestamp = timestamp
    entity.id = formatId({ height: entity.height, hash: entity.hash })

    entity.extrinsics = block.extrinsics.map((extrinsic, index) => {
      return {
        id: formatId({ height: entity.height, index, hash: entity.hash }),
        name: fullName(extrinsic.method),
      }
    })

    entity.events = events.map((eventRecord, index) => {
      const extrinsic = getExtrinsic({
        record: eventRecord,
        extrinsics: block.extrinsics,
      })
      return {
        id: formatId({ height: entity.height, index, hash: entity.hash }),
        name: fullName(eventRecord.event),
        extrinsic: extrinsic ? fullName(extrinsic.method) : 'none',
      }
    })

    return entity
  }
}
