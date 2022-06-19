export enum LogLevel {
    TRACE = 0,
    DEBUG = 1,
    INFO = 2,
    WARN = 3,
    ERROR = 4,
    FATAL = 5
}


type Specificity = number


interface NamespaceMatcher {
    (ns: string): Specificity
}


function compileLevelConfig(config: string): NamespaceMatcher {
    let variants = config.split(',').map(ns => {
        ns = ns.trim()
        let regex = new RegExp('^' + ns.split('*').map(escapeRegex).join('(.*)') + '(:.*)?$')
        return function match(ns: string) {
            let m = regex.exec(ns)
            if (!m) return 0
            let specificity = ns.length + 1
            for (let i = 1; i < m.length; i++) {
                specificity -= m[i]?.length || 0
            }
            return specificity
        }
    })

    return function matchLevel(ns: string): Specificity {
        let specificity = 0
        for (let i = 0; i < variants.length; i++) {
            specificity = Math.max(specificity, variants[i](ns))
        }
        return specificity
    }
}


// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}


function noMatch(ns: string): Specificity {
    return 0
}


export class Levels {
    private cache: Record<string, LogLevel> = {}
    private levels: NamespaceMatcher[] = [noMatch, noMatch, noMatch, noMatch, noMatch, noMatch]

    get(ns: string): LogLevel {
        let level = this.cache[ns]
        if (level == null) {
            return this.cache[ns] = this.determineLevel(ns)
        } else {
            return level
        }
    }

    private determineLevel(ns: string): LogLevel {
        let specificity = 0
        let level = LogLevel.INFO
        for (let i = 0; i < this.levels.length; i++) {
            let s = this.levels[i](ns)
            if (s > specificity) {
                level = i
                specificity = s
            }
        }
        return level
    }

    configure(level: LogLevel, config: string): void {
        this.levels[level] = compileLevelConfig(config)
        this.cache = {}
    }
}


export const LEVELS = new Levels()


;['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'].forEach((name, level) => {
    let env = process.env[`SQD_${name}`]
    if (env) {
        LEVELS.configure(level, env)
    }
})
