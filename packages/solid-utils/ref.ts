import { createSignal } from "solid-js"

export const createRef = <T extends Element>() => {
  const refSignal = createSignal<T>();

  return [refSignal[0], <U extends T>(el: U) => refSignal[1](_ => el)] as const;
}