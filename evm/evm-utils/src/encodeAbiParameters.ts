import { AbiParameter, Hex } from "./types";

export function encodeFunctionData<
  const TParams extends readonly AbiParameter[] | readonly unknown[]
>(signature: Hex, params: TParams, values: any[]) {
  return concat([signature, encodeAbiParameters(params, values)]);
}

/**
 * @description Encodes a list of primitive values into an ABI-encoded hex value.
 */
export function encodeAbiParameters<
  const TParams extends readonly AbiParameter[] | readonly unknown[]
>(params: TParams, values: any[]): Hex {
  // Prepare the parameters to determine dynamic types to encode.
  const preparedParams = prepareParams({
    params: params as readonly AbiParameter[],
    values,
  });
  const data = encodeParams(preparedParams);
  if (data.length === 0) return "0x";
  return data;
}

/////////////////////////////////////////////////////////////////

type PreparedParam = { dynamic: boolean; encoded: Hex };

function prepareParams<const TParams extends readonly AbiParameter[]>({
  params,
  values,
}: {
  params: TParams;
  values: any[];
}) {
  const preparedParams: PreparedParam[] = [];
  for (let i = 0; i < params.length; i++) {
    preparedParams.push(prepareParam({ param: params[i], value: values[i] }));
  }
  return preparedParams;
}

function prepareParam<const TParam extends AbiParameter>({
  param,
  value,
}: {
  param: TParam;
  value: any[];
}): PreparedParam {
  const arrayComponents = getArrayComponents(param.type);
  if (arrayComponents) {
    const [length, type] = arrayComponents;
    return encodeArray(value, { length, param: { ...param, type } });
  }
  if (param.type === "tuple") {
    return encodeTuple(
      value as any,
      {
        param,
      } as any
    );
  }
  if (param.type === "address") {
    return encodeAddress(value as unknown as Hex);
  }
  if (param.type === "bool") {
    return encodeBool(value as unknown as boolean);
  }
  if (param.type.startsWith("uint") || param.type.startsWith("int")) {
    const signed = param.type.startsWith("int");
    return encodeNumber(value as unknown as number, signed);
  }
  if (param.type.startsWith("bytes")) {
    return encodeBytes(value as unknown as Hex, { param });
  }
  if (param.type === "string") {
    return encodeString(value as unknown as string);
  }
  throw new Error(`Unknown type: ${param.type}`);
}

/////////////////////////////////////////////////////////////////

export function size(value: Hex) {
  return Math.ceil((value.length - 2) / 2);
}

function pad(value: string, size: number = 32): Hex {
  return `0x${value.padStart(size * 2, "0")}`;
}

function padRight(value: string, size: number = 32): Hex {
  return `0x${value.padEnd(size * 2, "0")}`;
}

function padHex(value: Hex, opts?: { right?: boolean; size?: number }): Hex {
  if (opts?.right) {
    return padRight(value.slice(2), opts.size);
  }
  return pad(value.slice(2), opts?.size);
}

export function numberToHex(value_: number | bigint, signed = false): Hex {
  const value = BigInt(value_);
  const size = 32;

  let maxValue: bigint = 1n << 256n;
  if (typeof value_ === "number") {
    maxValue = BigInt(Number.MAX_SAFE_INTEGER);
  }

  let minValue = 0n;
  if (typeof value_ === "number" && signed) {
    minValue = BigInt(Number.MIN_SAFE_INTEGER);
  } else if (signed) {
    minValue = -(1n << 255n);
  }

  if ((maxValue && value > maxValue) || value < minValue) {
    throw new Error(
      `Number "${value}" is not in safe ${
        signed ? "signed" : "unsigned"
      } integer range [${minValue}, ${maxValue}]`
    );
  }

  const hex = `0x${(signed && value < 0
    ? (1n << BigInt(size * 8)) + BigInt(value)
    : value
  ).toString(16)}` as Hex;
  return padHex(hex) as Hex;
}

const concat = (hexes: Hex[]): Hex =>
  `0x${hexes.map((h) => h.slice(2)).join("")}`;

function encodeParams(preparedParams: PreparedParam[]): Hex {
  // 1. Compute the size of the static part of the parameters.
  let staticSize = 0;
  for (let i = 0; i < preparedParams.length; i++) {
    const { dynamic, encoded } = preparedParams[i];
    if (dynamic) staticSize += 32;
    else staticSize += size(encoded);
  }

  // 2. Split the parameters into static and dynamic parts.
  const staticParams: Hex[] = [];
  const dynamicParams: Hex[] = [];
  let dynamicSize = 0;
  for (let i = 0; i < preparedParams.length; i++) {
    const { dynamic, encoded } = preparedParams[i];
    if (dynamic) {
      staticParams.push(numberToHex(staticSize + dynamicSize));
      dynamicParams.push(encoded);
      dynamicSize += size(encoded);
    } else {
      staticParams.push(encoded);
    }
  }

  // 3. Concatenate static and dynamic parts.
  return concat([...staticParams, ...dynamicParams]);
}

/////////////////////////////////////////////////////////////////

function encodeAddress(value: Hex): PreparedParam {
  if (!value.match(/^0x[0-9a-fA-F]{40}$/))
    throw new Error(`Invalid address: ${value}`);
  return { dynamic: false, encoded: padHex(value.toLowerCase() as Hex) };
}

function encodeArray<const TParam extends AbiParameter>(
  value: any,
  {
    length,
    param,
  }: {
    length: number | null;
    param: TParam;
  }
): PreparedParam {
  const dynamic = length === null;

  if (!Array.isArray(value)) throw new Error(`Invalid array: ${value}`);
  if (!dynamic && value.length !== length)
    throw new Error(
      `Invalid ${param.type}[${length}] array length: ${value.length}`
    );

  let dynamicChild = false;
  const preparedParams: PreparedParam[] = [];
  for (let i = 0; i < value.length; i++) {
    const preparedParam = prepareParam({ param, value: value[i] });
    if (preparedParam.dynamic) dynamicChild = true;
    preparedParams.push(preparedParam);
  }

  if (dynamic || dynamicChild) {
    const data = encodeParams(preparedParams);
    if (dynamic) {
      const length = numberToHex(preparedParams.length);
      return {
        dynamic: true,
        encoded: preparedParams.length > 0 ? concat([length, data]) : length,
      };
    }
    if (dynamicChild) return { dynamic: true, encoded: data };
  }
  return {
    dynamic: false,
    encoded: concat(preparedParams.map(({ encoded }) => encoded)),
  };
}

function encodeBytes<const TParam extends AbiParameter>(
  value: Hex,
  { param }: { param: TParam }
): PreparedParam {
  const [, paramSize] = param.type.split("bytes");
  const bytesSize = size(value);
  if (!paramSize) {
    let value_ = value;
    // If the size is not divisible by 32 bytes, pad the end
    // with empty bytes to the ceiling 32 bytes.
    if (bytesSize % 32 !== 0)
      value_ = padHex(value_, {
        right: true,
        size: Math.ceil((value.length - 2) / 2 / 32) * 32,
      });
    return {
      dynamic: true,
      encoded: concat([padHex(numberToHex(bytesSize)), value_]),
    };
  }
  if (bytesSize !== parseInt(paramSize))
    throw new Error(`Invalid bytes${paramSize} length: ${bytesSize}`);

  return { dynamic: false, encoded: padHex(value, { right: true }) };
}

function encodeBool(value: boolean): PreparedParam {
  return { dynamic: false, encoded: pad(value ? "1" : "0") };
}

function encodeNumber(value: number, signed: boolean): PreparedParam {
  return {
    dynamic: false,
    encoded: numberToHex(value, signed),
  };
}

const hexes = /*#__PURE__*/ Array.from({ length: 256 }, (_v, i) =>
  i.toString(16).padStart(2, "0")
);

export function bytesToHex(value: Uint8Array): Hex {
  let string = "";
  for (let i = 0; i < value.length; i++) {
    string += hexes[value[i]];
  }
  return `0x${string}` as const;
}

function encodeString(value: string): PreparedParam {
  const encoded = new TextEncoder().encode(value);
  const partsLength = Math.ceil(encoded.length / 32);
  const parts: Hex[] = [];
  for (let i = 0; i < partsLength; i++) {
    parts.push(
      padHex(bytesToHex(encoded.slice(i * 32, (i + 1) * 32)), {
        right: true,
      })
    );
  }
  return {
    dynamic: true,
    encoded: concat([padHex(numberToHex(encoded.length)), ...parts]),
  };
}

function encodeTuple<
  const TParam extends AbiParameter & { components: readonly AbiParameter[] }
>(value: any, { param }: { param: TParam }): PreparedParam {
  let dynamic = false;
  const preparedParams: PreparedParam[] = [];
  for (let i = 0; i < param.components.length; i++) {
    const param_ = param.components[i];
    const index = Array.isArray(value) ? i : param_.name;
    const preparedParam = prepareParam({
      param: param_,
      value: (value as any)[index!],
    });
    preparedParams.push(preparedParam);
    if (preparedParam.dynamic) dynamic = true;
  }
  return {
    dynamic,
    encoded: dynamic
      ? encodeParams(preparedParams)
      : concat(preparedParams.map(({ encoded }) => encoded)),
  };
}

export function getArrayComponents(
  type: string
): [length: number | null, innerType: string] | undefined {
  const matches = type.match(/^(.*)\[(\d+)?]$/);
  return matches
    ? // Return `null` if the array is dynamic.
      [matches[2] ? Number(matches[2]) : null, matches[1]]
    : undefined;
}
