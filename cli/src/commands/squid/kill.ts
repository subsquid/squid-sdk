import { Command } from '@oclif/core';
import {
    destroyApp,
    destroyDeployment,
} from '../../rest-client/routes/destroy';
import { parseNameAndVersion } from '../../utils'

export default class Kill extends Command {
    static description = 'Kill a squid or a squid version';
    static args = [
        {
            name: 'nameAndVersion',
            description: '<name> or <name@version>',
            required: true,
        },
    ];

    async run(): Promise<void> {
        const { flags, args } = await this.parse(Kill);
        const params: string = args.nameAndVersion;
        let message;
        if (params.includes('@')) {
            const { squidName, versionName } = parseNameAndVersion(
                params,
                this
            );
            message = await destroyDeployment(squidName, versionName);
        } else {
            message = await destroyApp(params);
        }
        this.log(message);
    }
}
