import {decodeXcm} from "./codec"

describe("XCM codec", function() {
    it('decodes without crush', () => {
        decodeXcm('0x000210010400010300a10f04320520000bf4a501cf4d010a1300010300a10f04320520000bf4a501cf4d010102286bee0d01000400010300e4201eaeb2f31d0d8321aef77936aa403a4ccc25')
    })
})
