import * as http from 'http'
import * as https from 'https'


export interface AgentProvider {
    getNativeAgent(url: string): http.Agent
}


export const defaultAgentProvider: AgentProvider = {
    getNativeAgent(url: string): http.Agent {
        if (url.startsWith('https://')) {
            return https.globalAgent
        } else {
            return http.globalAgent
        }
    }
}


export class HttpAgent implements AgentProvider {
    private http?: http.Agent
    private https?: https.Agent

    constructor(private options: https.AgentOptions) {}

    getNativeAgent(url: string): http.Agent {
        if (url.startsWith('https://')) {
            return this.https || (this.https = new https.Agent(this.options))
        } else {
            return this.http || (this.http = new http.Agent(this.options))
        }
    }

    close() {
        this.http?.destroy()
        this.https?.destroy()
    }
}
