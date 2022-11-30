import {RequestCheckContext} from "../../../../check"


export async function requestCheck(req: RequestCheckContext): Promise<boolean | string> {
    switch(req.operationName) {
        case 'forbid':
            return false
        case 'complex':
            return "too complex"
        default:
            return true
    }
}
