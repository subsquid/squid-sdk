
export class ArchiveLayoutError extends Error {
    constructor(public readonly location: string, msg: string) {
        super(msg)
    }

    get name(): string {
        return 'ArchiveLayoutError'
    }
}


export class TopDirError extends ArchiveLayoutError {
    constructor(location: string, path: string) {
        super(location, `item '${path}' resembles top directory of a data chunk but has non-canonical name`)
    }
}


export class DataChunkError extends Error {
    constructor(path: string, msg: string) {
        super(`invalid data chunk ${path}: ${msg}`)
    }
}
