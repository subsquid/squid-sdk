import cli from 'cli-ux'
import { Command } from '@oclif/command'


export default class NewMigration extends Command {
    static description = 'Create template file for a new migration'

    static args = [{name: 'name'}]

    async run(): Promise<void> {
        const {args} = this.parse(NewMigration)
        if (!args.name) {
            args.name = await cli.prompt('Enter migration name', {
                required: true,
            })
        }

    }
}
