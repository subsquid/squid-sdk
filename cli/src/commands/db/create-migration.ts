import * as dotenv from 'dotenv'
import cli from 'cli-ux'
import { Command } from '@oclif/command'
import { ormexec } from '../../db'

export default class CreateMigration extends Command {
  static description =
    'Analyze database state and generate migration to match the current schema'

  static args = [{ name: 'name' }]

  async run(): Promise<void> {
    dotenv.config()
    const { args } = this.parse(CreateMigration)
    if (!args.name) {
      args.name = await cli.prompt('Enter migration name', {
        required: true,
      })
    }
    const ok = await ormexec([
      'migration:generate',
      '--name',
      args.name,
      '--outputJs',
    ])
    process.exit(ok ? 0 : 1)
  }
}
