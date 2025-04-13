import { JSX, mergeProps, splitProps } from "solid-js";
import { MapSlots, ParamsToSlots, Slots, SlotsFactory, SlotsParams, useSlots } from "./slots";
import { Emit, Events, EventsDeclaration, useEvents } from "./events";

export type SemanticProps<
  P extends Record<string, any> = Record<string, any>,
  S extends SlotsParams = SlotsParams,
  E extends EventsDeclaration = EventsDeclaration,
> = {
  props: P;
  slots?: S;
  events?: E;
};

export interface ISemanticContext<T extends SemanticProps, D extends Partial<T['props']>> {
  props: {
    [p in keyof D]-?: D[p];
  } & Omit<T['props'], keyof D>;
  emit: Emit<Exclude<T['events'], undefined>>;
  useSlots: MapSlots<ParamsToSlots<Exclude<T['slots'], undefined>>>;
}

type MergeSemanticProps<
  T extends SemanticProps,
  P extends T['props'] = T['props'],
  S extends T['slots'] = T['slots'],
  E extends T['events'] = T['events'],
> = P & (
  E extends EventsDeclaration
    ? S extends SlotsParams
      ? Omit<Events<E> & Slots<S>, keyof T['props']>
      : Omit<Events<E>, keyof T['props']>
    : S extends SlotsParams
      ? Slots<S>
      : {}
);

export type Semantic<T extends SemanticProps> = MergeSemanticProps<T>;

export function useSemanticProps<T extends SemanticProps, D extends Partial<T['props']>>(
  props: Semantic<T>,
  defaults?: D,
): ISemanticContext<T, D> {
  type slots = ParamsToSlots<Exclude<T['slots'], undefined>>;
  type events = Exclude<T['events'], undefined>;

  const [events, slots, _props] = splitProps(
    mergeProps(defaults ?? {}, props),
    getEventNames(props),
    ['children']
  ) as unknown as [events, { children: slots }, ISemanticContext<T, D>['props']];

  return {
    props: _props,
    emit: useEvents(events),
    useSlots: (factory: SlotsFactory<slots>) => useSlots(slots, factory)
  };
}

function getEventNames<T extends Record<string, any>>(props: T) {
  return Object.keys(props).filter(key => key.startsWith('on:'));
}