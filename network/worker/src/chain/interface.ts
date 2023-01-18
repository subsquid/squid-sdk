
export type AccountId = Uint8Array

export type DockerImage = Uint8Array

export type TaskId = Uint8Array

export type WorkerId = Uint8Array

export interface Task {
    taskId: TaskId
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
    task: Task
}

export interface Event_Fallback {
    __kind: 'Fallback'
}

export type Call = Call_Worker_register | Call_Worker_done | Call_Fallback

export interface Call_Worker_register {
    __kind: 'Worker.register'
}

export interface Call_Worker_done {
    __kind: 'Worker.done'
    taskId: TaskId
    result: TaskResult
}

export interface Call_Fallback {
    __kind: 'Fallback'
}
