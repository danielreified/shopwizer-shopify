declare module 'culori' {
  export function parse(input: string): any;
  export function converter(mode: string): (input: any) => any;
}
