import type {BlockRef} from './types'


export interface PortalStreamHeaders {
    headNumber?: number
    finalizedHeadNumber?: number
    finalizedHeadHash?: string
}


export interface PortalStreamDataResponse extends PortalStreamHeaders {
    status: 200
    data: AsyncIterable<Uint8Array>
}


export interface PortalStreamNoDataResponse extends PortalStreamHeaders {
    status: 204
}


export interface PortalStreamConflictResponse {
    status: 409
    previousBlocks: BlockRef[]
}


export type PortalStreamResponse =
    PortalStreamDataResponse |
    PortalStreamNoDataResponse |
    PortalStreamConflictResponse


export interface PortalApi {
    stream(query: object, abortSignal: AbortSignal): Promise<PortalStreamResponse>
    isRetriableError?(err: unknown): boolean
    getRetryPause?(err: unknown): number | undefined
}
