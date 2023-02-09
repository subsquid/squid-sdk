import {last} from '@subsquid/util-internal'


export class PriorityQueue<Item extends {priority: number}> {
    private items: Item[][] = []

    push(req: Item): void {
        let i = 0
        while (i < this.items.length && this.items[i][0].priority < req.priority) {
            i += 1
        }
        if (i == this.items.length) {
            this.items.push([req])
        } else if (this.items[i][0].priority == req.priority) {
            this.items[i].push(req)
        } else {
            this.items.splice(i, 0, [req])
        }
    }

    take(skip: number, count: number): Item[] {
        let requests: Item[] = []
        for (let i = 0; i < this.items.length && count > 0; i++) {
            let item = this.items[i]
            if (skip < item.length) {
                let taking = Math.min(count, item.length - skip)
                if (taking == item.length) {
                    requests.push(...item)
                    this.items.splice(i, 1)
                } else {
                    requests.push(...item.splice(skip, taking))
                }
                count -= taking
            } else {
                skip -= item.length
            }
        }
        return requests
    }

    takeLast(): Item | undefined {
        if (this.items.length == 0) return
        let item = last(this.items)
        if (item.length == 1) {
            this.items.pop()
            return item[0]
        } else {
            return item.pop()
        }
    }

    takeAll(): Item[] {
        let items = this.items.flatMap(its => its)
        this.items.length = 0
        return items
    }

    isEmpty(): boolean {
        return this.items.length == 0
    }

    isNotEmpty(): boolean {
        return this.items.length > 0
    }
}
