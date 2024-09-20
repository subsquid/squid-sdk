import assert from 'assert'
import {Abi} from '../abi';
import metadataV3 from './metadata-v3.json'
import metadataV5 from './metadata-v5.json'

describe('erc-20 v3', function () {
    let abi = new Abi(metadataV3)

    it('decode constructor', function () {
        let data = '0x9bae9d5e0000a0dec5adc9353600000000000000'
        let decoded = abi.decodeConstructor(data)
        assert(decoded.initialSupply == 1000000000000000000000n)
    })

    it('decode event', function () {
        let data = '0x0001da002226d93b2c422b95b780a2493e738716050ccad6ddbd7d58f1943bc6373d015207202c27b646ceeb294ce516d4334edafbd771f869215cb070ba51dd7e2c720000c84e676dc11b0000000000000000'
        let decoded = abi.decodeEvent(data)
        assert(decoded.from == '0xda002226d93b2c422b95b780a2493e738716050ccad6ddbd7d58f1943bc6373d')
        assert(decoded.to == '0x5207202c27b646ceeb294ce516d4334edafbd771f869215cb070ba51dd7e2c72')
        assert(decoded.value == 2000000000000000000n)
    })

    it('decode message', function () {
        let data = '0x84a15da15207202c27b646ceeb294ce516d4334edafbd771f869215cb070ba51dd7e2c720000f444829163450000000000000000'
        let decoded = abi.decodeMessage(data)
        assert(decoded.to == '0x5207202c27b646ceeb294ce516d4334edafbd771f869215cb070ba51dd7e2c72')
        assert(decoded.value == 5000000000000000000n)
    })
})

describe('erc-20 v5', function () {
    let abi = new Abi(metadataV5)

    it('decode constructor', function () {
        let data = '0x9bae9d5e00000c6d51c8f7aa0600000000000000'
        let decoded = abi.decodeConstructor(data)
        assert(decoded.totalSupply == 123000000000000000000n)
    })

    it('decode event', function () {
        let data = '0xda002226d93b2c422b95b780a2493e738716050ccad6ddbd7d58f1943bc6373da69162c917081d15673558e13607b1b2261f2ae7b21ba911c3cd676767251266000064a7b3b6e00d0000000000000000'
        let topics = ['0x1a35e726f5feffda199144f6097b2ba23713e549bfcbe090c0981e3bcdfbcc1d',
                      '0xda002226d93b2c422b95b780a2493e738716050ccad6ddbd7d58f1943bc6373d',
                      '0xa69162c917081d15673558e13607b1b2261f2ae7b21ba911c3cd676767251266']
        let decoded = abi.decodeEvent(data, topics)
        assert(decoded.owner == '0xda002226d93b2c422b95b780a2493e738716050ccad6ddbd7d58f1943bc6373d')
        assert(decoded.spender == '0xa69162c917081d15673558e13607b1b2261f2ae7b21ba911c3cd676767251266')
        assert(decoded.value == 1000000000000000000n)
    })

    it('decode anonymous event', function () {
        let data = '0x01da002226d93b2c422b95b780a2493e738716050ccad6ddbd7d58f1943bc6373d01a69162c917081d15673558e13607b1b2261f2ae7b21ba911c3cd67676725126600008a5d784563010000000000000000'
        let topics = ['0xda002226d93b2c422b95b780a2493e738716050ccad6ddbd7d58f1943bc6373d',
                      '0xa69162c917081d15673558e13607b1b2261f2ae7b21ba911c3cd676767251266']
        let decoded = abi.decodeEvent(data, topics)
        assert(decoded.from == '0xda002226d93b2c422b95b780a2493e738716050ccad6ddbd7d58f1943bc6373d')
        assert(decoded.to == '0xa69162c917081d15673558e13607b1b2261f2ae7b21ba911c3cd676767251266')
        assert(decoded.value == 100000000000000000n)
    })

    it('decode message', function () {
        let data = '0x84a15da1a69162c917081d15673558e13607b1b2261f2ae7b21ba911c3cd67676725126600008a5d784563010000000000000000'
        let decoded = abi.decodeMessage(data)
        assert(decoded.to == '0xa69162c917081d15673558e13607b1b2261f2ae7b21ba911c3cd676767251266')
        assert(decoded.value == 100000000000000000n)
    })
})
