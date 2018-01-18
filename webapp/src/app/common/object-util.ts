export function cloneObject(input: any): any {
  return JSON.parse(JSON.stringify(input));
}

export function freezeObject<T>(input: T): T {
  return <T>Object.freeze(input);
}
