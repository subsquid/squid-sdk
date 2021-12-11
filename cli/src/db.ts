import execa from 'execa'
import * as path from 'path'
import * as fs from 'fs'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pgtools = require('pgtools')

export async function ormexec(cmd: string[]): Promise<boolean> {
  const ormconfig = resolveOrmConfig()
  if (ormconfig == null) return false

  const proc = execa.node(
    require.resolve('typeorm/cli.js'),
    [
      ...cmd,
      '--config',
      path.relative(process.cwd(), ormconfig), // typeorm doesn't accept absolute paths
    ],
    {
      stdout: 'inherit',
      stderr: 'inherit',
    }
  )

  const result = await proc
  if (result instanceof Error) {
    if (!result.stderr) {
      console.error(result)
    }
    return false
  } else {
    return true
  }
}

export async function create(): Promise<boolean> {
  const ormconfig = resolveOrmConfig()
  if (ormconfig == null) return false
  const cfg = require(ormconfig)

  try {
    await pgtools.createdb(
      {
        host: cfg.host,
        port: cfg.port,
        user: cfg.username,
        password: cfg.password,
      },
      cfg.database
    )
    return true
  } catch (e: any) {
    if (e?.name === 'duplicate_database') {
      console.log(`Database '${cfg.database}' already exists`)
      return true
    } else {
      console.error(e)
      return false
    }
  }
}

export async function drop(): Promise<boolean> {
  const ormconfig = resolveOrmConfig()
  if (ormconfig == null) return false
  const cfg = require(ormconfig)

  try {
    await pgtools.dropdb(
      {
        host: cfg.host,
        port: cfg.port,
        user: cfg.username,
        password: cfg.password,
      },
      cfg.database
    )
    return true
  } catch (e: any) {
    if (e?.name === 'invalid_catalog_name') {
      console.log(`Database '${cfg.database}' does not exist`)
      return true
    } else {
      console.error(e)
      return false
    }
  }
}

function resolveOrmConfig(): string | undefined {
  const loc = 'lib/generated/ormconfig.js'
  if (fs.existsSync(loc)) {
    return path.resolve(loc)
  } else {
    console.error(
      `Failed to locate ormconfig at ${loc}. Did you forget to run codegen or compile the code?`
    )
    return undefined
  }
}
