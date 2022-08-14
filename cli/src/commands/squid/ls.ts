import { CliUx, Flags } from '@oclif/core';
import { CliCommand } from '../../command';
import { getSquid, getSquidList } from '../../api';

export default class Ls extends CliCommand {
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
            const squid = await getSquid(squidName);
            if (squid.versions) {
                CliUx.ux.table(
                  squid.versions,
                    {
                        name: { header: 'Version' },
                        artifactUrl: { header: 'Source' },
                        deploymentUrl: { header: 'Endpoint' },
                        status: { header: 'Status' },
                        secretsStatus: { header: 'Secrets' },
                        createdAt: { header: 'Created at' },
                    },
                    { 'no-truncate': noTruncate }
                );
            }
        } else {
            const squids = await getSquidList();
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
