import { set, get } from 'solid-utils/access';
import { For, Show, children, createEffect, createSignal } from 'solid-js';
import type { Accessor, ComponentProps, JSXElement, ParentProps } from 'solid-js';

import useSortable from 'shared/sortable';
import { isMobile } from 'shared/platform';

import { isArea, ProjectType  } from 'f/project/project.adapter';
import type { ClientItem } from 'f/project/project.adapter';

import { GroupsExplorerMode, isLinks  } from './explorer-mode';
import type { ModeOptions } from './explorer-mode';

import Item from './explorer-item.ui';

import Drag from 'icons/Drag.svg';

export interface ListProps<T extends ClientItem[], U extends JSXElement> extends Partial<ModeOptions> {
  each: T | undefined | null;
  collapsed?: Accessor<boolean>;
  sparse?: boolean;
  wrapText?: boolean;
  areaId?: string;
  onReorder?(id: string, index: number, containerId?: string): void;

  ref?: (el: HTMLUListElement) => void;
  children?: (item: T[number], index: Accessor<number>) => U;
  fallback?: JSXElement;
}

const enableHandles = () => navigator.maxTouchPoints === 0 || !isMobile();

export default function List<T extends ClientItem[], U extends JSXElement>(props: ListProps<T, U>) {
  const mode = props.mode ?? GroupsExplorerMode.Links;

  const [chosen, setChosen] = createSignal('');

  const listHeight = createSignal((props.each?.length ?? 0) * (45 + (props.areaId ? 0 : 16)));

  const getContainerId = (el: HTMLElement): string | undefined => el.parentElement?.dataset.id;

  const { initSortable, initItem } = useSortable(() => ({
    group: 'list',
    idKey: 'id',
    items: props.each as ClientItem[],
    disabled: !props.onReorder,
    handle: enableHandles() ? '.sortable-handle' : undefined,
    getContainerId,

    onAdd(event) {
      const containerId = getContainerId(event.to);
      const oldContainerId = getContainerId(event.from);

      if (oldContainerId !== containerId && props.areaId === containerId) {
        set(listHeight, get(listHeight) + 45);
      }
    },

    onRemove(event) {
      const containerId = getContainerId(event.to);
      const oldContainerId = getContainerId(event.from);

      if (oldContainerId !== containerId && props.areaId === oldContainerId) {
        set(listHeight, get(listHeight) - 45);
      }
    },

    updateOrder: ({ id, newIndex, containerId }) => {
      props.onReorder?.(id, newIndex, containerId);
    },

    onChoose(event) {
      event.item.classList.add('sortable-drag');
      setChosen(event.item.dataset.id ?? '');
    },

    onStart(event) {
      event.item.classList.remove('sortable-drag');
    },

    onUnchoose(event) {
      event.item.classList.remove('sortable-drag');
      setChosen('');
    },
  }));

  interface ItemData {
    item: ClientItem;
    index: Accessor<number>;
  }

  return <ListWrapper ref={initSortable}>
    <For each={props.each}>
      {(item, index) => (
        <li ref={initItem(item.id, index())}
          class="explorer-list-item relative rounded-3 bg-tg_bg [&:not(.sortable-chosen)]:app-transition-transform"
          classList={{
            'cursor-[-webkit-grabbing]!': chosen() === item.id,
            '[&:hover_.sortable-handle]:block [&:hover_[text-handle]]:pr-6': !!props.onReorder && !isMobile(),
            '= [&:not(:first-child)_[data-title]]:(border-t border-t-solid b-tg_bg_secondary)': isLinks(mode) && !props.sparse,
            '= [&:not(:last-child)]:mb-1': !isLinks(mode),
          }}

          onContextMenu={e => e.preventDefault()}
        >
          <Show when={props.onReorder && enableHandles()}>
            <Drag class="absolute sortable-handle ltr:right-10 rtl:right-14 top-2.7 min-w-4 fill-tg_hint cursor-[-webkit-grab]! cursor-ns-resize hidden"
              classList={{ 'cursor-[-webkit-grabbing]!': chosen() === item.id, 'ltr:right-16': item.type === ProjectType.Public }}
            />
          </Show>
          <ListItem item={item} index={index} />
        </li>
      )}
    </For>
  </ListWrapper>;

  function ListWrapper(_props: ParentProps<Partial<ItemData> & Pick<ComponentProps<'ul'>, 'ref'>>) {
    return <ul ref={_props.ref} data-id={`${props.areaId ?? 'root'}-project-list`}
      class="=explorer-list reset-list rounded-3 overflow-hidden"
      classList={{
      'flex flex-col items-stretch [&_li]:bg-tg_bg [&_li_div[data-title]]:border-0': props.sparse,
      '= bg-tg_bg app-transition-max-height': !props.sparse,
      '= [&_li:first-child_div[data-title]]:border-0': !props.sparse && !props.areaId,
      '= mb-2 [&:last-child]:mb-0': !isLinks(mode),
      '= gap-4': props.sparse && isLinks(mode),
      '= gap-2': props.sparse && !isLinks(mode),
      }}
      style={!isArea({ id: props.areaId ?? '' }) ? {} : {
        'max-height': (props.collapsed?.())
          ? '0'
          : `${get(listHeight) + 45}px`,
      }}
    >
      {_props.children}
    </ul>;
  }

  function ListItem(_props: ParentProps<{ item: ClientItem, index: Accessor<number> }>) {
    const resolvedChildren = children(() => props.children?.(_props.item, _props.index));

    return <Item item={_props.item}
      wrapText={props.wrapText}
      mode={props.mode}
      onItemClick={props.onItemClick}
      ref={initItem(_props.item.id, _props.index())}
    >
      {resolvedChildren()}
    </Item>;
  }
}
