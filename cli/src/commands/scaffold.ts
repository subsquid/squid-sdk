import {Command, Flags} from '@oclif/core'
import {scaffold} from '../scaffold'


export default class Scaffold extends Command {
  static description = `Starter kit: creates initial project layout`

  static flags = {
    dir: Flags.string({
      char: 'd',
      description: 'Project directory',
      default: process.cwd(),
    }),

    server: Flags.boolean({
      description: 'Include GraphQL server',
      allowNo: true,
      default: true,
    }),

    'server-extension': Flags.boolean({
      description: 'Include support for GraphQL server extension',
      default: false,
    }),

    silent: Flags.boolean({
      description:
        'If present, the scaffolder is non-interactive and uses only provided CLI flags',
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Scaffold)

    scaffold({
      targetDir: flags.dir,
      withServer: flags.server,
      withServerExtension: flags['server-extension'],
    })
  }
}
