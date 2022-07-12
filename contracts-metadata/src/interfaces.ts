export interface AbiEventParam {
    docs: string[]
    label: string
    type: number
    indexed: boolean
}


export interface AbiEvent {
    args: AbiEventParam[]
    docs: string[]
    label: string
}


export interface AbiMessageParam {
    label: string
    type: number
}


export interface AbiMessage {
    args: AbiMessageParam[]
    docs: string[]
    label: string
    mutates?: boolean
    payable: boolean
    selector: string
}


export type AbiContructor = AbiMessage


export interface DecodedEvent {
    args: any[]
    event: AbiEvent
}


export interface DecodedMessage {
    args: any[]
    message: AbiMessage
}
