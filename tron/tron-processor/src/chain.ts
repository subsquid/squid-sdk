import type {HttpClient} from '@subsquid/http-client'


export class Chain {
    constructor(
        private getHttp: () => HttpClient
    ) {}

    get http(): HttpClient {
        return this.getHttp()
    }
}
