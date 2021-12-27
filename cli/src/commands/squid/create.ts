import { Command, Flags } from '@oclif/core';
import { create } from '../../rest-client/routes/create';

export default class Create extends Command {
    static description = 'Create a squid';
    static args = [
        {
            name: 'name',
            description: 'squid name',
            required: true,
        },
    ];

    static flags = {
        description: Flags.string({
            char: 'd',
            description: 'description',
            required: false,
        }),
        logo: Flags.string({
            char: 'l',
            description: 'logo url',
            required: false,
        }),
        website: Flags.string({
            char: 'w',
            description: 'website url',
            required: false,
        }),
    };

    async run(): Promise<void> {
        const { flags, args } = await this.parse(Create);
        const name = args.name;
        const description = flags.description;
        const logoUrl = flags.logo;
        const websiteUrl = flags.website;

        const createSquidMessage = await create(
            name,
            description,
            logoUrl,
            websiteUrl
        );
        this.log(createSquidMessage);
    }
}
