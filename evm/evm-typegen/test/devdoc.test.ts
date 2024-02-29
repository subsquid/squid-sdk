import {describe, expect, it} from "vitest";
import {devdoc} from "../src/devdoc";

describe("Devdoc", () => {
  const exampleContract = `
  contract Test {
    /// @dev This is a test
    event Test(uint256 a, uint256 b);
    /**
    * @dev Returns a + b
    * @param a The first number
    * @param b The second number
    * @return The sum of a and b
    */
    function plus(uint256 a, uint256 b) public returns (uint256) {}
  }
  `
  it("formats devdoc correctly", async () => {
    const {methods, events} = await devdoc(exampleContract, {})
    expect(methods['plus(uint256,uint256)']).toBe('/**\n' +
      '  * Returns a + b\n' +
      '  * @param a The first number\n' +
      '  * @param b The second number\n' +
      '  * @return The sum of a and b\n' +
      '*/')
    expect(events['Test(uint256,uint256)']).toBe('/**\n' +
      '  * This is a test\n' +
      '*/')
  })
})
