import { setSecret } from "../../api";
import { CliCommand } from "../../command";


export default class Set extends CliCommand {
    static description = 'Set secret';
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
        const { flags: { }, args: { name, value } } = await this.parse(Set);
        setSecret(name, value);
    }
}