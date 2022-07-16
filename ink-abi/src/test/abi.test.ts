import assert from 'assert'
import {Abi} from '../abi';
import metadata from './metadata.json'

describe('erc-20', function () {
    let abi = new Abi(metadata)

    it('decode constructor', function () {
        let data = '0x9bae9d5e0000a0dec5adc9353600000000000000'
        let decoded = abi.decodeConstructor(data)
        assert(decoded.initialSupply == 1000000000000000000000n)
    })

    it('decode event', function () {
        let data = '0x0001da002226d93b2c422b95b780a2493e738716050ccad6ddbd7d58f1943bc6373d015207202c27b646ceeb294ce516d4334edafbd771f869215cb070ba51dd7e2c720000c84e676dc11b0000000000000000'
        let decoded = abi.decodeEvent(data)
        assert(decoded.from.toString('hex') == 'da002226d93b2c422b95b780a2493e738716050ccad6ddbd7d58f1943bc6373d')
        assert(decoded.to.toString('hex') == '5207202c27b646ceeb294ce516d4334edafbd771f869215cb070ba51dd7e2c72')
        assert(decoded.value == 2000000000000000000n)
    })

    it('decode message', function () {
        let data = '0x84a15da15207202c27b646ceeb294ce516d4334edafbd771f869215cb070ba51dd7e2c720000f444829163450000000000000000'
        let decoded = abi.decodeMessage(data)
        assert(decoded.to.toString('hex') == '5207202c27b646ceeb294ce516d4334edafbd771f869215cb070ba51dd7e2c72')
        assert(decoded.value == 5000000000000000000n)
    })
})
