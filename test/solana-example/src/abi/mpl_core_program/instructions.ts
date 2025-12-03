import {struct, unit} from '@subsquid/borsh'
import {instruction} from '../abi.support.js'
import {AddCollectionPluginV1Args, AddPluginV1Args, ApproveCollectionPluginAuthorityV1Args, ApprovePluginAuthorityV1Args, BurnCollectionV1Args, BurnV1Args, CompressV1Args, CreateCollectionV1Args, CreateV1Args, DecompressV1Args, RemoveCollectionPluginV1Args, RemovePluginV1Args, RevokeCollectionPluginAuthorityV1Args, RevokePluginAuthorityV1Args, TransferV1Args, UpdateCollectionPluginV1Args, UpdateCollectionV1Args, UpdatePluginV1Args, UpdateV1Args} from './types.js'

export interface CreateV1 {
    createV1Args: CreateV1Args
}

export const createV1 = instruction(
    {
        d1: '0x00',
    },
    {
        /**
         * The address of the new asset
         */
        asset: 0,
        /**
         * The collection to which the asset belongs
         */
        collection: 1,
        /**
         * The authority signing for creation
         */
        authority: 2,
        /**
         * The account paying for the storage fees
         */
        payer: 3,
        /**
         * The owner of the new asset. Defaults to the authority if not present.
         */
        owner: 4,
        /**
         * The authority on the new asset
         */
        updateAuthority: 5,
        /**
         * The system program
         */
        systemProgram: 6,
        /**
         * The SPL Noop Program
         */
        logWrapper: 7,
    },
    struct({
        createV1Args: CreateV1Args,
    }),
)

export interface CreateCollectionV1 {
    createCollectionV1Args: CreateCollectionV1Args
}

export const createCollectionV1 = instruction(
    {
        d1: '0x01',
    },
    {
        /**
         * The address of the new asset
         */
        collection: 0,
        /**
         * The authority of the new asset
         */
        updateAuthority: 1,
        /**
         * The account paying for the storage fees
         */
        payer: 2,
        /**
         * The system program
         */
        systemProgram: 3,
    },
    struct({
        createCollectionV1Args: CreateCollectionV1Args,
    }),
)

export interface AddPluginV1 {
    addPluginV1Args: AddPluginV1Args
}

export const addPluginV1 = instruction(
    {
        d1: '0x02',
    },
    {
        /**
         * The address of the asset
         */
        asset: 0,
        /**
         * The collection to which the asset belongs
         */
        collection: 1,
        /**
         * The account paying for the storage fees
         */
        payer: 2,
        /**
         * The owner or delegate of the asset
         */
        authority: 3,
        /**
         * The system program
         */
        systemProgram: 4,
        /**
         * The SPL Noop Program
         */
        logWrapper: 5,
    },
    struct({
        addPluginV1Args: AddPluginV1Args,
    }),
)

export interface AddCollectionPluginV1 {
    addCollectionPluginV1Args: AddCollectionPluginV1Args
}

export const addCollectionPluginV1 = instruction(
    {
        d1: '0x03',
    },
    {
        /**
         * The address of the asset
         */
        collection: 0,
        /**
         * The account paying for the storage fees
         */
        payer: 1,
        /**
         * The owner or delegate of the asset
         */
        authority: 2,
        /**
         * The system program
         */
        systemProgram: 3,
        /**
         * The SPL Noop Program
         */
        logWrapper: 4,
    },
    struct({
        addCollectionPluginV1Args: AddCollectionPluginV1Args,
    }),
)

export interface RemovePluginV1 {
    removePluginV1Args: RemovePluginV1Args
}

export const removePluginV1 = instruction(
    {
        d1: '0x04',
    },
    {
        /**
         * The address of the asset
         */
        asset: 0,
        /**
         * The collection to which the asset belongs
         */
        collection: 1,
        /**
         * The account paying for the storage fees
         */
        payer: 2,
        /**
         * The owner or delegate of the asset
         */
        authority: 3,
        /**
         * The system program
         */
        systemProgram: 4,
        /**
         * The SPL Noop Program
         */
        logWrapper: 5,
    },
    struct({
        removePluginV1Args: RemovePluginV1Args,
    }),
)

export interface RemoveCollectionPluginV1 {
    removeCollectionPluginV1Args: RemoveCollectionPluginV1Args
}

export const removeCollectionPluginV1 = instruction(
    {
        d1: '0x05',
    },
    {
        /**
         * The address of the asset
         */
        collection: 0,
        /**
         * The account paying for the storage fees
         */
        payer: 1,
        /**
         * The owner or delegate of the asset
         */
        authority: 2,
        /**
         * The system program
         */
        systemProgram: 3,
        /**
         * The SPL Noop Program
         */
        logWrapper: 4,
    },
    struct({
        removeCollectionPluginV1Args: RemoveCollectionPluginV1Args,
    }),
)

export interface UpdatePluginV1 {
    updatePluginV1Args: UpdatePluginV1Args
}

export const updatePluginV1 = instruction(
    {
        d1: '0x06',
    },
    {
        /**
         * The address of the asset
         */
        asset: 0,
        /**
         * The collection to which the asset belongs
         */
        collection: 1,
        /**
         * The account paying for the storage fees
         */
        payer: 2,
        /**
         * The owner or delegate of the asset
         */
        authority: 3,
        /**
         * The system program
         */
        systemProgram: 4,
        /**
         * The SPL Noop Program
         */
        logWrapper: 5,
    },
    struct({
        updatePluginV1Args: UpdatePluginV1Args,
    }),
)

export interface UpdateCollectionPluginV1 {
    updateCollectionPluginV1Args: UpdateCollectionPluginV1Args
}

export const updateCollectionPluginV1 = instruction(
    {
        d1: '0x07',
    },
    {
        /**
         * The address of the asset
         */
        collection: 0,
        /**
         * The account paying for the storage fees
         */
        payer: 1,
        /**
         * The owner or delegate of the asset
         */
        authority: 2,
        /**
         * The system program
         */
        systemProgram: 3,
        /**
         * The SPL Noop Program
         */
        logWrapper: 4,
    },
    struct({
        updateCollectionPluginV1Args: UpdateCollectionPluginV1Args,
    }),
)

export interface ApprovePluginAuthorityV1 {
    approvePluginAuthorityV1Args: ApprovePluginAuthorityV1Args
}

export const approvePluginAuthorityV1 = instruction(
    {
        d1: '0x08',
    },
    {
        /**
         * The address of the asset
         */
        asset: 0,
        /**
         * The collection to which the asset belongs
         */
        collection: 1,
        /**
         * The account paying for the storage fees
         */
        payer: 2,
        /**
         * The owner or delegate of the asset
         */
        authority: 3,
        /**
         * The system program
         */
        systemProgram: 4,
        /**
         * The SPL Noop Program
         */
        logWrapper: 5,
    },
    struct({
        approvePluginAuthorityV1Args: ApprovePluginAuthorityV1Args,
    }),
)

export interface ApproveCollectionPluginAuthorityV1 {
    approveCollectionPluginAuthorityV1Args: ApproveCollectionPluginAuthorityV1Args
}

export const approveCollectionPluginAuthorityV1 = instruction(
    {
        d1: '0x09',
    },
    {
        /**
         * The address of the asset
         */
        collection: 0,
        /**
         * The account paying for the storage fees
         */
        payer: 1,
        /**
         * The owner or delegate of the asset
         */
        authority: 2,
        /**
         * The system program
         */
        systemProgram: 3,
        /**
         * The SPL Noop Program
         */
        logWrapper: 4,
    },
    struct({
        approveCollectionPluginAuthorityV1Args: ApproveCollectionPluginAuthorityV1Args,
    }),
)

export interface RevokePluginAuthorityV1 {
    revokePluginAuthorityV1Args: RevokePluginAuthorityV1Args
}

export const revokePluginAuthorityV1 = instruction(
    {
        d1: '0x0a',
    },
    {
        /**
         * The address of the asset
         */
        asset: 0,
        /**
         * The collection to which the asset belongs
         */
        collection: 1,
        /**
         * The account paying for the storage fees
         */
        payer: 2,
        /**
         * The owner or delegate of the asset
         */
        authority: 3,
        /**
         * The system program
         */
        systemProgram: 4,
        /**
         * The SPL Noop Program
         */
        logWrapper: 5,
    },
    struct({
        revokePluginAuthorityV1Args: RevokePluginAuthorityV1Args,
    }),
)

export interface RevokeCollectionPluginAuthorityV1 {
    revokeCollectionPluginAuthorityV1Args: RevokeCollectionPluginAuthorityV1Args
}

export const revokeCollectionPluginAuthorityV1 = instruction(
    {
        d1: '0x0b',
    },
    {
        /**
         * The address of the asset
         */
        collection: 0,
        /**
         * The account paying for the storage fees
         */
        payer: 1,
        /**
         * The owner or delegate of the asset
         */
        authority: 2,
        /**
         * The system program
         */
        systemProgram: 3,
        /**
         * The SPL Noop Program
         */
        logWrapper: 4,
    },
    struct({
        revokeCollectionPluginAuthorityV1Args: RevokeCollectionPluginAuthorityV1Args,
    }),
)

export interface BurnV1 {
    burnV1Args: BurnV1Args
}

export const burnV1 = instruction(
    {
        d1: '0x0c',
    },
    {
        /**
         * The address of the asset
         */
        asset: 0,
        /**
         * The collection to which the asset belongs
         */
        collection: 1,
        /**
         * The account paying for the storage fees
         */
        payer: 2,
        /**
         * The owner or delegate of the asset
         */
        authority: 3,
        /**
         * The system program
         */
        systemProgram: 4,
        /**
         * The SPL Noop Program
         */
        logWrapper: 5,
    },
    struct({
        burnV1Args: BurnV1Args,
    }),
)

export interface BurnCollectionV1 {
    burnCollectionV1Args: BurnCollectionV1Args
}

export const burnCollectionV1 = instruction(
    {
        d1: '0x0d',
    },
    {
        /**
         * The address of the asset
         */
        collection: 0,
        /**
         * The account paying for the storage fees
         */
        payer: 1,
        /**
         * The owner or delegate of the asset
         */
        authority: 2,
        /**
         * The SPL Noop Program
         */
        logWrapper: 3,
    },
    struct({
        burnCollectionV1Args: BurnCollectionV1Args,
    }),
)

export interface TransferV1 {
    transferV1Args: TransferV1Args
}

export const transferV1 = instruction(
    {
        d1: '0x0e',
    },
    {
        /**
         * The address of the asset
         */
        asset: 0,
        /**
         * The collection to which the asset belongs
         */
        collection: 1,
        /**
         * The account paying for the storage fees
         */
        payer: 2,
        /**
         * The owner or delegate of the asset
         */
        authority: 3,
        /**
         * The new owner to which to transfer the asset
         */
        newOwner: 4,
        /**
         * The system program
         */
        systemProgram: 5,
        /**
         * The SPL Noop Program
         */
        logWrapper: 6,
    },
    struct({
        transferV1Args: TransferV1Args,
    }),
)

export interface UpdateV1 {
    updateV1Args: UpdateV1Args
}

export const updateV1 = instruction(
    {
        d1: '0x0f',
    },
    {
        /**
         * The address of the asset
         */
        asset: 0,
        /**
         * The collection to which the asset belongs
         */
        collection: 1,
        /**
         * The account paying for the storage fees
         */
        payer: 2,
        /**
         * The update authority or update authority delegate of the asset
         */
        authority: 3,
        /**
         * The system program
         */
        systemProgram: 4,
        /**
         * The SPL Noop Program
         */
        logWrapper: 5,
    },
    struct({
        updateV1Args: UpdateV1Args,
    }),
)

export interface UpdateCollectionV1 {
    updateCollectionV1Args: UpdateCollectionV1Args
}

export const updateCollectionV1 = instruction(
    {
        d1: '0x10',
    },
    {
        /**
         * The address of the asset
         */
        collection: 0,
        /**
         * The account paying for the storage fees
         */
        payer: 1,
        /**
         * The update authority or update authority delegate of the asset
         */
        authority: 2,
        /**
         * The new update authority of the asset
         */
        newUpdateAuthority: 3,
        /**
         * The system program
         */
        systemProgram: 4,
        /**
         * The SPL Noop Program
         */
        logWrapper: 5,
    },
    struct({
        updateCollectionV1Args: UpdateCollectionV1Args,
    }),
)

export interface CompressV1 {
    compressV1Args: CompressV1Args
}

export const compressV1 = instruction(
    {
        d1: '0x11',
    },
    {
        /**
         * The address of the asset
         */
        asset: 0,
        /**
         * The collection to which the asset belongs
         */
        collection: 1,
        /**
         * The account receiving the storage fees
         */
        payer: 2,
        /**
         * The owner or delegate of the asset
         */
        authority: 3,
        /**
         * The system program
         */
        systemProgram: 4,
        /**
         * The SPL Noop Program
         */
        logWrapper: 5,
    },
    struct({
        compressV1Args: CompressV1Args,
    }),
)

export interface DecompressV1 {
    decompressV1Args: DecompressV1Args
}

export const decompressV1 = instruction(
    {
        d1: '0x12',
    },
    {
        /**
         * The address of the asset
         */
        asset: 0,
        /**
         * The collection to which the asset belongs
         */
        collection: 1,
        /**
         * The account paying for the storage fees
         */
        payer: 2,
        /**
         * The owner or delegate of the asset
         */
        authority: 3,
        /**
         * The system program
         */
        systemProgram: 4,
        /**
         * The SPL Noop Program
         */
        logWrapper: 5,
    },
    struct({
        decompressV1Args: DecompressV1Args,
    }),
)

export type Collect = undefined

export const collect = instruction(
    {
        d1: '0x13',
    },
    {
        /**
         * The address of the recipient 1
         */
        recipient1: 0,
        /**
         * The address of the recipient 2
         */
        recipient2: 1,
    },
    unit,
)
