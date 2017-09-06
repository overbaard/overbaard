export function cloneObject(input: any): any {
  return JSON.parse(JSON.stringify(input));
}
