import { CliUx, Command } from '@oclif/core';
import { createOrmConfig } from '@subsquid/typeorm-config';
import { assertNotNull, OutDir } from '@subsquid/util';

export default class NewMigration extends Command {
  static description = 'Create template file for a new migration';

  static args = [{ name: 'name' }];

  async run(): Promise<void> {
    const { args } = await this.parse(NewMigration);
    const name: string = args.name ? args.name : await CliUx.ux.prompt('Enter migration name', {
      required: true,
    });
    const cfg = createOrmConfig();
    const dir = new OutDir(assertNotNull(cfg.cli?.migrationsDir));
    const timestamp = Date.now();
    const out = dir.file(`${timestamp}-${name}.js`);
    out.block(`module.exports = class ${name}${timestamp}`, () => {
      out.line(`name = '${name}${timestamp}'`);
      out.line();
      out.block('async up(db)', () => {
        out.line();
      });
      out.line();
      out.block('async down(db)', () => {
        out.line();
      });
    });
    out.write();
  }
}
