# @subsquid/commands

Command launcher for squids.

This tool was created as a replacement for npm scripts and Makefiles to cover the following
shortcomings of both.

npm scripts:

* Hard to write complex commands.
* Commands are interpreted via system shell, meaning behaviour can be inconsistent across platforms.
* No comments.
* No command descriptions for overview listing.

make(1):

* Not available on windows.
* Esoteric and unfamiliar to many modern developers.
* No command descriptions for overview listing.

## Usage

`squid-commands(1)` is driven by a special `commands.json` file supposed to be located at the project root.

```shell
# list defined commands
squid-commands 

# execute `clean` and `build`
squid-commands clean build

# it is ok to use from any project dir
cd child/
squid-commands build
```

## commands.json

Below is an example `commands.json` demonstrating its features

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
