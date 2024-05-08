import {Program} from '../description'
import * as old from './old.spec'
import * as v0 from './v0.spec'

export function fromAnchor(idl: old.Idl | v0.Idl): Program {
    if ('address' in idl) {
        return v0.build(idl)
    } else {
        return old.build(idl)
    }
}
