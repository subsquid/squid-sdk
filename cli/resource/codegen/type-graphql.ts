import { scalars } from '@subsquid/openreader/dist/scalars'
import type { ServerOptions } from '@subsquid/openreader/dist/server'
import { GraphQLFloat, GraphQLID, GraphQLInt, parse } from 'graphql'
import { buildTypeDefsAndResolvers, ContainerType } from 'type-graphql'
import { Connection, createConnection, EntityManager } from 'typeorm'

export const ID = GraphQLID
export const Int = GraphQLInt
export const Float = GraphQLFloat
export const DateTime = scalars.DateTime.gql
export const BigInteger = scalars.BigInt.gql
export const Bytes = scalars.Bytes.gql

export async function setup(
  extensionModule: string,
  options: ServerOptions
): Promise<void> {
  const { typeDefs, resolvers } = await buildTypeDefsAndResolvers({
    resolvers: [extensionModule],
    scalarsMap: [
      { type: Date, scalar: DateTime },
      { type: BigInt, scalar: BigInteger },
      { type: Buffer, scalar: Bytes },
    ],
    container: (resolverData) => resolverData.context.extensionContainer,
  })

  options.customTypeDefs = [parse(typeDefs)]
  options.customResolvers = resolvers

  const ormconfig = require('./ormconfig')
  const connection = await createConnection(ormconfig)
  options.customContext = async () => {
    return { extensionContainer: new DatabaseContainer(connection) }
  }
  options.customPlugins = [
    {
      async requestDidStart() {
        return {
          async willSendResponse(req: any) {
            req.context.extensionContainer.close()
          },
        }
      },
    },
  ]
}

interface Tx {
  em: EntityManager
  close: () => void
}

class DatabaseContainer implements ContainerType {
  private tx: Promise<Tx> | undefined
  private closed = false

  constructor(private connection: Connection) {}

  get<T>(constructor: { new (tx: () => Promise<EntityManager>): T }): T {
    return new constructor(async () => {
      if (this.closed) {
        throw new Error(
          'Response was already sent, too late to request transaction'
        )
      }
      if (this.tx == null) {
        this.tx = this.createTx()
      }
      const tx = await this.tx
      return tx.em
    })
  }

  private createTx(): Promise<Tx> {
    return new Promise((resolve, reject) => {
      this.connection
        .transaction('SERIALIZABLE', (em) => {
          return new Promise((close) => {
            resolve({ em, close: () => close(undefined) })
          })
        })
        .catch((err) => reject(err))
    })
  }

  close(): void {
    this.closed = true
    this.tx
      ?.then((tx) => tx.close())
      .catch(() => {
        // ignore error
      })
  }
}
