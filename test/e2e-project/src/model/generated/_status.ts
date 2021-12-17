import {MiddleClass} from "./_middleClass"
import {HappyPoor} from "./_happyPoor"
import {Miserable} from "./_miserable"

export type Status = MiddleClass | HappyPoor | Miserable

export function fromJsonStatus(json: any): Status {
  switch(json?.isTypeOf) {
    case 'MiddleClass': return new MiddleClass(undefined, json)
    case 'HappyPoor': return new HappyPoor(undefined, json)
    case 'Miserable': return new Miserable(undefined, json)
    default: throw new TypeError('Unknown json object passed as Status')
  }
}
