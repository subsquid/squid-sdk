# @subsquid/logger

Lightweight structured logger for squid framework.

## Usage

```typescript
import {createLogger} from "@subsquid/logger"

const log = createLogger('sqd:demo')

log.info('message with severity info')
log.debug('message with severity debug')

log.info({foo: 1, bar: 2}, 'message and some additional attributes')

// info message consisting only of attributes
log.info({a: 1, b: 2, c: 3, array: [4, 5], obj: {foo: 'foo', bar: "bar"}}) 

// pass an Error object inplace of attributes
log.warn(new Error('Some error occured'))

// Error together with some other attributes and message
log.error({err: new Error('Another error'), a: 1, b: 2}, 'weird')

// create a child logger instance with namespace `sqd:demo:sql` 
// and `req: 1` attribute attached to every log record
const sqlLog = log.child('sql', {req: 1})
sqlLog.debug('connecting to database')
sqlLog.debug({sql: 'SELECT max(id) FROM status'})
```

## Configuration

There are 6 log levels available: `TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR`, `FATAL`.

The log level of each logger instance is solely determined by its namespace and specified
via set of `SQD_TRACE`, ..., `SQD_FATAL` environment variables.
The default log level is `INFO`. 

Users override the default log level by setting in appropriate 
environment variable a pattern which matches the logger's namespace.

* `SQD_DEBUG=*` - sets the log level to `DEBUG` for all loggers.
* `SQD_DEBUG=foo` - loggers `foo`, `foo:bar`, `foo:a:b`, etc will have a `DEBUG` level.
* `SQD_DEBUG=a:b*:c,d` - loggers `a:b:c`, `a:baz:c`, `a:baz:c:foo`, `d`, etc will have a `DEBUG` level, logger `a:z:c` will not.

When logger is matched by multiple `SQD_*` variables, the match with the highest specificity wins.
When specificities are equal, the most verbose matched log level will be effective.

Specificity is computed as a number of namespace characters 
which are not matched by wildcards and which are not part of a child namespace.
For example, given a pattern `foo*bar`, the specificity of `foo:bar:baz:qux`, `foobar` and `foobazbar` is `6`.

## Output

The logger always writes to `stderr`. 

When `stderr` is connected to a terminal, log records will be pretty printed.

![Pretty printed log records](img.png)

Otherwise, log records will be written as JSON lines.

```
{"level":2,"time":1669387525765,"ns":"sqd:demo","msg":"message with severity info"}
{"level":2,"time":1669387525766,"ns":"sqd:demo","msg":"message and some additional attributes","foo":1,"bar":2}
{"level":2,"time":1669387525766,"ns":"sqd:demo","a":1,"b":2,"c":3,"array":[4,5,6],"obj":{"foo":"foo","bar":"bar"}}
{"level":3,"time":1669387525766,"ns":"sqd:demo","err":{"stack":"Error: Some error occured\n    at Object.<anonymous> (/Users/eldar/dev/squid/util/logger/lib/demo.js:11:10)\n    at Module._compile (node:internal/modules/cjs/loader:1159:14)\n    at Module._extensions..js (node:internal/modules/cjs/loader:1213:10)\n    at Module.load (node:internal/modules/cjs/loader:1037:32)\n    at Module._load (node:internal/modules/cjs/loader:878:12)\n    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:81:12)\n    at node:internal/main/run_main_module:23:47"}}
{"level":4,"time":1669387525766,"ns":"sqd:demo","msg":"weird","err":{"stack":"Error: Another error\n    at Object.<anonymous> (/Users/eldar/dev/squid/util/logger/lib/demo.js:13:18)\n    at Module._compile (node:internal/modules/cjs/loader:1159:14)\n    at Module._extensions..js (node:internal/modules/cjs/loader:1213:10)\n    at Module.load (node:internal/modules/cjs/loader:1037:32)\n    at Module._load (node:internal/modules/cjs/loader:878:12)\n    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:81:12)\n    at node:internal/main/run_main_module:23:47"},"a":1,"b":2}
```
