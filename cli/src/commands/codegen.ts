import { Command, Flags } from '@oclif/core'
import { loadModel } from '@subsquid/openreader/dist/tools'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { codegen, CodegenOptions } from '../codegen'
import { generateFtsMigrations } from '../fts'
import { OutDir } from '@subsquid/util'


export default class Codegen extends Command {
  static description = 'Analyze graphql schema and generate model/server files'

  static flags = {
    schema: Flags.string({
      char: 's',
      description: 'Schema path, can be file or directory',
      default: './schema.graphql',
    }),
  }

  async run(): Promise<void> {
    dotenv.config()
    const { flags } = await this.parse(Codegen)
    const model = loadModel(path.normalize(flags.schema))
    const pkg = readPackageJson()
    const options: CodegenOptions = {
      model,
      outDir: new OutDir('src/generated'),
    }
    if (pkg == null && pkg.dependencies?.['@subsquid/openreader'] == null) {
      options.withServer = false
    } else {
      options.withServer = true
    }
    if (pkg?.dependencies?.['type-graphql']) {
      options.withServerExtension = true
    }
    try {
      codegen(options)
      generateFtsMigrations(model, new OutDir('db/migrations'))
    } catch (e: any) {
      console.error(e.stack)
      process.exit(1)
    }
  }
}

function readPackageJson(): any | undefined {
  try {
    const content = fs.readFileSync('package.json', 'utf-8')
    return JSON.parse(content)
  } catch (e: any) {
    return undefined
  }
}
