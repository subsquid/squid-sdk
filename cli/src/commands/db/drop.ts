import * as dotenv from 'dotenv'
import * as db from '../../db'
import { Command } from '@oclif/command'

export default class DropDb extends Command {
  static description = 'Drop target database'

  async run(): Promise<void> {
    dotenv.config()
    const ok = await db.drop()
    process.exit(ok ? 0 : 1)
  }
}
