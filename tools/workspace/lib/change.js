"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("@subsquid/util");
const commander_1 = require("commander");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const process = __importStar(require("process"));
async function main() {
    let command = new commander_1.Command();
    command.description('Create change file for a package');
    command.requiredOption('-p, --package <dir>', 'package dir (must be relative to workspace root)');
    command.addOption(new commander_1.Option('-t, --type <type>', 'type of change').choices([
        'major',
        'minor',
        'patch',
        'none'
    ]).makeOptionMandatory(true));
    command.requiredOption('-m, --message <text>', 'change description');
    command.parse();
    let options = command.opts();
    let pkgJsonLoc = path.join(options.package, 'package.json');
    let pkg = JSON.parse(fs.readFileSync(pkgJsonLoc, 'utf-8'));
    let packageName = (0, util_1.assertNotNull)(pkg.name, `.name is not defined in ${pkgJsonLoc}`);
    let dir = new util_1.OutDir('common/changes').child(packageName);
    dir.write(createChangeFileName(), JSON.stringify({
        changes: [
            {
                packageName,
                type: options.type,
                comment: options.message
            }
        ],
        packageName
    }, null, 2));
}
function createChangeFileName() {
    let now = new Date();
    return `dev_${now.getFullYear()}_${now.getMonth() + 1}_${now.getDate()}__${now.getTime()}.json`;
}
main().catch(err => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=change.js.map