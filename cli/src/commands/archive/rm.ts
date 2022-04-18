import { Command } from '@oclif/core';
import { baseUrl } from '../../rest-client/baseUrl';
import { request } from '../../rest-client/request';
import { getCreds } from '../../creds';

export default class Remove extends Command {
    static description = 'Delete an archive';
    static args = [
        {
            name: 'name',
            description: 'archive name',
            required: true,
        },
    ];

    async run(): Promise<void> {
        const { args: { name } } = await this.parse(Remove);

        const response = await request(`${baseUrl}/client/archives/${name}`, {
            method: 'delete',
            headers: {
                'Content-Type': 'application/json',
                authorization: `token ${getCreds()}`,
            },
        });
        const responseBody = await response.json();
        if (response.status === 200) {
            this.log(`Deleted archive with name ${responseBody.name}`);
        }
    }
}
