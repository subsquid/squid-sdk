import { CliUx, Command, Flags } from '@oclif/core';
import { squidList } from '../../rest-client/routes/squids';
import { versionList } from '../../rest-client/routes/versions';

export default class Ls extends Command {
  static description = 'Squid or versions list';

  static flags = {
    name: Flags.string({
      char: 'n',
      description: 'Squid name',
      required: false,
    }),
    truncate: Flags.boolean({
      char: 't',
      description: 'truncate data in columns: false by default',
      required: false,
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Ls);
    const noTruncate = !flags.truncate;
    const squidName = flags.name;

    if (squidName) {
      const deployments = await versionList(squidName);
      if (!deployments) {
        return;
      }

      CliUx.ux.table(
        deployments as unknown as Record<string, unknown>[],
        {
          name: { header: 'version' },
          artifactUrl: { header: 'endpoint' },
          deploymentUrl: { header: 'source' },
          status: {},
          createdAt: { header: 'created at' },
        },
        { 'no-truncate': noTruncate }
      );
    } else {
      const squids = await squidList();
      if (!squids) {
        return;
      }

      CliUx.ux.table(
        squids as unknown as Record<string, unknown>[],
        {
          name: {},
          description: {},
        },
        { 'no-truncate': noTruncate }
      );
    }
  }
}
