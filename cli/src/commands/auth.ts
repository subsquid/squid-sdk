import { Command, Flags } from '@oclif/core';
import { setCreds } from '../creds';
import { me as identifyMe } from '../rest-client';

export default class Auth extends Command {
    static description = `Authenticate to deploy and manage squids 🦑`;

    static flags = {
        key: Flags.string({
            char: 'k',
            description: 'Aquarium deployment key. Log in to https://app.subsquid.io to create or update your key.',
            required: true,
        }),
    };

    async run(): Promise<void> {
        const { flags } = await this.parse(Auth);
        const accessKey = flags.key;
        setCreds(accessKey);
        const identificationMessage = await identifyMe(accessKey);
        this.log(identificationMessage);
    }
}
