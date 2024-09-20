import {HttpContext} from './ctx'


export interface HttpResource<Params> {
    GET?(ctx: HttpContext<Params>): Promise<void>
    POST?(ctx: HttpContext<Params>): Promise<void>
    PUT?(ctx: HttpContext<Params>): Promise<void>
    DELETE?(ctx: HttpContext<Params>): Promise<void>
}
