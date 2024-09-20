export function propName(prop: string): string {
    if (isValidProperty(prop)) {
        return prop
    } else {
        return '[' + JSON.stringify(prop) + ']'
    }
}


export function propAccess(prop: string): string {
    if (isValidProperty(prop)) {
        return '.' + prop
    } else {
        return '[' + JSON.stringify(prop) + ']'
    }
}


function isValidProperty(s: string): boolean {
    return /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(s)
}
