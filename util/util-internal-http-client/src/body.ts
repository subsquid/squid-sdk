
export type HttpBody = Content | Json | Nothing


interface Content {
    content: string | Uint8Array
    json?: undefined
}


interface Json {
    content?: undefined
    json: object
}


interface Nothing {
    content?: undefined
    json?: undefined
}
