import cli from 'cli-ux'
import { Command } from '@oclif/command'
import { ormexec } from '../../db'

export default class NewMigration extends Command {
  static description = 'Create a file for a new migration'

  static args = [{ name: 'name' }]

  async run(): Promise<void> {
    const { args } = this.parse(NewMigration)
    if (!args.name) {
      args.name = await cli.prompt('Enter migration name', {
        required: true,
      })
    }
    const ok = await ormexec([
      'migration:create',
      '--name',
      args.name,
      '--outputJs',
    ])
    process.exit(ok ? 0 : 1)
  }
}
