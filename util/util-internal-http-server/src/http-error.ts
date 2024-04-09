
export class HttpError extends Error {
    constructor(
        public status: number,
        public body?: string | Uint8Array | object,
        public headers?: Record<string, string | string[]>
    ) {
        super()
    }

    get name(): string {
        return 'HttpError'
    }

    get __sqd_http_server_error(): boolean {
        return true
    }
}


export function isHttpError(err: any): err is HttpError {
    return !!err?.__sqd_http_server_error
}
