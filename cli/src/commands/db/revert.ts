import * as dotenv from 'dotenv'
import { Command } from '@oclif/command'


export default class RevertDb extends Command {
    static description = 'Revert the last performed migration'

    async run(): Promise<void> {
        dotenv.config()
    }
}
