import { Command, Flags } from '@oclif/core';
import { create } from '../../rest-client';

export default class Create extends Command {
  static description = 'Create a Squid';
  static args = [
    {
      name: 'name',
      description: 'Squid name',
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
      description: 'logo URL',
      required: false,
    }),
    website: Flags.string({
      char: 'w',
      description: 'website URL',
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
