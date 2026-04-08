
export interface AgentProvider {
    close?(): void
}


export const defaultAgentProvider: AgentProvider = {}


/**
 * @deprecated Built-in fetch manages keep-alive connections internally.
 * Retained for backward compatibility.
 */
export class HttpAgent implements AgentProvider {
    constructor(_options?: Record<string, any>) {}

    close() {}
}
