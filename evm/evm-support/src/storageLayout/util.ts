import {Elementary} from './codec'

export function normalizeElementaryType(str: string): Elementary {
    let type: Elementary

    if (str.startsWith('enum')) {
        type = str.slice(0, 3) as 'enum'
    } else if (str.startsWith('contract')) {
        type = str.slice(0, 7) as 'contract'
    } else {
        type = str as Elementary
    }

    return type
}

export function getItemOffset(index: number, width: number) {
    return (index % Math.floor(32 / width)) * width
}
