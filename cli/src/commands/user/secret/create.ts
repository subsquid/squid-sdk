import { createSecret } from "../../../api";
import { CliCommand } from "../../../command";


export default class Create extends CliCommand {
    static description = 'Create secret';
    static args = [
        {
            name: 'name',
            description: 'secret name',
            required: true,
        },
        {
            name: 'value',
            description: 'secret value',
            required: true,
        },
    ];
    static flags = {};

    async run(): Promise<void> {
        const { flags: { }, args: { name, value } } = await this.parse(Create);
        createSecret(name, value);
    }
}