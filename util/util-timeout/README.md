# @subsquid/util-timeout

A small utility for promise timeouts.

## Usage

```typescript
import {addTimeout} from "@subsquid/util-timeout"

// Reject `promise` with `TimeoutError` if it doesn't complete in 5 seconds
addTimeout(promise, 5, () => new TimeoutError())
```
