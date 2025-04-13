import { model, useDirectives } from 'solid-utils/model';
import { get } from 'solid-utils/access';
import { For, Show, createSignal } from 'solid-js';
import type { Accessor, JSXElement, Signal, VoidProps, Setter } from 'solid-js';
import { makePersisted } from '@solid-primitives/storage';

import useSortable from 'shared/sortable';
import { isMobile } from 'shared/platform';

import { ProjectType, toProjectHref } from 'f/project/project.adapter';

import { ItemType } from './project.adapter';
import type { ClientList } from './list.adapter';
import { isLinks } from './explorer-mode';
import type { ModeOptions } from './explorer-mode';

import { CloudStorage } from 'shared/ui/telegram';
import ListArrow from 'shared/ui/list-arrow';

import List from './explorer-list.ui';
import { ItemIcon } from './explorer-item.ui';

import Stack from 'icons/Stack.svg';
import Drag from 'icons/Drag.svg';
import AreaIcon from 'icons/30/Areas.svg';

export interface GroupProps<U extends JSXElement> extends ModeOptions {
  each: GroupItem[] | undefined | null;
  onReorderArea?(id: string, newIndex: number): void;
  onReorderProject?(id: string, newIndex: number, areaId?: string): void;

  fallback?: JSXElement;
  children?(item: GroupItem, index: Accessor<number>): U;
}

export interface GroupItem extends ClientList, VoidProps {}

const enableHandles = () => navigator.maxTouchPoints === 0 || !isMobile();

export default function Areas<U extends JSXElement>(props: GroupProps<U>) {
  const [chosen, setChosen] = createSignal('');

  const { initSortable, initItem, draggedIndex } = useSortable(() => ({
    group: 'areas',
    items: props.each ?? [],
    idKey: 'id',
    disabled: !props.onReorderArea,
    handle: enableHandles() ? '.sortable-handle' : undefined,

    updateOrder: ({ id, newIndex }) => props.onReorderArea?.(id, newIndex),

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

  const isDragging = () => draggedIndex() > -1;

  const showSettings = createSignal<string>();

  const items = () => isLinks(props.mode) ? props.each : props.each?.filter(x => x.items.length > 0);

  return (
    <Show when={items()?.length}>
      <ul class="=explorer-lists reset-list flex flex-col" ref={initSortable}
        classList={{
          '=explorer-dragging border-solid border-2 border-tg_button m--1.5 p-1 rounded-3': isDragging(),
          '= mb-2 gap-2': !isLinks(props.mode),
          '= gap-4': isLinks(props.mode),
        }}
        data-id="areas"
      >
        <For each={items()}>
          {(area, index) => (
            <li class="=explorer-list-area w-full rounded-3 [&>ul]:(overflow-hidden rounded-t-0)" ref={initItem(area.id, index())}
              classList={{
                // '[&>ul]:ltr:ml-6 rtl:mr-6': !isLinks(props.mode),
                '= bg-tg_bg [&_[data-title]:first-child]:(border-t border-t-solid b-tg_bg_secondary)': isLinks(props.mode),
                '= cursor-[-webkit-grabbing]!': chosen() === area.id,
                '=explorer-list-with-links [&_ul_li:first-child_[data-title]]:(border-t border-t-solid b-tg_bg_secondary)': isLinks(props.mode),
              }}
            >
              <Area {...props} area={area} chosen={chosen} showSettings={showSettings} />
            </li>
          )}
        </For>
      </ul>
    </Show>
  );
}

function Area<U extends JSXElement>(props: GroupProps<U> & {
  area: GroupItem;
  chosen: () => string;
  showSettings: Signal<string | undefined>;
}) {
  useDirectives(model);

  const [isOpen, setOpen] = makePersisted(createSignal(
    ['true', null, undefined].includes(localStorage.getItem(`utasks-area-${props.area.id}`)),
  ) as [Accessor<boolean>, Setter<boolean>], {
    name: `utasks-area-${props.area.id}`,
    deserialize: ((str: string) => str === 'true'),
    storage: CloudStorage,
  });

  const showSettings = () => get(props.showSettings) === props.area.id;

  return <>
    <div role="button" data-id={`area-${props.area.id}-toggle`}
      class="relative flex items-center w-full rounded-3 overflow-hidden [&:hover_.sortable-handle]:block"
      classList={{ '= bg-tg_bg': isLinks(props.mode) }}
    >
      <div class="=explorer-list-area-toggle relative flex-grow inline-flex items-center cursor-pointer z-2 rounded-3 overflow-hidden"
        onClick={() => setOpen(!isOpen())}
      >
        <div class="ltr:pl-4 rtl:pr-4">
          <Show when={props.area.icon} fallback={<AreaIcon />}>
            <div class="pt-1">
              <ItemIcon id={props.area.id}
                name={props.area.name}
                url={props.area.icon}
                type={ItemType.Dynamic}
                fallback={props.area.name}
              />
            </div>
          </Show>
        </div>

        <p class="=explorer-list-area-name app-text-subheadline-emphasized w-full m-0 flex-grow z-2 ltr:pl-4 rtl:pr-4 p-3 ltr:pr-0 rtl:pl-0 whitespace-nowrap overflow-hidden text-ellipsis"
          data-id={`area-${props.area.id}-name`}
        >
          <Show when={isLinks(props.mode)} fallback={props.area.name}>
            <a href={toProjectHref({ id: props.area.id, name: props.area.name, type: ProjectType.Dynamic })}
              onClick={e => e.stopPropagation()}
              data-id={`area-${props.area.id}-link`}
            >
              {props.area.name}
            </a>
          </Show>
        </p>

        <Show when={isLinks(props.mode) && props.onReorderArea && enableHandles() && !showSettings()}>
          <Drag class="sortable-handle ltr:right-10 rtl:left-10 mt-0.5 min-w-4 fill-tg_hint cursor-[-webkit-grab]! cursor-ns-resize hidden"
            classList={{
              'cursor-[-webkit-grabbing]!': props.chosen() === props.area.id,
              // 'mr-4': showSettings(),
              'mr-2': !showSettings(),
            }}
          />
        </Show>
        <div role="button" class="= ltr:pr-2 rtl:pl-2">
          <ListArrow isOpen={isOpen}/>
        </div>
      </div>
    </div>

    <List each={props.area.items} areaId={props.area.id}
      mode={props.mode}
      onItemClick={props.onItemClick}
      collapsed={() => !isOpen()}
      onReorder={props.onReorderProject}
    />
  </>;
}
