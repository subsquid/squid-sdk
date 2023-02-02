
export type AccountId = Uint8Array

export type DockerDigest = Uint8Array

export interface DockerImage {
    name: Uint8Array
    digest: DockerDigest
}

export type TaskId = bigint

export type WorkerId = Uint8Array

export interface TaskSpec {
    dockerImage: DockerImage
    command: Uint8Array[]
}

export interface TaskResult {
    exitCode: number
    stdout: Uint8Array
    stderr: Uint8Array
}

export interface HardwareSpec {
    numCpuCores: (number | undefined)
    memoryBytes: (bigint | undefined)
    storageBytes: (bigint | undefined)
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

export type Call = Call_Worker_register | Call_Worker_done | Call_Fallback

export interface Call_Worker_register {
    __kind: 'Worker.register'
    spec: HardwareSpec
    isOnline: boolean
}

export interface Call_Worker_done {
    __kind: 'Worker.done'
    taskId: TaskId
    taskResult: TaskResult
}

export interface Call_Fallback {
    __kind: 'Fallback'
}
