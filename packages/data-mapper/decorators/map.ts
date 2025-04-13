import { MapableConstructor, setMap, original } from './base';
import { InputOf, Mapable } from './base';

/**
 * Maps the field of a `Mappable` class using a mapper function
 * @param mapper accepts the original input object, returns a resulting property value
 * @example
 * class MyIceCream extends Mappable<TheirIceCream> {
 *   // Converts to Celcius
 *   ⁣@Map(input => (input.tempF - 32) / 1.8)
 *   temperature!: number;
 * }
 */
export function Map<
  O extends Mapable<I>,
  T extends O[keyof O],
  R extends T,
  I extends object = InputOf<O>
>(
  mapper: (this: O | void, input: Partial<I>) => R
) {
  return function (_: undefined, ctx: ClassFieldDecoratorContext<O, T>) {
    setMap(() => ctx.metadata[original] as MapableConstructor<I>)(
      'converters',
      () => [ctx.name, (input): R => mapper(input)]
    );

    return function (this: O) {
      return mapper.call(this, this[original]);
    };
  }
}

/**
 * Reverses the mapping for the field of a `Mappable` class using a reverse mapper function
 * @param mapper accepts the final object, returns an object with the partial signature of the intial
 * @example
 * class MyIceCream extends Mappable<TheirIceCream> {
 *   // Converts to Celcius
 *   ⁣@Map(input => (input.tempF - 32) / 1.8)
 *   // Reverses to Farenheit
 *   ⁣@Map.reverse(output => ({ tempF: (output.temperature * 9/5) + 32 }))
 *   temperature!: number;
 * }
 */
Map.reverse = function ReverseMap<
  O extends Mapable,
  T extends O[keyof O],
  R extends T,
  I extends object = InputOf<O>
>(
  mapper: (prop: R, output: O) => Partial<I>
) {
  return function (_: undefined, ctx: ClassFieldDecoratorContext<O, R>) {
    setMap(() => ctx.metadata[original] as MapableConstructor<I>)(
      'reversals',
      () => [
        ctx.name,
        (output) => mapper(output[ctx.name], output)
      ]
    );
  }
}
