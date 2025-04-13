import type { original } from '.';

export type Converter<I extends object = any, O extends object = any, Args extends any[] = any> = (input: I, ...args: Args) => O;
export type ReverseConverter<I extends object = any, O extends object = any, Args extends any[] = any> = (output: O, ...args: Args) => I;

export const revert = Symbol('reverse convert');
export const properties = Symbol('properties');

export interface ConverterConstructor<I extends object, O extends object, Args extends any[]> {
  new (input: I, ...args: Args): O & {
    readonly [original]: I;
    readonly [properties]: O;
  };

  convert(input: I, ...args: Args): InstanceType<this>;
  convert(input?: undefined, ...args: Args): undefined;
  convert(input?: I, ...args: Args): InstanceType<this> | undefined;

  fromRaw<C extends InstanceType<this>>(properties: O): C;
}

export interface ReverseConverterConstructor<I extends object, O extends object, Args extends any[], RArgs extends any[]> {
  new (input: I, ...args: Args): O & {
    readonly [original]: I;
    readonly [properties]: O;
    [revert](...args: Args): I;
  };

  convert(input: I, ...args: Args): InstanceType<this>;
  convert(input?: undefined, ...args: Args): undefined;
  convert(input?: I, ...args: Args): InstanceType<this> | undefined;

  reverse(output: O, ...args: RArgs): I;
  reverse(output?: undefined, ...args: RArgs): undefined;
  reverse(output?: O, ...args: RArgs): I | undefined;

  fromRaw<C extends InstanceType<this>>(properties: O): C;
}
