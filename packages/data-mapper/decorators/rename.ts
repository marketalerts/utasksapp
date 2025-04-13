import { MapableConstructor, original, setMap } from './base';
import { InputOf, Mapable } from './base';

/**
 * Renames the field of a `Mappable` class without any changes to it
 * @param key the original name of the field, if it matches the property name, this functions equivalently to using `⁣@Copy`
 * @example
 * class MyIceCream extends Mappable<TheirIceCream> {
 *   // Renames the field without changes
 *   // Was `flavor`, now will be `flavours`
 *   ⁣@Rename('flavor')
 *   flavours!: string[];
 * }
 */
export function Rename<
  O extends Mapable,
  K extends keyof I,
  I extends object = InputOf<O>
>(
  key: K
): (_: undefined, ctx: ClassFieldDecoratorContext<O, I[K]>) => void;

/**
 * Renames the field of a `Mappable` class using a mapper function
 * @param key the original name of the field
 * @param mapper accepts the original field, returns a resulting property value
 * @example
 * class MyIceCream extends Mappable<TheirIceCream> {
 *   // Renames the field using a mapper
 *   // Let's say the original was just a string of comma-separated values
 *   ⁣@Rename('flavor', flavor => flavor.split(','))
 *   flavours!: string[];
 * }
 */
export function Rename<
  O extends Mapable,
  K extends keyof I,
  T,
  I extends object = InputOf<O>
>(
  key: K,
  mapper: (this: O | void, input: I[K]) => T,
): (_: undefined, ctx: ClassFieldDecoratorContext<O, T>) => void;

export function Rename<
  O extends Mapable,
  T,
  K extends keyof O[typeof original]
>(
  key: K,
  mapper?: (this: O | void, input: InputOf<O>[K]) => T,
) {
  return function (_: undefined, ctx: ClassFieldDecoratorContext<O, T>) {
    const set = setMap(() => ctx.metadata[original] as MapableConstructor);

    set(
      'converters',
      () => [
        ctx.name,
        (input): T => mapper ? mapper(input[key]) : input[key]
      ]
    );

    set('renames', () => [ctx.name, key]);

    if (!mapper) {
      set(
        'reversals',
        () => [ctx.name, (output) => ({ [key]: output[ctx.name] })]
      );
    }

    return function (this: O) {
      return mapper ? mapper.call(this, this[original][key]) : this[original][key];
    };
  };
}

/**
 * Reverses the rename of the field using an optional mapper function
 *
 * Note: if the original rename doesn't do any mapping, this decorator is redundant
 * @param mapper accepts the final property value and the whole object, returns a reverse-converted value
 * @example
 * class MyIceCream extends Mappable<TheirIceCream> {
 *   // Renames the field using a mapper
 *   // Let's say the original was just a string of comma-separated values
 *   ⁣@Rename('flavor', flavor => flavor.split(','))
 *   // Reverses the rename as well as the mapping
 *   ⁣@Rename.reverse(flavours => flavours.join(','))
 *   flavours!: string[];
 * }
 *
 * @example
 * class MyIceCream extends Mappable<TheirIceCream> {
 *   // Renaming without the mapper doesn't need this!
 *   ⁣@Rename('flavor')
 *   flavours!: string[];
 * }
 */
Rename.reverse = function ReverseRename<
  O extends Mapable,
  T extends O[keyof O],
  R extends T,
  I extends object = InputOf<O>
>(
  mapper?: (prop: R, output: O) => I[keyof I]
) {
  return function (_: undefined, ctx: ClassFieldDecoratorContext<O, T>) {
    const set = setMap(() => ctx.metadata[original] as MapableConstructor);

    set(
      'reversals',
      (maps) => {
        const key = maps.renames.get(ctx.metadata[original] as MapableConstructor)![ctx.name as never];

        return [
          ctx.name,
          (output) => ({
            [key]: mapper ? mapper(output[ctx.name], output) : output[ctx.name]
          })
        ];
      }
    );
  }
}
