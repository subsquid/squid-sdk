import {Patch} from './patch'


export function fixUnsafeIntegers(json: string): string {
    let patch = new Patch(json)
    patch.scan()
    return patch.result()
}
