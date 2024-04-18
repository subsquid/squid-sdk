import type { AbiEventParameter } from 'abitype'

function isStaticArray(param: AbiEventParameter) {
  return param.type.match(/\[\d+]$/)
}

function isDynamicArray(param: AbiEventParameter) {
  return param.type.endsWith('[]')
}

function elementsCount(param: AbiEventParameter) {
  return Number(param.type.match(/\[(\d+)]$/)?.[1] ?? 0)
}

function arrayChildType(param: AbiEventParameter) {
  return param.type.replace(/\[\d*]$/, '')
}

export function getType(param: AbiEventParameter, index?: number): string {
  const { name, ...namelessParam } = param

  if (name) {
    return `"${name}": ${getType(namelessParam as any)}`
  }

  if (index !== undefined) {
    return `"_${index}": ${getType(namelessParam)}`
  }

  const { indexed, ...indexlessParam } = param
  if (indexed) {
    return `indexed(${getType(indexlessParam as any)})`
  }
  if (isStaticArray(param)) {
    const elements = elementsCount(param)
    return `p.fixedSizeArray(${getType({
      ...param,
      type: arrayChildType(param),
    })}, ${elements})`
  }

  if (isDynamicArray(param)) {
    return `p.array(${getType({
      ...param,
      type: arrayChildType(param),
    })})`
  }

  if (param.type === 'tuple') {
    return `p.struct({${(param as any).components.map((type: AbiEventParameter, idx: number) => getType(type, idx)).join(', ')}})`
  }

  return `p.${param.type}`
}
