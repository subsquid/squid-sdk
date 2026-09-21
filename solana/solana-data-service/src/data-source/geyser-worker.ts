import {getServer, getServerArguments} from '@subsquid/util-internal-worker-thread'
import {createGeyser, GeyserOptions} from './geyser-setup'

const options = getServerArguments<GeyserOptions>()

const geyser = createGeyser(options)

getServer()
    .def('getStream', () => geyser.getStream())
    .start()
