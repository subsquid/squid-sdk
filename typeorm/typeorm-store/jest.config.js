/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  setupFiles: ["dotenv/config"],
  rootDir: ".",
  transform: {
    "^.+\\.ts$": "ts-jest"
  },
  // coverageReporters: ["html"]
};