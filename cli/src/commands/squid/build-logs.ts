import { Command } from '@oclif/core';
import { parseNameAndVersion } from '../../utils';
import { buildLogs } from '../../rest-client/routes/build-logs';

export default class BuildLogs extends Command {
  static description = 'Get build logs';
  static args = [
    {
      name: 'nameAndVersion',
      description: '<name> or <name@version>',
      required: true,
    },
  ];

  async run(): Promise<void> {
    const { args } = await this.parse(BuildLogs);
    const nameAndVersion = args.nameAndVersion;
    const { squidName, versionName } = parseNameAndVersion(
      nameAndVersion,
      this
    );

    this.log('Fetching logs...');

    await buildLogs(squidName, versionName);
  }
}
