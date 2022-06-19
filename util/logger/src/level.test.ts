import assert from "assert"
import {Levels, LogLevel} from "./level"


function suite(
    config: [level: LogLevel, pattern: string][],
    tests: [ns: string, level: LogLevel][]
) {
    let name = config.map(([level, pattern]) => LogLevel[level] + '=' + pattern).join('; ')
    describe(name ? 'with ' + name : 'by default', function() {
        let levels = new Levels()
        config.forEach(([level, pattern]) => {
            levels.configure(level, pattern)
        })
        tests.forEach(([ns, level]) => {
            it(ns + '=' + LogLevel[level], () => {
                assert.strictEqual(levels.get(ns), level)
            })
        })
    })
}


describe("levels", function() {
    suite([], [
        ['foo', LogLevel.INFO]
    ])

    suite([
        [LogLevel.DEBUG, '*']
    ], [
        ['foo', LogLevel.DEBUG],
        ['bar', LogLevel.DEBUG]
    ])

    suite([
        [LogLevel.DEBUG, 'foo']
    ], [
        ['foo', LogLevel.DEBUG],
        ['foo:bar', LogLevel.DEBUG],
        ['foobar', LogLevel.INFO]
    ])

    suite([
        [LogLevel.DEBUG, 'foo:*']
    ], [
        ['foo', LogLevel.INFO],
        ['foo:bar', LogLevel.DEBUG],
        ['foobar', LogLevel.INFO]
    ])

    suite([
        [LogLevel.DEBUG, 'foo*bar']
    ], [
        ['foobar', LogLevel.DEBUG],
        ['foo:bar', LogLevel.DEBUG],
        ['foo:baz:bar:qux', LogLevel.DEBUG],
        ['foobaz', LogLevel.INFO]
    ])

    suite([
        [LogLevel.DEBUG, '*'],
        [LogLevel.WARN, 'foo'],
        [LogLevel.ERROR, 'foo:*:bar']
    ], [
        ['bar', LogLevel.DEBUG],
        ['foo', LogLevel.WARN],
        ['foo:bar', LogLevel.WARN],
        ['foo:qux:bar', LogLevel.ERROR]
    ])

    suite([
        [LogLevel.DEBUG, 'foo, foo:*:baz'],
        [LogLevel.WARN, 'foo:*']
    ], [
        ['foo', LogLevel.DEBUG],
        ['foo:bar:baz', LogLevel.DEBUG],
        ['foo:bar', LogLevel.WARN]
    ])
})
