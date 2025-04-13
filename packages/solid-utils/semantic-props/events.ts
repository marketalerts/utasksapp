import { Component } from "solid-js";

type F = (...args: any) => any;

export type EventsDeclaration = Record<string, F>;

export type EventName<N extends string = string> = `on:${N}`;

export type Events<T extends EventsDeclaration> = {
  [name in Extract<keyof T, string> as EventName<name>]?: T[name];
}

export type ComponentEvents<C extends Component> = C extends Component<infer P>
  ? ToDeclaration<P>
  : never;

export type ToDeclaration<
  T extends Record<string, any>,
  Keys extends string = {
    [name in keyof T]: name extends EventName<infer E> ? E : never;
  }[keyof T],
> = {
  [name in Keys]: T[EventName<name>];
};

export type Emit<T extends EventsDeclaration> = {
  <K extends keyof T>(event: K, ...args: Parameters<T[K]>): ReturnType<T[K]>;
};

export function useEvents<T extends Record<string, any>>(props: T): Emit<ToDeclaration<T>> {
  type EventMap = ToDeclaration<T>;
  return function emit<K extends keyof EventMap>(event: K, ...args: Parameters<EventMap[K]>): ReturnType<EventMap[K]> {
    return props[`on:${event}`]?.(...args);
  }
}
