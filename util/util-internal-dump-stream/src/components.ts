/**
 * What the `components` header of a message must say for the dumper to take it
 */
export interface ComponentsRule {
    /**
     * Every name of a block part, or of a way to fetch one, the dumper knows.
     * Any other name may change the shape of a block in a way the dumper knows nothing about.
     */
    known: ReadonlySet<string>
    /**
     * Name -> whether it must be in the tag. A name that changes nothing in the shape of a block
     * under the options of the dumper is left out.
     */
    exact: Map<string, boolean>
}

// A check the publisher has made (`v-`) or skipped (`no-`). The dumper repeats every check it needs,
// so these say nothing it relies on.
const CHECK_NAME = /^(v|no)-[a-z0-9]+(-[a-z0-9]+)*$/

/**
 * A cheap early reject of blocks of another shape. The tag is what the publisher says about itself,
 * what a block really holds is for the line checks to establish.
 */
export function matchComponents(tag: string, rule: ComponentsRule): boolean {
    let names = new Set<string>()

    for (let name of tag.split(',')) {
        let isKnown = rule.known.has(name) || CHECK_NAME.test(name)
        let isAcceptable = isKnown && !names.has(name)
        if (!isAcceptable) return false

        names.add(name)
    }

    for (let [name, on] of rule.exact) {
        if (names.has(name) != on) return false
    }

    return true
}
