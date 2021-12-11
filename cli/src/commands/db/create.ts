import * as dotenv from 'dotenv'
import * as db from '../../db'
import { Command } from '@oclif/command'

export default class CreateDb extends Command {
  static description = 'Create target database'

  async run(): Promise<void> {
    dotenv.config()
    const ok = await db.create()
    process.exit(ok ? 0 : 1)
  }
}
