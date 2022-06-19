import { Command, Flags } from '@oclif/core';

import { setConfig } from '../config';
import { profile } from '../api/profile';

export default class Auth extends Command {
    static description = `Authenticate for SAAS Squid management`;

    static flags = {
        key: Flags.string({
            char: 'k',
            description: 'Obtained access key for CLI',
            required: true,
        }),
        url: Flags.string({
            char: 'u',
            description: 'API URL',
            required: false,
        }),
    };

    async run(): Promise<void> {
        const { flags: { key, url } } = await this.parse(Auth);
        setConfig({ credentials: key, apiUrl: url });

        const { username } = await profile();

        this.log(`Successfully logged as ${username}`);
    }
}
