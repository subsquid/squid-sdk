import { OldTypesBundle } from "../types";
import { bundle as mantaBundle } from "./manta";

export const bundle: OldTypesBundle = {
    types: {
        ...mantaBundle.types,
        CurrencyId: {
            _enum: [
                'KMA'
            ]
        },
    }
}