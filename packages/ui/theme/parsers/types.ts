export namespace UnoCSS {
  export type Record = string;

  export interface Colors {
    [key: string]: Colors | Record;
  }
}

export interface Nested {
  [key: string]: Nested | string;
}
