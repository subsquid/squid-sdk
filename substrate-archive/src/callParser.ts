import {Call, Event, Extrinsic} from "./model"


export class CallParser {
    public readonly calls: Call[] = []

    constructor(
        private events: Event[],
        private extrinsics: (Extrinsic & {args: unknown})[]
    ) {
        // extrinsics.forEach(extrinsic => {
        //     if (extrinsic.name == 'utility.batch') {
        //         extrinsic.args.calls.forEach(call => {
        //             let calls = new CallParser(this.events, this.extrinsics).calls
        //             calls.push(...calls)
        //         })
        //         console.log(extrinsic.args)
        //         throw 'error'
        //     } else {
        //         this.calls.push({
        //             id: 
        //             extrinsic_id: extrinsic.id,
        //             args: extrinsic.args,
        //         })
        //     }
        // })
    }
}
