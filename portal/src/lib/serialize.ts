/** Plain JSON for Server → Client props. Dates become ISO strings. */
export function toClientProps<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
