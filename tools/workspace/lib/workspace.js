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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Workspace = void 0;
const util_internal_1 = require("@subsquid/util-internal");
const fs_1 = __importDefault(require("fs"));
const latest_version_1 = __importDefault(require("latest-version"));
const path = __importStar(require("path"));
const JSONC = __importStar(require("jsonc-parser"));
const semver = __importStar(require("semver"));
class Workspace {
    constructor(dir) {
        this.dir = dir;
    }
    save() {
        this.packages().forEach(def => {
            if (!def.changed)
                return;
            this.write(path.join(def.loc, 'package.json'), def.json);
            def.changed = false;
        });
    }
    async update(majorBumpSet) {
        let versions = this.unifiedDependencies();
        for (let name in versions) {
            let current = pure(versions[name]);
            let latest = majorBumpSet?.has(name)
                ? await (0, latest_version_1.default)(name)
                : await (0, latest_version_1.default)(name, { version: '^' + current });
            if (current != latest) {
                console.log(`updated ${name}\t${current} -> ${latest}`);
                versions[name] = prefix(versions[name]) + latest;
            }
        }
    }
    unify() {
        let versions = this.unifiedDependencies();
        this.packages().forEach((def, name) => {
            const set = (deps) => {
                for (let key in deps) {
                    let current = deps[key];
                    let latest = versions[key];
                    if (latest && current != latest) {
                        deps[key] = latest;
                        console.log(`changed ${name}\t${key}\t${current} -> ${latest}`);
                        def.changed = true;
                    }
                }
            };
            set(def.json.dependencies);
            set(def.json.peerDependencies);
            set(def.json.optionalDependencies);
            set(def.json.devDependencies);
        });
    }
    unifiedDependencies() {
        let deps = {};
        let packages = this.packages();
        packages.forEach((def, name) => {
            let all = {
                ...def.json.devDependencies,
                ...def.json.optionalDependencies,
                ...def.json.peerDependencies,
                ...def.json.dependencies
            };
            for (let key in all) {
                if (packages.has(key))
                    continue;
                let version = all[key];
                let sv = semver.clean(pure(version));
                if (sv == null)
                    continue;
                if (deps[key]) {
                    let current = pure(deps[key]);
                    let v = semver.gte(sv, current) ? sv : current;
                    let p = combinePrefix(prefix(version), prefix(deps[key]));
                    deps[key] = p + v;
                }
                else {
                    deps[key] = version;
                }
            }
        });
        return deps;
    }
    packages() {
        let packages = new Map();
        let rush = this.read('rush.json');
        rush.projects.forEach(project => {
            let loc = project.projectFolder;
            let json = this.read(path.join(loc, 'package.json'));
            packages.set(project.packageName, {
                loc,
                json
            });
        });
        return packages;
    }
    read(file) {
        let content = fs_1.default.readFileSync(this.path(file), 'utf-8');
        let errors = [];
        let json = JSONC.parse(content, errors, {
            allowEmptyContent: true,
            allowTrailingComma: true
        });
        if (errors.length > 0) {
            throw new Error(`Failed to parse ${file}, error code: ${errors[0].error}`);
        }
        return json;
    }
    write(file, obj) {
        let json = JSON.stringify(obj, null, 2);
        fs_1.default.writeFileSync(this.path(file), json);
    }
    path(file) {
        return path.resolve(this.dir, file);
    }
}
__decorate([
    util_internal_1.def,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], Workspace.prototype, "unifiedDependencies", null);
__decorate([
    util_internal_1.def,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Map)
], Workspace.prototype, "packages", null);
exports.Workspace = Workspace;
function combinePrefix(p1, p2) {
    if (!p1 || !p2)
        return '';
    if (p1 == '~' || p2 == '~')
        return '~';
    return '^';
}
function prefix(version) {
    return version[0] == '^' || version[0] == '~' ? version[0] : '';
}
function pure(version) {
    return prefix(version) ? version.slice(1) : version;
}
//# sourceMappingURL=workspace.js.map