declare module 'receipt' {
  export var config: { width: number; currency: string; ruler: string };
  export function create(props: Array<any>): string;
}
