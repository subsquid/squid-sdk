import {Call, Event, Extrinsic} from "./model"


export class CallParser {
    public readonly calls: Call[] = []

    constructor(
        private events: Event[],
        private extrinsics: (Extrinsic & {args: unknown})[]
    ) {

    }
}
