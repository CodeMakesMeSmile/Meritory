const INT_MIN = -(2 ** 31);
const INT_MAX = 2 ** 31 - 1;

/** Whether a JSON value fits a signature type such as int[] or TreeNode */
export function fitsType(type: string, value: unknown): boolean {
  if (type.endsWith("[]")) {
    const inner = type.slice(0, -2);
    return Array.isArray(value) && value.every((item) => fitsType(inner, item));
  }
  switch (type) {
    case "int":
      return isInt(value);
    case "long":
      // JSON numbers past 2^53 lose digits when read, so they can't be checked
      return Number.isSafeInteger(value);
    case "double":
      return typeof value === "number" && Number.isFinite(value);
    case "boolean":
      return typeof value === "boolean";
    case "char":
      // C and Java agree on ASCII characters
      return (
        typeof value === "string" &&
        value.length === 1 &&
        value.charCodeAt(0) < 128
      );
    case "string":
      return typeof value === "string";
    case "ListNode":
      return Array.isArray(value) && value.every(isInt);
    case "TreeNode":
      // Level order, with null for a missing child, so the root can't be null
      return (
        Array.isArray(value) &&
        value.every((item) => item === null || isInt(item)) &&
        (value.length === 0 || value[0] !== null)
      );
    default:
      return false;
  }
}

/** Whether a type is a list, so its order can be ignored */
export function isListType(type: string): boolean {
  return type.endsWith("[]");
}

function isInt(value: unknown): boolean {
  return (
    Number.isInteger(value) &&
    Number(value) >= INT_MIN &&
    Number(value) <= INT_MAX
  );
}

/** Turns a value into JSON with sorted keys, so equal values hash the same */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    const fields = Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`);
    return `{${fields.join(",")}}`;
  }
  return JSON.stringify(value);
}
