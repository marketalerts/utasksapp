import { get, set } from 'solid-utils/access';
import { createSignal } from 'solid-js';
import { createDraggable } from 'neodrag/packages/solid';
import type { DragOptions } from 'neodrag/packages/solid';

import { isMobile } from 'shared/platform';


function getProgress(offsetY: number) {
  return 2 * (offsetY) / (window.innerHeight / 2);
}

export function useSwipeToClose(options: {
  setSideEffects?: (state: { enable: boolean }) => void;
  onClose: (progress: number) => void;
  disabled: () => boolean;
}) {
  const { draggable } = createDraggable();

  const snap = createSignal(false);
  const forcePosition = createSignal(false);

  const dragOptions = {
    axis: isMobile() ? 'y' : 'none',
    ignoreMultitouch: true,
    recomputeBounds: {
      dragStart: true,
      dragEnd: true,
    },

    onDragStart() {
      options.setSideEffects?.({ enable: false });
    },
    onDrag(data) {
      const progress = getProgress(data.offsetY);
      options.onClose(Math.abs(progress) >= 1 ? 0.9999999 : Math.abs(progress));
    },
    onDragEnd(data) {
      options.setSideEffects?.({ enable: true });

      const progress = getProgress(data.offsetY);

      if (Math.abs(progress) >= 1) {
        options.onClose(1);
      } else {
        set(snap, true);
        setTimeout(() => {
          set(forcePosition, true);
        });
        setTimeout(() => {
          set(forcePosition, set(snap, false));
        }, 201);

        options.onClose(0);
      }
    },
  } satisfies DragOptions;

  const dragComputed = () => ({
    ...dragOptions,
    ...(get(forcePosition) ? {
      position: { y: 0, x: 0 },
      disabled: options.disabled?.() ?? true,
      bounds: { top: 0, left: 0, right: 0, bottom: 0 },
    } : {
      position: { x: 0, y: 0 },
      disabled: options.disabled?.() ?? false,
      bounds: undefined,
    }),
  } satisfies DragOptions);

  return { classes: () => ({ 'app-transition-transform': get(snap) }), dragComputed, draggable };
}
