import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v1020 from './types/v1020'

export const storage = {
    RandomMaterial: createStorage(
        'RandomnessCollectiveFlip.RandomMaterial',
        {
            v1020: v1020.RandomnessCollectiveFlipRandomMaterialStorage,
        }
    ),
}

export default {}
