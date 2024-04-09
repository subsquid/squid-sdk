import {Bytes} from '@subsquid/substrate-runtime'
import {bytes, GetType, openEnum, tuple, Type} from '@subsquid/substrate-runtime/lib/sts'


export const ConsensusMessage: Type<IConsensusMessage> = tuple([bytes(), bytes()])


export type IConsensusMessage = [engine: Bytes, data: Bytes]


export const DigestItem = openEnum({
    PreRuntime: ConsensusMessage,
    Consensus: ConsensusMessage,
    Seal: ConsensusMessage
})


export type IDigestItem = GetType<typeof DigestItem>
