import {Interface} from "ethers/lib/utils";

export const eventParser = (
    contractInterface: Interface,
    data: string,
    topics: Array<string>,
) => {
    try {
        const event = contractInterface.parseLog({data, topics});
        return {
            name: event.name,
            args: event.args,
            topic: event.topic,
            fragment: event.eventFragment,
            signature: event.signature
        }
    } catch (err) {
        console.log('Not a matching event. Skipping')
        return undefined;
    }

};
