import { Command, flags } from '@oclif/command'
import { scaffold } from '../scaffold'

export default class Scaffold extends Command {
  static description = `Starter kit: creates initial project layout`

  static flags: Flags = {
    dir: flags.string({
      char: 'd',
      description: 'Project directory',
      default: process.cwd(),
    }),

    server: flags.boolean({
      description: 'Include GraphQL server',
      allowNo: true,
      default: true,
    }),

    'server-extension': flags.boolean({
      description: 'Include support for GraphQL server extension',
      default: false,
    }),

    silent: flags.boolean({
      description:
        'If present, the scaffolder is non-interactive and uses only provided CLI flags',
    }),
  }

  async run(): Promise<void> {
    const { flags } = this.parse(Scaffold)

    scaffold({
      targetDir: flags.dir,
      withServer: flags.server,
      withServerExtension: flags['server-extension'],
    })
  }
}

type Flags = flags.Input<{
    dir: string
    server: boolean
    'server-extension': boolean
    silent?: boolean
}>
