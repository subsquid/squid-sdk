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
const commander_1 = require("commander");
const process = __importStar(require("process"));
const workspace_1 = require("./workspace");
async function main() {
    let command = new commander_1.Command();
    command.description('Unifies and optionally updates dependencies across rush project');
    command.option('--update', 'update dependencies', false);
    command.option('-m, --major [...packages]', 'allow major update for a package');
    command.option('--dry', 'do not perform real changes');
    command.parse();
    let options = command.opts();
    let workspace = new workspace_1.Workspace(process.cwd());
    if (options.update) {
        await workspace.update(new Set(options.major));
    }
    workspace.unify();
    if (!options.dry) {
        workspace.save();
    }
}
main().catch(err => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=unify.js.map