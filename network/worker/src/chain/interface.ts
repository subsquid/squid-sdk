
export type H256 = Uint8Array

export type WorkerId = Uint8Array

export type RequestId = Uint8Array

export interface Task {
    requestId: RequestId
    dockerImage: H256
    command: Uint8Array[]
}

export type Event = Event_Fallback

export interface Event_Fallback {
    __kind: 'Fallback'
}

export type Call = Call_Worker_register | Call_Fallback

export interface Call_Worker_register {
    __kind: 'Worker.register'
}

export interface Call_Fallback {
    __kind: 'Fallback'
}
