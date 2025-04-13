declare module '*.svg' {
  import type { Component, ComponentProps } from 'solid-js';
  const c: Component<ComponentProps<'svg'>>;
  // eslint-disable-next-line
  // @ts-ignore
  export default c;
}
