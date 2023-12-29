export function isTsNode(): boolean {
    // Don't import `process` as module. The check will fail
    return !!(process as any)[Symbol.for('ts-node.register.instance')]
}
