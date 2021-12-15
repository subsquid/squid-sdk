import { serve, ServerOptions } from '@subsquid/openreader/dist/server'
import { loadModel } from '@subsquid/openreader/dist/tools'
import dotenv from 'dotenv'
import * as path from 'path'
import { Pool } from 'pg'

async function main(): Promise<void> {
  const model = loadModel(path.join(__dirname, '../../schema.graphql'))
  const ormconfig = require('./ormconfig')
  const db = new Pool({
    host: ormconfig.host,
    port: ormconfig.port,
    user: ormconfig.username,
    password: ormconfig.password,
    database: ormconfig.database,
  })

  const options: ServerOptions = {
    model,
    db,
    port: process.env.GRAPHQL_SERVER_PORT || 3000,
  }

  let extensionModule: string | undefined
  try {
    extensionModule = require.resolve('../server-extension')
  } catch (e) {
    // ignore
  }
  if (extensionModule) {
    await require('./type-graphql').setup(extensionModule, options)
  }

  const info = await serve(options)
  console.log('Query node is listening on port ' + info.port)
}

if (require.main === module) {
  dotenv.config()
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
