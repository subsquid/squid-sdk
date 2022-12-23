# @subsquid/commands

Command launcher for squids.

This tool was created as a replacement for npm scripts and Makefiles to cover the following shortcomings of both.

`npm` scripts:

* Hard to write complex commands.
* Commands are interpreted via the system shell, meaning the behaviour can be inconsistent across different platforms.
* No comments.
* No command descriptions to list in the overview.

`make(1)`:

* Requires WSL on Windows.
* Esoteric and unfamiliar to many modern developers.
* No command descriptions to list in the overview.

## Usage

`squid-commands(1)` is driven by a special `commands.json` file expected at the project root.

```shell
# list defined commands
squid-commands 

# execute `clean` and `build`
squid-commands clean build

# it is ok to use from any project dir
cd child/
squid-commands build
```

## `commands.json`

Below is a sample `commands.json` file demonstrating its features

```json5
{ // comments are ok
  "$schema": "https://subsquid.io/schemas/commands.json",
  "commands": {
    "clean": {
      "description": "delete all build artifacts",
      "cmd": ["rm", "-rf", "lib"]
    },
    "build": {
      "description": "build the project",
      "deps": ["clean"], // commands to execute before
      "cmd": ["tsc"]
    },
    "typegen": {
      "hidden": true, // Don't show in the overview listing
      "workdir": "abi", // change working dir
      "command": [
        "squid-evm-typegen", // node_modules/.bin is in the PATH
        "../src/abi",
        {"glob": "*.json"} // cross-platform glob expansion
      ],
      "env": { // additional environment variables
        "DEBUG": "*"
      }
    }
  }
}
```
