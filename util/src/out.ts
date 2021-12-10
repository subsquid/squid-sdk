import fs from "fs"
import path from "path"


export class Output {
    private out: (string | {indent: string, gen: () => string[]})[] = []
    private indent = ''

    line(s?: string): void {
        if (s) {
            this.out.push(this.indent + s)
        } else {
            this.out.push('')
        }
    }

    block(start: string, cb: () => void): void {
        this.line(start + ' {')
        this.indent += '  '
        try {
            cb()
        } finally {
            this.indent = this.indent.slice(0, this.indent.length - 2)
        }
        this.line('}')
    }

    blockComment(lines?: string[]): void {
        if (!lines?.length) return
        this.line(`/**`)
        lines.forEach((line) => this.line(' * ' + line)) // FIXME: escaping
        this.line(' */')
    }

    lazy(gen: () => string[]): void {
        this.out.push({indent: this.indent, gen})
    }

    toString(): string {
        let out = ''
        for (let i = 0; i < this.out.length; i++) {
            let line = this.out[i]
            if (typeof line == 'string') {
                out += line + '\n'
            } else {
                let lazy = line
                lazy.gen().forEach(s => {
                    if (s) {
                        out += lazy.indent + s + '\n'
                    } else {
                        out += '\n'
                    }
                })
            }
        }
        return out
    }
}


export class FileOutput extends Output {
    constructor(public readonly file: string) {
        super()
    }

    write(): void {
        fs.mkdirSync(path.dirname(this.file), { recursive: true })
        fs.writeFileSync(this.file, this.toString())
    }
}


export class OutDir {
    constructor(private dir: string) {}

    del(): void {
        fs.rmSync(this.dir, { recursive: true, force: true })
    }

    file(name: string): FileOutput {
        return new FileOutput(this.path(name))
    }

    write(name: string, content: string): void {
        const dst = this.path(name)
        fs.mkdirSync(path.dirname(dst), { recursive: true })
        fs.writeFileSync(dst, content)
    }

    child(name: string): OutDir {
        return new OutDir(this.path(name))
    }

    mkdir(): void {
        fs.mkdirSync(this.dir, { recursive: true })
    }

    add(name: string, srcFile: string | string[]): void {
        let src = Array.isArray(srcFile) ? path.join(...srcFile) : srcFile
        fs.copyFileSync(src, this.path(name))
    }

    path(name: string): string {
        return path.join(this.dir, name)
    }
}
