import chalk from 'chalk';
import Table from 'cli-table3';

import { getSquid, getSquids, VersionResponse } from '../../api';
import { CliCommand } from '../../command';

function getVersion(version: VersionResponse) {
  const percent = version.processor.syncState?.totalBlocks ? Math.round(version.processor.syncState?.currentBlock / version.processor.syncState?.totalBlocks * 100) : 0

  return {
    name:  [
      `${version.name}${version.alias ? ` ${chalk.green(version.alias)}` : ''}   `,
      chalk.dim(version.status),
    ].join('\n'),
    api:  `${version.api.status}`,
    processor:  `${version.processor.status}
${version.processor.syncState?.currentBlock}${chalk.dim('/')}${version.processor.syncState?.totalBlocks} ${chalk.dim(`(${percent}%)`)}`,
    links: [
      chalk.dim('Playground'),
      version.deploymentUrl,
      chalk.dim('Source'),
      version.artifactUrl
    ].filter(v => v).join('\n'),
    createdAt: version.createdAt,
  }
}

function getProdVersion(versions: VersionResponse[]) {
  return versions.find(v => v.alias === 'PRODUCTION');
}

export default class Get extends CliCommand {
    static description = 'Display one or many Squids';

    static args = [
      {
        name: 'name',
        description: 'Squid name',
        required: false,
      },
    ];

    async run(): Promise<void> {
        const { args: { name }} = await this.parse(Get);
        if (name) {
            const { versions, isPublic } = await getSquid(name);

            if (versions) {
                const prodVersion = getProdVersion(versions)

                const squidTable = new Table({
                  head: [],
                  chars: {
                    'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': '',
                    'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': '',
                    'left': '' , 'left-mid': '' , 'mid': '' , 'mid-mid': '',
                    'right': '' , 'right-mid': '' , 'middle': ' ',
                  },
                  style: {
                    head: [], //disable colors in header cells
                    border: [], //disable colors for the border
                    'padding-left': 0, 'padding-right': 5,
                  },
                })

                this.log(`Squid ${name}`)
                this.log(chalk.dim('=================================='))

                squidTable.push(
                  ['Description', prodVersion?.description],
                  ['Public', isPublic ? chalk.green('✔') : chalk.dim('-')],
                );

                this.log(squidTable.toString())
                this.log(chalk.dim('=================================='))
                this.log('')
                this.log(`Versions`)

                const versionTable = new Table({
                  head: ['Name', 'API', 'Processor', 'Links'],
                  truncate: '',
                  style: {
                    head: [], //disable colors in header cells
                  },
                })

                versions.forEach(v => {
                  const { name, links, api, processor } = getVersion(v)
                  versionTable.push([
                    name,
                    api,
                    processor,
                    links
                  ])
                })

                this.log(versionTable.toString())
            }
        } else {
            const squids = await getSquids();

            const table = new Table({
              head: ['Squid', 'API', 'Processor', 'Links'],
              truncate: '',
              style: {
                head: [], //disable colors in header cells
              },
            })

            squids.forEach(s => {
                const prodVersion = getProdVersion(s.versions)
                const { links, api, processor } = getVersion(prodVersion || {} as any)

                table.push([
                  [
                    `${s.name}`,
                    `${chalk.dim('Production:')} ${chalk.green(s.aliasProd)}`,
                    s.isPublic ? chalk.green('Public') : null,
                  ].filter(v => v).join('\n'),
                  api,
                  processor,
                  links,

                ])
            })

            this.log(table.toString())
        }
    }
}
