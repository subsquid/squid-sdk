import { Command, Flags } from '@oclif/core';
import { cli } from 'cli-ux';
import { squidList } from '../../rest-client/routes/squids';
import { versionList } from '../../rest-client/routes/versions';

export default class Ls extends Command {
    static description = 'Squid or versions list';

    static flags = {
        name: Flags.string({
            char: 'n',
            description: 'squid name',
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
            if (deployments) {
                cli.table(
                    deployments,
                    {
                        name: { header: 'version name' },
                        artifactUrl: { header: 'artifactUrl' },
                        deploymentUrl: { header: 'deploymentUrl' },
                        status: {},
                        createdAt: { header: 'Created at' },
                    },
                    { 'no-truncate': noTruncate }
                );
            }
        } else {
            const squids = await squidList();
            if (squids) {
                cli.table(
                    squids,
                    {
                        name: {},
                        description: {},
                    },
                    { 'no-truncate': noTruncate }
                );
            }
        }
    }
}
