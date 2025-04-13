// @ts-expect-error this is a polyfill, basically
Symbol.metadata ??= Symbol('Symbol.metadata');

export const original = Symbol('input');

export abstract class Mapable<I extends object = any> {
  constructor(input: I) {
    this[original] = input;
  }

  /**
   * The original input value pre-conversion
   */
  readonly [original]: I;

  /**
   * Get the original value used to get a Mapable class instance
   * @param instance the instance of a Mapable
   * @returns the original input value pre-conversion
   */
  static original<C extends Mapable>(instance: C): InputOf<C> {
    return instance[original];
  }

  /**
   * Get a specific property converter from a Mapable class
   *
   * Can be used to convert a specific property value in-place
   */
  static getConverter<
    C extends MapableConstructor,
    P extends Exclude<keyof InstanceType<C>, typeof original>
  >(this: C, prop: P): undefined | Map<C, P>['converters'] {
    return maps.converters.get(this)?.[prop];
  }

  /**
   * Get a specific property reversal from a Mapable class
   *
   * Can be used to reverse-convert (revert) a specific property value in-place
   */
  static getReversal<
    C extends MapableConstructor,
    P extends Exclude<keyof InstanceType<C>, typeof original>
  >(this: C, prop: P): undefined | Map<C, P>['reversals'] {
    return maps.reversals.get(this)?.[prop];
  }

  /**
   * # UNSAFE
   *
   * Creates an instance of a Mapable class from raw properties,
   * without the original input conversion.
   *
   * Can lead to mem-leaks and unexpected "accesses of undefined",
   * use at your own risk.
   * @param constructor class to use as the prototype
   * @param obj raw properties
   * @returns class instance
   */
  static fromRaw<C extends MapableConstructor>(this: C, props: RawProperties<C, InstanceType<C>>) {
    return fromRaw(this, props);
  }

  /**
   * Reverse the mapping manually.
   *
   * If the result is immutable,
   * it is possible to simply return the original object
   */
  static revert<C extends MapableConstructor>(this: C, instance: InstanceType<C>) {
    return revert(instance, this);
  }
}

export type MapableConstructor<I extends object = any> = new (...args: any[]) => Mapable<I>;

type Map<C extends MapableConstructor = any, P extends keyof InstanceType<C> = any> = {
  converters: (this: InstanceType<C> | void, input: Partial<InputOf<InstanceType<C>>>) => InstanceType<C>[P];
  reversals: (output: InstanceType<C>[P]) => Partial<InputOf<InstanceType<C>>>;
  renames: PropertyKey;
};

const maps = {
  converters: new WeakMap<MapableConstructor, Record<PropertyKey, Map['converters']>>(),
  reversals: new WeakMap<MapableConstructor, Record<PropertyKey, Map['reversals']>>(),
  renames: new WeakMap<MapableConstructor, Record<PropertyKey, Map['renames']>>(),
};

const applicationQueue: Array<VoidFunction> = [];

export const setMap = <T extends MapableConstructor>(getToken: () => T) => (
  <
    M extends keyof typeof maps,
    K extends PropertyKey,
    V extends Map<T>[M]
  >(mapName: M, getEntry: (_maps: typeof maps) => [key: K, value: V]): void => {
    const map = maps[mapName];

    const applyRecord = () => {
      const token = getToken();

      if (!token) {
        return;
      }

      const [key, value] = getEntry(maps);

      if (!map.has(token)) {
        map.set(token, { [key]: value } as any);
        return;
      }

      map.get(token)![key] ??= value as any;
    };

    // Renames must be recorded first
    if (map === maps.renames) {
      applicationQueue.unshift(applyRecord);
    } else {
      applicationQueue.push(applyRecord);
    }
  }
);

/**
 * Allows to quickly map fields from an input object onto a typed class property using decorators,
 * in a very developer-friendly manner.
 *
 * The resulting object is mutable,
 * all mutations will be applied to the output object on revert.
 *
 * @example
 * ⁣@Mutable
 * class MyIceCream extends Mapable<TheirIceCream> {
 *   // Copies the field with no changes
 *   ⁣@Copy
 *   name!: string;
 *
 *   // Renames the field without changes
 *   ⁣@Rename('flavor')
 *   flavours!: string[];
 *
 *   // See other decorators for more
 * }
 */
export function Mutable<C extends MapableConstructor>(mapable: C, ctx: ClassDecoratorContext<C>) {
  ctx.metadata[original] = mapable;
  applicationQueue.splice(0)
    .forEach(rememberMappers => rememberMappers());
}

/**
 * Allows to quickly map fields from an input object onto a typed class property using decorators,
 * in a very developer-friendly manner.
 *
 * The resulting object is deemed immutable.
 *
 * @example
 * ⁣@Immutable
 * class MyIceCream extends Mapable<TheirIceCream> {
 *   // Copies the field with no changes
 *   ⁣@Copy
 *   name!: string;
 *
 *   // Renames the field without changes
 *   ⁣@Rename('flavor')
 *   flavours!: string[];
 *
 *   // See other decorators for more
 * }
 */
export function Immutable<C extends MapableConstructor>(mapable: C, ctx: ClassDecoratorContext<C>) {
  ctx.metadata[original] = mapable;
  ctx.metadata.immutable = true;
  applicationQueue.splice(0)
    .forEach(rememberMappers => rememberMappers());
}

/**
 * Checks if a mapable class or an instance of that class is immutable
 * @param thing an instance or constructor of a class
 */
Immutable.is = function <M extends MapableConstructor | Mapable>(thing: M) {
  const constructor = typeof thing === 'function' ? thing : thing.constructor;

  return !!(constructor[Symbol.metadata])?.immutable;
}

export type InputOf<O extends Mapable> = (
  O extends Mapable<infer i> ? i : never
);

/**
 * Creates a functional converter to the target Mappable class
 * @param mapable a target class constructor
 * @returns a converter function
 */
export const to = <M extends MapableConstructor>(mapable: M) => (
  (...args: ConstructorParameters<M>) => new mapable(...args) as InstanceType<M>
);

type InferRevert<M extends Mapable | undefined> =
  M extends undefined | never
  ? undefined
  : InputOf<Exclude<M, undefined>>;

/**
 * Creates a functional reverse converter from the target Mappable class
 *
 * Mostly equivalent to passing the `revert` function directly,
 * but also has null-safety and better type-checking
 * @param mapable a target class constructor
 * @returns a converter function
 */
export const from = <M extends MapableConstructor>(mapable?: M) => {
  return <I extends InstanceType<M> | undefined>(instance: I) => (
    instance ? revert(instance) : undefined
  ) as InferRevert<I>
};

type RawProperties<C extends MapableConstructor, Instance = InstanceType<C>> = {
  [key in keyof Instance as Exclude<key, 'revert' | typeof original>]: Instance[key];
};

/**
 * @deprecated - UNSAFE, will probably be removed once a better abstraction is found
 *
 * Creates an instance of a Mapable class from raw properties,
 * without the original input conversion.
 *
 * Can lead to mem-leaks and unexpected "accesses of undefined",
 * use at your own risk.
 * @param constructor class to use as the prototype
 * @param obj raw properties
 * @returns class instance
 */
export const fromRaw = <
  C extends MapableConstructor,
  O extends RawProperties<C>
>(constructor: C, obj: O): InstanceType<C> => {
  const instance = Object.create(constructor.prototype, Object.keys(obj).reduce((map, prop) => ({
    ...map,
    [prop]: {
      value: obj[prop as keyof typeof obj],
      enumerable: true,
    }
  }), {
    constructor: {
      value: constructor,
      enumerable: false,
      writable: true,
      configurable: true,
    }
  } as PropertyDescriptorMap));

  return instance;
}

/**
 * Reverse the mapping manually.
 *
 * If the result is immutable,
 * it is possible to simply return the original object
 */
export function revert<M extends Mapable>(instance: M, constructor?: MapableConstructor<InputOf<M>>): InputOf<M> {
  if (Immutable.is(instance)) {
    return instance[original];
  }

  let input = {} as InputOf<M>;
  const base = constructor ?? instance.constructor as MapableConstructor;

  const classReversals = maps.reversals.get(base);

  if (!(instance instanceof Mapable) || !classReversals) {
    console.warn(
      new TypeError(`${(instance as Mapable)} does not have a reverse convertation capability!`)
    );

    return instance[original] ?? instance;
  }

  for (const prop in classReversals) if (typeof classReversals[prop] === 'function') {
    input = { ...input, ...classReversals[prop](instance) };
  } else {
    console.error(`${instance.constructor.name} has no reverse converter for property "${prop}"`);
  }

  return input;
}
