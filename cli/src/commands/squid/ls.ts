import { Command, Flags, CliUx } from '@oclif/core';
import { squidList } from '../../rest-client/routes/squids';
import { versionList } from '../../rest-client/routes/versions';

export default class Ls extends Command {
    static description = 'List squids and squid versions';

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
                CliUx.ux.table(
                    deployments,
                    {
                        name: { header: 'version' },
                        artifactUrl: { header: 'endpoint' },
                        deploymentUrl: { header: 'source' },
                        status: { header: 'status' },
                        secretsStatus: { header: 'secrets' },
                        createdAt: { header: 'created at' },
                    },
                    { 'no-truncate': noTruncate }
                );
            }
        } else {
            const squids = await squidList();
            if (squids) {
                CliUx.ux.table(
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
