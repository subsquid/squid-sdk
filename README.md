# squid

The main repo of the squid project.

## Hacking

### Prerequisites

* Node v16.x
* [Rush](https://rushjs.io)
* Docker

You can install `rush` globally via npm (`npm install -g @microsoft/rush`)
or use `node ./common/scripts/install-run-rush.js` everywhere instead of `rush(1)`

### Some useful commands

```bash
# install npm dependencies
rush install 

# build all packages
rush build 

# run end-to-end test suite (independent from the commands above)
./test/e2e-suite/run.sh
```

This is a standard rush repo. All information from https://rushjs.io/pages/developer/new_developer/
applies here.
