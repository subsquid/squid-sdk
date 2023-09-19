import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const storage = {
    RandomMaterial: createStorage(
        'RandomnessCollectiveFlip.RandomMaterial',
        {
            v1020: RandomnessCollectiveFlipRandomMaterialStorage,
        }
    ),
}

export default {}
