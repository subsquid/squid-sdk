export interface AbiParameter {
  name?: string
  type: string
}

class Cursor {
  bytes: Uint8Array
  position: number
  positionReadCount: Map<number, number>
  recursiveReadLimit: number

  constructor(bytes: Uint8Array) {
    this.bytes = bytes
    this.position = 0
    this.positionReadCount = new Map()
    this.recursiveReadLimit = 8_192
  }

  inspectBytes(length: number) {
    return this.bytes.subarray(this.position, this.position + length)
  }
  public readBytes(length: number, size?: number) {
    const value = this.inspectBytes(length)
    this.position += size ?? length
    return value
  }
  public setPosition(position: number) {
    const oldPosition = this.position
    this.position = position
    return () => (this.position = oldPosition)
  }
}

export function decodeAbiParameters(
  params: AbiParameter[],
  data: `0x${string}`,
) {
  const bytes = Buffer.from(data.slice(2), 'hex')
  const cursor = new Cursor(bytes)

  let consumed = 0
  const values = []
  for (let i = 0; i < params.length; ++i) {
    const param = params[i]
    cursor.setPosition(consumed)
    const [data, consumed_] = decodeParameter(cursor, param, {
      staticPosition: 0,
    })
    consumed += consumed_
    values.push(data)
  }
  return values
}

export function getArrayComponents(
  type: string,
): [length: number | null, innerType: string] | undefined {
  const matches = type.match(/^(.*)\[(\d+)?]$/)
  return matches
    ? // Return `null` if the array is dynamic.
    [matches[2] ? Number(matches[2]) : null, matches[1]]
    : undefined
}

function decodeParameter(
  cursor: Cursor,
  param: AbiParameter,
  { staticPosition }: { staticPosition: number },
): readonly [any, number] {
  const arrayComponents = getArrayComponents(param.type)
  if (arrayComponents) {
    const [length, type] = arrayComponents
    return decodeArray(cursor, { ...param, type }, { length, staticPosition })
  }
  if (param.type === 'tuple')
    return decodeTuple(cursor, param as TupleAbiParameter, { staticPosition })

  if (param.type === 'address') return decodeAddress(cursor)
  if (param.type === 'bool') return decodeBool(cursor)
  if (param.type.startsWith('bytes'))
    return decodeBytes(cursor, param, { staticPosition })
  if (param.type.startsWith('uint') || param.type.startsWith('int'))
    return decodeNumber(cursor, param)
  if (param.type === 'string') return decodeString(cursor, { staticPosition })
  throw new Error(`Unknown type: ${param.type}`)
}

////////////////////////////////////////////////////////////////////
// Type Decoders

const sizeOfLength = 32
const sizeOfOffset = 32

function decodeAddress(cursor: Cursor) {
  const value = cursor.readBytes(sizeOfOffset)
  return [bytesToHex(value.slice(-20)), sizeOfLength] as const
}

function decodeArray(
  cursor: Cursor,
  param: AbiParameter,
  { length, staticPosition }: { length: number | null; staticPosition: number },
) {
  // If the length of the array is not known in advance (dynamic array),
  // this means we will need to wonder off to the pointer and decode.
  if (!length) {
    // Dealing with a dynamic type, so get the offset of the array data.
    const offset = bytesToNumber(cursor.readBytes(sizeOfOffset))

    // Start is the static position of current slot + offset.
    const start = staticPosition + offset
    const startOfData = start + sizeOfLength

    // Get the length of the array from the offset.
    cursor.setPosition(start)
    const length = bytesToNumber(cursor.readBytes(sizeOfLength))

    // Check if the array has any dynamic children.
    const dynamicChild = hasDynamicChild(param)

    let consumed = 0
    const value: unknown[] = []
    for (let i = 0; i < length; ++i) {
      // If any of the children is dynamic, then all elements will be offset pointer, thus size of one slot (32 bytes).
      // Otherwise, elements will be the size of their encoding (consumed bytes).
      cursor.setPosition(startOfData + (dynamicChild ? i * 32 : consumed))
      const [data, consumed_] = decodeParameter(cursor, param, {
        staticPosition: startOfData,
      })
      consumed += consumed_
      value.push(data)
    }

    // As we have gone wondering, restore to the original position + next slot.
    cursor.setPosition(staticPosition + 32)
    return [value, 32] as const
  }

  // If the length of the array is known in advance,
  // and the length of an element deeply nested in the array is not known,
  // we need to decode the offset of the array data.
  if (hasDynamicChild(param)) {
    // Dealing with dynamic types, so get the offset of the array data.
    const offset = bytesToNumber(cursor.readBytes(sizeOfOffset))

    // Start is the static position of current slot + offset.
    const start = staticPosition + offset

    const value: unknown[] = []
    for (let i = 0; i < length; ++i) {
      // Move cursor along to the next slot (next offset pointer).
      cursor.setPosition(start + i * 32)
      const [data] = decodeParameter(cursor, param, {
        staticPosition: start,
      })
      value.push(data)
    }

    // As we have gone wondering, restore to the original position + next slot.
    cursor.setPosition(staticPosition + 32)
    return [value, 32] as const
  }

  // If the length of the array is known in advance and the array is deeply static,
  // then we can just decode each element in sequence.
  let consumed = 0
  const value: unknown[] = []
  for (let i = 0; i < length; ++i) {
    const [data, consumed_] = decodeParameter(cursor, param, {
      staticPosition: staticPosition + consumed,
    })
    consumed += consumed_
    value.push(data)
  }
  return [value, consumed] as const
}

function decodeBool(cursor: Cursor) {
  return [bytesToBool(cursor.readBytes(32), 32), 32] as const
}

function decodeBytes(
  cursor: Cursor,
  param: AbiParameter,
  { staticPosition }: { staticPosition: number },
) {
  const [_, size] = param.type.split('bytes')
  if (!size) {
    // Dealing with dynamic types, so get the offset of the bytes data.
    const offset = bytesToNumber(cursor.readBytes(32))

    // Set position of the cursor to start of bytes data.
    cursor.setPosition(staticPosition + offset)

    const length = bytesToNumber(cursor.readBytes(32))

    // If there is no length, we have zero data.
    if (length === 0) {
      // As we have gone wondering, restore to the original position + next slot.
      cursor.setPosition(staticPosition + 32)
      return ['0x', 32] as const
    }

    const data = cursor.readBytes(length)

    // As we have gone wondering, restore to the original position + next slot.
    cursor.setPosition(staticPosition + 32)
    return [bytesToHex(data), 32] as const
  }

  const value = bytesToHex(cursor.readBytes(parseInt(size), 32))
  return [value, 32] as const
}

function decodeNumber(cursor: Cursor, param: AbiParameter) {
  const signed = param.type.startsWith('int')
  const size = parseInt(param.type.split('int')[1] || '256')
  const value = cursor.readBytes(32)
  return [
    size > 48
      ? bytesToBigInt(value, { signed })
      : bytesToNumber(value, { signed }),
    32,
  ] as const
}

type TupleAbiParameter = AbiParameter & { components: readonly AbiParameter[] }

function decodeTuple(
  cursor: Cursor,
  param: TupleAbiParameter,
  { staticPosition }: { staticPosition: number },
) {
  // Tuples can have unnamed components (i.e. they are arrays), so we must
  // determine whether the tuple is named or unnamed. In the case of a named
  // tuple, the value will be an object where each property is the name of the
  // component. In the case of an unnamed tuple, the value will be an array.
  const hasUnnamedChild =
    param.components.length === 0 || param.components.some(({ name }) => !name)

  // Initialize the value to an object or an array, depending on whether the
  // tuple is named or unnamed.
  const value: any = hasUnnamedChild ? [] : {}
  let consumed = 0

  // If the tuple has a dynamic child, we must first decode the offset to the
  // tuple data.
  if (hasDynamicChild(param)) {
    // Dealing with dynamic types, so get the offset of the tuple data.
    const offset = bytesToNumber(cursor.readBytes(sizeOfOffset))

    // Start is the static position of referencing slot + offset.
    const start = staticPosition + offset

    for (let i = 0; i < param.components.length; ++i) {
      const component = param.components[i]
      cursor.setPosition(start + consumed)
      const [data, consumed_] = decodeParameter(cursor, component, {
        staticPosition: start,
      })
      consumed += consumed_
      value[hasUnnamedChild ? i : component?.name!] = data
    }

    // As we have gone wondering, restore to the original position + next slot.
    cursor.setPosition(staticPosition + 32)
    return [value, 32] as const
  }

  // If the tuple has static children, we can just decode each component
  // in sequence.
  for (let i = 0; i < param.components.length; ++i) {
    const component = param.components[i]
    const [data, consumed_] = decodeParameter(cursor, component, {
      staticPosition,
    })
    value[hasUnnamedChild ? i : component?.name!] = data
    consumed += consumed_
  }
  return [value, consumed] as const
}

function decodeString(
  cursor: Cursor,
  { staticPosition }: { staticPosition: number },
) {
  // Get offset to start of string data.
  const offset = bytesToNumber(cursor.readBytes(32))

  // Start is the static position of current slot + offset.
  const start = staticPosition + offset
  cursor.setPosition(start)

  const length = bytesToNumber(cursor.readBytes(32))

  // If there is no length, we have zero data (empty string).
  if (length === 0) {
    cursor.setPosition(staticPosition + 32)
    return ['', 32] as const
  }

  const data = cursor.readBytes(length, 32)
  const value = new TextDecoder().decode(data)

  // As we have gone wondering, restore to the original position + next slot.
  cursor.setPosition(staticPosition + 32)

  return [value, 32] as const
}

export function hasDynamicChild(param: AbiParameter) {
  const { type } = param
  if (type === 'string') return true
  if (type === 'bytes') return true
  if (type.endsWith('[]')) return true

  if (type === 'tuple') return (param as any).components?.some(hasDynamicChild)

  const arrayComponents = getArrayComponents(param.type)
  if (
    arrayComponents &&
    hasDynamicChild({ ...param, type: arrayComponents[1] } as AbiParameter)
  )
    return true

  return false
}

////////////////////////////////////////////////////////////////////
/// Bytes parsing

const bytesToHex = (bytes: Uint8Array): `0x${string}` => {
  return `0x${Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('')}`
}

export function hexToBigInt(hex: `0x${string}`, opts: { signed?: boolean } = {}): bigint {
  const {signed} = opts
  const value = BigInt(hex)
  if (!signed) return value

  const size = (hex.length - 2) / 2
  const max = (1n << (BigInt(size) * 8n - 1n)) - 1n
  if (value <= max) return value

  return value - BigInt(`0x${'f'.padStart(size * 2, 'f')}`) - 1n
}

function bytesToNumber(bytes: Uint8Array, opts: { signed?: boolean } = {}) {
  const value = bytesToHex(bytes)
  return Number(hexToBigInt(value, opts))
}

function bytesToBool(bytes: Uint8Array, size: number) {
  return bytes[size - 1] !== 0
}

function bytesToBigInt(bytes: Uint8Array, opts: { signed?: boolean } = {}) {
  const value = bytesToHex(bytes)
  return hexToBigInt(value, opts)
}
