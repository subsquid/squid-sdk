import { removeSecret } from "../../api";
import { CliCommand } from "../../command";


export default class Rm extends CliCommand {
    static description = 'Remove a secret';
    static args = [
        {
            name: 'name',
            description: 'The secret name',
            required: true,
        }
    ];
    static flags = {};

    async run(): Promise<void> {
        const { flags: { }, args: { name } } = await this.parse(Rm);
        await removeSecret(name);
        this.log(`Secret '${name}' removed`);
    }
}