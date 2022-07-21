import { updateSecret } from "../../../api";
import { CliCommand } from "../../../command";


export default class Update extends CliCommand {
    static description = 'Update secret';
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
        const { flags: { }, args: { name, value } } = await this.parse(Update);
        updateSecret(name, value);
    }
}