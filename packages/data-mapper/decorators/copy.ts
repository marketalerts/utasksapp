import { Mapable, InputOf, original, MapableConstructor, setMap } from './base';

/**
 * Copies the field of a `Mappable` class using a mapper function
 * @param mapper accepts the original field, returns a resulting property value
 * @example
 * class MyIceCream extends Mappable<TheirIceCream> {
 *   // Simple null protection
 *   ⁣@Copy(name => name ?? 'Untitled ice cream')
 *   name!: string;
 * }
 */
export function Copy<
  O extends Mapable,
  N extends keyof I,
  T extends O[keyof O],
  R extends T,
  I extends object = InputOf<O>
>(
  mapper: (this: O | void, input: I[N]) => R
): (target?: T, ctx?: ClassFieldDecoratorContext<O, T> & { name: N }) => void;

/**
 * Copies the field of a `Mappable` class without any changes to it
 * @example
 * class MyIceCream extends Mappable<TheirIceCream> {
 *   // Copies the field with no changes
 *   ⁣@Copy
 *   name!: string;
 * }
 */
export function Copy<
  O extends Mapable,
  N extends keyof I,
  I extends object = InputOf<O>
>(
  target: undefined,
  ctx?: ClassFieldDecoratorContext<O, I[N]> & { name: N }
): void;

export function Copy<
  O extends Mapable,
  N extends keyof I,
  I extends object = InputOf<O>
>(
  mapper?: Function | undefined,
  ctx?: ClassFieldDecoratorContext<O, I[N]> & { name: N }
) {
  const decorator = (
    _: undefined,
    ctx: ClassFieldDecoratorContext<O, I[N]> & { name: N }
  ) => {
    const set = setMap(() => ctx.metadata[original] as MapableConstructor);

    set(
      'converters',
      () => [
        ctx.name,
        input => mapper ? mapper(input[ctx.name]) : input[ctx.name]
      ]
    );

    if (!mapper) {
      set(
        'reversals',
        () => [
          ctx.name,
          input => ({ [ctx.name]: input[ctx.name] })
        ]
      );
    }

    return function (this: O) {
      return mapper ? mapper.call(this, this[original][ctx.name]) : this[original][ctx.name];
    };
  };

  if (typeof mapper === 'function' || !ctx) {
    return decorator;
  }

  return decorator(mapper, ctx);
}

/**
 * Reverse-copies the field of a `Mappable` class using an optional mapper function
 *
 * Note: if the original operation has no mapping, then this decorator is redundant!
 * @param mapper accepts the final property and the whole object, returns a reverse-converted value
 * @example
 * class MyIceCream extends Mappable<TheirIceCream> {
 *   // Simple null protection
 *   ⁣@Copy(name => name ?? 'Untitled ice cream')
 *   name!: string;
 * }
 *
 * @example
 * class MyIceCream extends Mappable<TheirIceCream> {
 *   // If the original copying has no mapping,
 *   // the reverse decorator is not needed
 *   ⁣@Copy
 *   name?: string;
 * }
 */
Copy.reverse = function ReverseCopy<
  O extends Mapable,
  T extends O[keyof O],
  R extends T,
  I extends object = InputOf<O>
>(
  mapper?: (prop: R, output: O) => I[keyof I]
) {
  return function (_: undefined, ctx: ClassFieldDecoratorContext<O, T>) {
    setMap(() => ctx.metadata[original] as MapableConstructor)(
      'reversals',
      () => [
        ctx.name,
        input => ({
          [ctx.name]: mapper ? mapper(input[ctx.name], input) : input[ctx.name]
        })
      ]
    );
  }
}
