
export type AccountId = Uint8Array

export type DockerDigest = Uint8Array

export interface DockerImage {
    name: Uint8Array
    digest: DockerDigest
}

export type TaskId = bigint

export type WorkerId = Uint8Array

export interface WorkerInfo {
    spec: HardwareSpec
    isOnline: boolean
}

export interface HardwareSpec {
    numCpuCores: (number | undefined)
    memoryBytes: (bigint | undefined)
    storageBytes: (bigint | undefined)
}

export interface TaskSpec {
    dockerImage: DockerImage
    command: Uint8Array[]
}

export interface TaskResult {
    exitCode: number
    stdout: Uint8Array
    stderr: Uint8Array
}

export type Event = Event_Worker_RunTask | Event_Fallback

export interface Event_Worker_RunTask {
    __kind: 'Worker.RunTask'
    workerId: WorkerId
    taskId: TaskId
    taskSpec: TaskSpec
    constraints: (HardwareSpec | undefined)
}

export interface Event_Fallback {
    __kind: 'Fallback'
}

export type Call = Call_Worker_register | Call_Worker_unregister | Call_Worker_update_spec | Call_Worker_go_online | Call_Worker_go_offline | Call_Worker_done | Call_Fallback

export interface Call_Worker_register {
    __kind: 'Worker.register'
    spec: HardwareSpec
    isOnline: boolean
}

export interface Call_Worker_unregister {
    __kind: 'Worker.unregister'
}

export interface Call_Worker_update_spec {
    __kind: 'Worker.update_spec'
    spec: HardwareSpec
}

export interface Call_Worker_go_online {
    __kind: 'Worker.go_online'
}

export interface Call_Worker_go_offline {
    __kind: 'Worker.go_offline'
}

export interface Call_Worker_done {
    __kind: 'Worker.done'
    taskId: TaskId
    taskResult: TaskResult
}

export interface Call_Fallback {
    __kind: 'Fallback'
}
