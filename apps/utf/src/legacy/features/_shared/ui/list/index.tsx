import { Dynamic, For } from 'solid-js/web';
import { Show, children, createMemo } from 'solid-js';
import type { Accessor, ComponentProps, JSX } from 'solid-js';
import { omit } from 'rambda';

import { ListItem, ListText } from './item';
import { ListContext } from './context';

type Children<T> = (value: T, index: Accessor<number>) => JSX.Element;

export interface ListProps<T> {
  class?: string;
  ref?: HTMLDivElement | ((ref: HTMLDivElement) => unknown);
  id?: string;
  each?: (T | undefined)[];
  type?: 'ol' | 'ul' | 'div';
  secondary?: boolean;
  collapsible?: boolean;
  title?: string | JSX.Element;
  skipFilter: true;
  children: Children<T | undefined> | [Children<T | undefined>, ...JSX.Element[]];
  refactor?: boolean;
}

export interface FilteredListProps<T> {
  class?: string;
  ref?: HTMLDivElement | ((ref: HTMLDivElement) => unknown);
  id?: string;
  each?: T[];
  type?: 'ol' | 'ul' | 'div';
  secondary?: boolean;
  collapsible?: boolean;
  title?: string | JSX.Element;
  skipFilter?: false;
  children: Children<T> | [Children<T>, ...JSX.Element[]] | JSX.Element[] | JSX.Element;
  refactor?: boolean;
}

function List<T>(
  props: ListProps<T>
): JSX.Element;
function List<T>(
  props: FilteredListProps<T>
): JSX.Element;
function List<T>(
  props: ListProps<T> | FilteredListProps<T>,
) {
  const each = createMemo(
    () => (props.skipFilter ? props.each : props.each?.filter((i): i is Exclude<T, undefined | null> => i != null)) ?? [],
  );

  const type = () => props.type ?? 'ul';

  const types = {
    ul,
    ol,
    div,
  };

  const resolved = children(() => {
    const [factory, ...other] = Array.isArray(props.children) ? props.children : [props.children];

    // Test if the first function is actually a component and not a callback
    if (typeof factory !== 'function' || factory.name.startsWith('bound ')) {
      return <>{props.children}</>;
    }

    return <>
      <For each={each()}>
        {(value, index) => factory(value as T, index)}
      </For>
      {other}
    </>;
  });

  return <div id={props.id} ref={props.ref}
    class="=list-container rounded-3 w-full overflow-hidden"
    classList={{
      'bg-tg_bg': !props.secondary,
      'bg-tg_bg_secondary': props.secondary,
      'bg-section!': props.refactor,
      [String(props.class)]: !!props.class,
    }}
  >
    <ListContext.Provider value={{ type: type() }}>
      <Show when={typeof props.title === 'string'}
        fallback={props.title ? props.title : ''}
      >
        <p>
          {props.title}
        </p>
      </Show>
      <Dynamic component={types[props.type ?? 'ul'] ?? ul} class="=list reset-list">
        {resolved()}
      </Dynamic>
    </ListContext.Provider>
  </div>;
}

function ol(props: ComponentProps<'ol'>) {
  return <ol {...omit(['children'], props)}>{props.children}</ol>;
}

function ul(props: ComponentProps<'ul'>) {
  return <ul {...omit(['children'], props)}>{props.children}</ul>;
}

function div(props: ComponentProps<'div'>) {
  return <div {...omit(['children'], props)}>{props.children}</div>;
}

List.Item = ListItem;
List.Text = ListText;

export default List;
