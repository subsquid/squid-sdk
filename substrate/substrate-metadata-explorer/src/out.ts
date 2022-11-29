import {def} from "@subsquid/util-internal"
import * as fs from "fs"
import {extname} from "path"
import {readSpecVersions, SpecVersion} from "./specVersion"


export class Out {
    constructor(private file: string) {
    }

    exists(): boolean {
        return fs.existsSync(this.file)
    }

    isJson() {
        return extname(this.file) == '.json'
    }

    @def
    knownVersions(): SpecVersion[] {
        if (this.exists()) {
            return readSpecVersions(this.file)
        } else {
            return []
        }
    }

    append(versions: SpecVersion[]): void {
        if (this.isJson()) {
            let current = this.exists() ? readSpecVersions(this.file) : []
            this.write(current.concat(versions))
        } else {
            for (let v of versions) {
                fs.appendFileSync(this.file, JSON.stringify(v) + '\n')
            }
        }
    }

    write(versions: SpecVersion[]): void {
        if (this.isJson()) {
            fs.writeFileSync(this.file, JSON.stringify(versions, null, 2))
        } else {
            fs.unlinkSync(this.file)
            for (let v of versions) {
                fs.appendFileSync(this.file, JSON.stringify(v) + '\n')
            }
        }
    }
}
