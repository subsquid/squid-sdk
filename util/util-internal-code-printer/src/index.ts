import fs from "fs"
import path from "path"


interface LazyLine {
    indent: string
    gen(): void
}


type Line = string | LazyLine


export class Output {
    private lines: Line[] = []
    private indent = ''

    line(s?: string): void {
        if (s) {
            this.lines.push(this.indent + s)
        } else {
            this.lines.push('')
        }
    }

    block(start: string, cb: () => void): void {
        this.line(start + ' {')
        this.indentation(cb)
        this.line('}')
    }

    indentation(cb: () => void): void {
        this.indent += '    '
        try {
            cb()
        } finally {
            this.indent = this.indent.slice(0, this.indent.length - 4)
        }
    }

    blockComment(lines?: string[]): void {
        if (!lines?.length) return
        this.line(`/**`)
        lines.forEach((line) => this.line(' * ' + escapeBlockComment(line)))
        this.line(' */')
    }

    lazy(gen: () => void): void {
        this.lines.push({indent: this.indent, gen})
    }

    toString(): string {
        return this.printLines(this.lines, '', '')
    }

    private printLines(lines: Line[], indent: string, out: string): string {
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i]
            if (typeof line == 'string') {
                out += indent + line + '\n'
            } else {
                out = this.printLazyLine(line, indent, out)
            }
        }
        return out
    }

    private printLazyLine(line: LazyLine, indent: string, out: string): string {
        let currentLines = this.lines
        this.lines = []
        try {
            line.gen()
            out = this.printLines(this.lines, indent + line.indent, out)
        } finally {
            this.lines = currentLines
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
    private dir: string

    constructor(dir: string) {
        this.dir = path.normalize(dir)
    }

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
        let dst = this.path(name)
        fs.mkdirSync(path.dirname(dst), { recursive: true })
        fs.copyFileSync(src, this.path(name))
    }

    path(name?: string): string {
        return name == null ? this.dir : path.join(this.dir, name)
    }

    exists(): boolean {
        return fs.existsSync(this.dir)
    }
}


function escapeBlockComment(s: string): string {
    return s.replace(/\*\//g, 'x/')
}
