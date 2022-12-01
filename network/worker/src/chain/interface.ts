
export type H256 = Uint8Array

export type WorkerId = Uint8Array

export type RequestId = Uint8Array

export interface Task {
    requestId: RequestId
    dockerImage: H256
    command: Uint8Array[]
}

export type Event = Event_Fallback | Event_Worker

export interface Event_Fallback {
    __kind: 'Fallback'
}

export interface Event_Worker {
    __kind: 'Worker'
    value: WorkerEvent
}

export type WorkerEvent = WorkerEvent_Fallback | WorkerEvent_RunTask

export interface WorkerEvent_Fallback {
    __kind: 'Fallback'
}

export interface WorkerEvent_RunTask {
    __kind: 'RunTask'
    workerId: WorkerId
    task: Task
}
