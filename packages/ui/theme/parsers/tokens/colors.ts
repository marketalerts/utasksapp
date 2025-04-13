import type { Nested, UnoCSS } from '../types';

function parseColors(theme: Tokens.Theme): UnoCSS.Colors {
  const flatKeyTree = Object.entries(theme).map(([key, value]) => [
    key.split('-'),
    isRecord(value) ? parseRecord(value) : parseColors(value),
  ] as const);

  const finalColors = {} as UnoCSS.Colors;

  for (const [keys, value] of flatKeyTree) {
    /* background - to avoid bg-bg-* */
    if (keys[0] === 'bg') {
      Object.assign(finalColors, unwrapKeys(keys, finalColors, value)[keys[0]]);
      continue;
    }

    Object.assign(finalColors, unwrapKeys(keys, finalColors, value));
  }

  return finalColors;
}

function unwrapKeys(keys: string[], target: Nested, value: string | Nested): Nested {
  const primaryKey = keys[0] ?? null;
  const subTarget = (typeof target[primaryKey] === 'string' ? null : target[primaryKey]) ?? {};

  if (primaryKey === null) return {};

  return {
    ...target,
    [primaryKey]: keys.length <= 1 ? value : {
      ...subTarget,
      ...unwrapKeys(keys.slice(1), subTarget, value),
    },
  };
}

function parseRecord(record: Tokens.Record) {
  return record.value
    .replaceAll('.', '-')
    .replace(/^{?(.*?)}?$/, 'var($1)');
}

function isRecord(value: any): value is Tokens.Record {
  return ['value'].every(thing => thing in value && typeof value[thing] === 'string');
}

namespace Tokens {
  export interface Record {
    value: string;
  }

  export interface Theme {
    [key: string]: Theme | Record;
  }
}

export function importTokenColors<T extends Tokens.Theme>(tokens: T) {
  return parseColors(tokens);
}

export type ParsedTokens<T extends Tokens.Theme> = {
  [key in keyof T & string]: T[key] extends Tokens.Record
    ? { [k in key]: T[key]['value'] }
    : SplitString<key, T[key]>
};

declare const c: SplitString<'header-alt'>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type SplitString<S extends string, Val = {}, Delimiter extends string = '-'> = (
  S extends `${infer Item}${Delimiter}${infer SubS}`
    ? {
      [key in Item]: SplitString<SubS, Val, Delimiter>
    }
    : {
      [key in S]: Val
    }
);

type JoinValues<Obj extends object> = keyof Obj