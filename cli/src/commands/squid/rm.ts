import { Flags } from '@oclif/core';
import { prompt } from 'inquirer';
import { dim } from 'chalk';

import { deleteSquid, deleteSquidVersion } from '../../api';
import { CliCommand } from '../../command';

export default class Rm extends CliCommand {
    static description = 'Delete Squid or its version';
    static args = [
        {
            name: 'name',
            description: 'Squid name',
            required: true,
        },
    ];

    static flags = {
        versionName: Flags.string({
            name: 'version',
            char: 'v',
            description: `Delete specific version`,
            required: false,
        }),
    }

    async run(): Promise<void> {
        const { flags: { versionName }, args: { name } } = await this.parse(Rm);

        const approveMessage = versionName ?  `Version ${versionName}` : `All versions`
        const { approve } = await prompt([{
            name: 'approve',
            message: `${approveMessage} of Squid ${name} will be deleted. This can not de undone, are you sure? ${dim('[y/n]')}`
        }]);

        if (approve.toLowerCase() !== 'y') return

        if (versionName) {
            const squid = await deleteSquidVersion(name, versionName)
            this.log(`Deleted Squid version ${squid.versions[0]?.name}`);
            return
        }

        const squid = await deleteSquid(name);
        this.log(`Deleted Squid ${squid.name}`);
    }
}
