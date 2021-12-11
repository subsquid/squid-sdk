import { EventRecord, Extrinsic } from '@polkadot/types/interfaces'
import { Codec } from '@polkadot/types/types'

export interface IQueryEvent {
  eventRecord: EventRecord
  blockNumber: number
  blockTimestamp: number
  indexInBlock: number
  eventName: string
  eventMethod: string
  eventParams: EventParameters
  extrinsic?: Extrinsic
  index: number
}

export interface EventParameters {
  // TODO how do we represent it?
  [key: string]: Codec
}

export class QueryEvent implements IQueryEvent {
  readonly eventRecord: EventRecord

  readonly blockNumber: number

  readonly blockTimestamp: number

  readonly extrinsic?: Extrinsic

  readonly indexInBlock: number

  constructor(
    eventRecord: EventRecord,
    blockNumber: number,
    indexInBlock: number,
    blockTimestamp: number,
    extrinsic?: Extrinsic
  ) {
    this.eventRecord = eventRecord
    this.extrinsic = extrinsic
    this.blockNumber = blockNumber
    this.indexInBlock = indexInBlock
    this.blockTimestamp = blockTimestamp
  }

  get eventName(): string {
    const event = this.eventRecord.event

    return `${event.section}.${event.method}`
  }

  get eventMethod(): string {
    return this.eventRecord.event.method
  }

  get eventParams(): EventParameters {
    const { event } = this.eventRecord
    const params: EventParameters = {}

    // Event data can be Null(polkadot type)
    if (!event.data.length) return params

    event.data.forEach((data, index) => {
      params[event.typeDef[index].type] = data
    })
    return params
  }

  // Get event index as number
  get index(): number {
    return this.indexInBlock
  }

  log(indent: number, logger: (str: string) => void): void {
    // Extract the phase, event
    const { event, phase } = this.eventRecord

    // Event data can be Null(polkadot type)
    if (!event.data.length) return

    logger(`\t\t\tParameters:`)
    event.data.forEach((data, index) => {
      logger(
        `\t\t\t\t${JSON.stringify(
          event.typeDef[index],
          null,
          2
        )}: ${data.toString()}`
      )
    })

    logger(
      `\t\t\tExtrinsic: ${
        this.extrinsic
          ? this.extrinsic.method.section + '.' + this.extrinsic.method.method
          : 'NONE'
      }`
    )
    logger(`\t\t\t\tPhase: ${phase.toString()}`)

    if (this.extrinsic) {
      logger(`\t\t\t\tParameters:`)
      this.extrinsic.args.forEach((arg) => {
        logger(`\t\t\t\t\t${arg.toRawType()}: ${arg.toString()}`)
      })
    }
  }
}
