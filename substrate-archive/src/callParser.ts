import {assertNotNull} from "@subsquid/util"
import {Call, Event, Extrinsic} from "./model"
import {formatId} from "./util"


export class CallParser {
    public readonly calls: Call[] = []
    private index = 0

    constructor(
        private blockHeight: number,
        private blockHash: string,
        private events: Event[],
        private extrinsics: (Extrinsic & {args: any})[]  // TODO: change any to unknown
    ) {
        extrinsics.forEach(this.parseExtrinsic)
    }

    private parseExtrinsic(extrinsic: Extrinsic) {
        if (extrinsic.name == 'utility.batch') {
            extrinsic.args.calls.forEach((call: any) => {
                
            })
        } else {
            this.calls.push({
                id: formatId(blockHeight, blockHash, index++),
                index,
                extrinsic_id: extrinsic.id,
                parent_id: null,
                success: true,
                args: extrinsic.args,
            })
        }
    }

    private parseCalls() {

    }
}
