import WebApp from 'tma-dev-sdk';
import SortableList from 'sortablejs';
import { createEffect, createSignal, onCleanup } from 'solid-js';
import type { Setter } from 'solid-js';

export interface SortableProps<T extends object> extends SortableList.Options {
  id?: string;
  class?: string;
  idKey: keyof T;
  items: T[];
  getContainerId?(listElement: HTMLElement): string | undefined;
  updateOrder?: (info: { id: string, oldIndex: number, newIndex: number, containerId?: string, oldContainerId?: string }) => void;
  updateItems?: Setter<T[]>;
}

export default function useSortable<T extends object>(_props: () => SortableProps<T>) {
  const [draggedIndex, setDragged] = createSignal(-1);

  const initSortable = (el: HTMLElement) => {
    createEffect(() => {
      const props = _props();

      const sortable = new SortableList(el, {
        direction: 'vertical',
        animation: 200,
        delay: 200,
        delayOnTouchOnly: true,
        swapThreshold: 0.75,
        fallbackTolerance: 2,
        fallbackOffset: {
          x: 0,
          y: (parseInt(String(window.devicePixelRatio), 10) * 8) || 24,
        },

        ...props,

        onStart(event) {
          setDragged(Number(event.item.dataset.index));
          props.onStart?.(event);
        },

        onChoose(event) {
          WebApp.HapticFeedback.impactOccurred('soft');
          props.onChoose?.(event);
        },

        onMove(evt, originalEvent) {
          WebApp.HapticFeedback.selectionChanged();
          props.onMove?.(evt, originalEvent);
        },

        onEnd(event) {
          const { newIndex, oldIndex } = event;
          const id = event.item.dataset.id;
          const containerId = props.getContainerId?.(event.to);
          const oldContainerId = props.getContainerId?.(event.from);

          setDragged(-1);

          if (id && typeof newIndex === 'number' && typeof oldIndex === 'number') {
            props.updateOrder?.({ id, newIndex, oldIndex, containerId, oldContainerId });

            props.updateItems?.(props.items.slice().sort((a, b) => {
              if (a[props.idKey] === id) {
                return newIndex - props.items.indexOf(b) - 1;
              }

              if (b[props.idKey] === id) {
                return props.items.indexOf(a) - newIndex - 1;
              }

              return 0;
            }));
          }

          WebApp.HapticFeedback.impactOccurred('soft');
          props.onEnd?.(event);
        },
      });

      onCleanup(() => sortable.destroy());
    });
  };

  return {
    initSortable,
    draggedIndex,
    initItem: (itemId: string, index: number) => (el: HTMLElement) => {
      el.setAttribute('data-id', itemId);
      el.setAttribute('data-index', String(index));
    },
  };
}
