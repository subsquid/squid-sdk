import * as dotenv from 'dotenv'
import { Command } from '@oclif/command'
import { ormexec } from '../../db'

export default class Migrate extends Command {
  static description = 'Apply database migrations'

  async run(): Promise<void> {
    dotenv.config()
    const ok = await ormexec(['migration:run'])
    process.exit(ok ? 0 : 1)
  }
}
