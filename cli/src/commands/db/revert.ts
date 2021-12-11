import * as dotenv from 'dotenv'
import { Command } from '@oclif/command'
import { ormexec } from '../../db'

export default class RevertDb extends Command {
  static description = 'Revert the last performed migration'

  async run(): Promise<void> {
    dotenv.config()
    const ok = await ormexec(['migration:revert'])
    process.exit(ok ? 0 : 1)
  }
}
