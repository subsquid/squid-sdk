export type Commitment = 'finalized' | 'confirmed'


export interface DataRequest {
    rewards?: boolean
    transactions?: boolean
}
