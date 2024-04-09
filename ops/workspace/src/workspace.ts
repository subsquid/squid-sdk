import {assertNotNull, def} from '@subsquid/util-internal'
import fs from 'fs'
import * as JSONC from 'jsonc-parser'
import latestVersion from 'latest-version'
import * as path from 'path'
import * as semver from 'semver'
import {PackageJson} from 'type-fest'


type PkgJson = PackageJson.PackageJsonStandard
type Deps = Partial<Record<string, string>>


interface Pkg {
    project: RushProject
    json: PkgJson
    changed?: boolean
}


interface RushProject {
    packageName: string
    projectFolder: string
    versionPolicyName?: string
    shouldPublish?: boolean
}


interface Rush {
    projects: RushProject[]
}


export class Workspace {
    constructor(private dir: string, protected options: {preferLowerVersion?: boolean}) {}

    save(): void {
        this.packages().forEach(def => {
            if (!def.changed) return
            this.write(
                path.join(def.project.projectFolder, 'package.json'),
                def.json
            )
            def.changed = false
        })
    }

    async update(major?: boolean): Promise<void> {
        let versions = this.unifiedDependencies()
        for (let name in versions) {
            if (this.packages().has(name)) continue
            let fullCurrent = versions[name]!
            let current = pure(fullCurrent)
            let latest = major
                ? await latestVersion(name)
                : await latestVersion(name, {version: fullCurrent})
            if (current != latest) {
                console.log(`updated ${name}\t${current} -> ${latest}`)
                versions[name] = prefix(versions[name]!) + latest
            }
        }
    }

    unify(): void {
        let versions = this.unifiedDependencies()
        this.packages().forEach((def, name) => {
            const set = (deps?: Deps) => {
                for (let key in deps) {
                    let current = deps[key]
                    let latest = versions[key]
                    if (latest && current != latest) {
                        deps[key] = latest
                        console.log(`changed ${name}\t${key}\t${current} -> ${latest}`)
                        def.changed = true
                    }
                }
            }

            set(def.json.dependencies)
            set(def.json.peerDependencies)
            set(def.json.optionalDependencies)
            set(def.json.devDependencies)
        })
    }

    @def
    private unifiedDependencies(): Deps {
        let deps: Deps = {}
        let packages = this.packages()
        packages.forEach((def, name) => {
            let all = {
                ...def.json.devDependencies,
                ...def.json.optionalDependencies,
                ...def.json.peerDependencies,
                ...def.json.dependencies
            }
            for (let key in all) {
                let version
                if (packages.has(key)) {
                    version = prefix(all[key]!) + assertNotNull(packages.get(key)?.json.version)
                } else {
                    version = all[key]!
                }
                let sv = semver.clean(pure(version))
                if (sv == null) continue
                let dep = deps[key]
                if (dep) {
                    let current = pure(dep)
                    let v
                    if (this.options.preferLowerVersion) {
                        v = semver.lte(sv, current) ? sv : current
                    } else {
                        v = semver.gte(sv, current) ? sv : current
                    }
                    let p = combinePrefix(prefix(version), prefix(dep))
                    deps[key] = p + v
                } else {
                    deps[key] = version
                }
            }
        })
        return deps
    }

    @def
    packages(): Map<string, Pkg> {
        let packages = new Map<string, Pkg>()
        let rush: Rush = this.read('rush.json')
        rush.projects.forEach(project => {
            let json: PkgJson = this.read(path.join(project.projectFolder, 'package.json'))
            packages.set(project.packageName, {
                project,
                json
            })
        })
        return packages
    }

    private read<T>(file: string): T {
        let content = fs.readFileSync(this.path(file), 'utf-8')
        let errors: JSONC.ParseError[] = []
        let json = JSONC.parse(content, errors, {
            allowEmptyContent: true,
            allowTrailingComma: true
        })
        if (errors.length > 0) {
            throw new Error(`Failed to parse ${file}, error code: ${errors[0].error}`)
        }
        return json
    }

    private write(file: string, obj: unknown): void {
        let json = JSON.stringify(obj, null, 2)
        fs.writeFileSync(this.path(file), json)
    }

    private path(file: string): string {
        return path.resolve(this.dir, file)
    }
}


function combinePrefix(p1: string, p2: string): string {
    if (!p1 || !p2) return ''
    if (p1 == '~' || p2 == '~') return '~'
    return '^'
}


function prefix(version: string): string {
    return version[0] == '^' || version[0] == '~' ? version[0] : ''
}


function pure(version: string): string {
    return prefix(version) ? version.slice(1) : version
}
