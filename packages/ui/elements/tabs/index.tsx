import { createEffect, createSelector, createSignal } from 'solid-js';
import type { JSX, ParentComponent, Signal } from 'solid-js';
import { get, set } from 'solid-utils/access';

export interface TabItem<T> {
  value: T;
  disabled?: () => boolean;
  children: (Wrapper: ParentComponent) => JSX.Element;
}

export default function Tabs<T>(props: {
  tabList: TabItem<T>[];
  selected: Signal<T>;
  children:  | ((selectedTab: TabItem<T>) => JSX.Element);
}) {
  const selectedTab = createSignal(props.tabList[0]);

  const isSelected = createSelector(() => get(selectedTab), (a, b) => a.value === b.value);

  return <>
    {[
      () => <></>,
      () => <></>,
      () => <></>,
    ]}
  </>;
}
