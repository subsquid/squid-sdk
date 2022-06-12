export interface TypeDef {
    id: number
    type: any
}


export interface AbiParamType {
    displayName: string[]
    type: number
}


export interface AbiParam {
    label: string
    type: AbiParamType
}


export interface AbiMessage {
    args: AbiParam[]
    docs: string[]
    label: string
    mutates?: boolean
    payable: boolean
    returnType?: AbiParamType
    selector: string
}


export interface AbiEvent {
    args: AbiParam[]
    docs: string[]
    label: string
}


export interface DecodedEvent {
    args: any[]
    event: AbiEvent
}


export interface DecodedMessage {
    args: any[]
    message: AbiMessage
}
