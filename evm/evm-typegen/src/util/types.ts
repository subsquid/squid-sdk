import type { AbiEventParameter } from "abitype";

function isStaticArray(param: AbiEventParameter) {
  return param.type.match(/\[\d+]$/);
}

function isDynamicArray(param: AbiEventParameter) {
  return param.type.endsWith("[]");
}

function elementsCount(param: AbiEventParameter) {
  return Number(param.type.match(/\[(\d+)]$/)?.[1] ?? 0);
}

function arrayChildType(param: AbiEventParameter) {
  return param.type.replace(/\[\d*]$/, "");
}

export function getType(param: AbiEventParameter): string {
  const { indexed, ...indexlessParam } = param;
  if (indexed) {
    return `indexed(${getType(indexlessParam as any)})`;
  }
  const { name, ...namelessParam } = indexlessParam;

  if (name) {
    return `arg("${name}", ${getType(namelessParam as any)})`;
  }

  if (isStaticArray(param)) {
    const elements = elementsCount(param);
    return `fixedArray(${getType({
      ...param,
      type: arrayChildType(param),
    })}, ${elements})`;
  }

  if (isDynamicArray(param)) {
    return `array(${getType({
      ...param,
      type: arrayChildType(param),
    })})`;
  }

  if (param.type === "tuple") {
    return `tuple(${(param as any).components.map(getType).join(", ")})`;
  }

  return `p.${param.type}`;
}
