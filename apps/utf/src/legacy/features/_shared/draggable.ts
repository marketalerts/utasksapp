import { get, set } from 'solid-utils/access';
import { createSignal, createEffect } from 'solid-js';
import type { Signal } from 'solid-js';
import { createDraggable } from 'neodrag/packages/solid';
import type { DragOptions } from 'neodrag/packages/solid';


let lastEl: [HTMLElement?, ((value: { x: number; y: number; }) => { x: number; y: number; })?] = [undefined, undefined];

export function useHorisontalDragSnap(options: {
  snapped: Signal<boolean | undefined>;
  disabled: () => boolean;
  minTransform?: number;
  maxTransform?: number;
  snapThresholdMin?: number;
  snapThresholdMax?: number;
  verticalSwipeThreshold?: number;
}) {
  const {
    snapped,
    disabled,
    minTransform = -42,
    maxTransform = 0,
    snapThresholdMin = -30,
    snapThresholdMax = -4,
    verticalSwipeThreshold = 8,
  } = options;

  const { draggable } = createDraggable();

  let prevOffsetX = 0;
  const isDragging = createSignal(false);

  const [position, setPosition] = createSignal({ x: 0, y: 0 });

  const onDrag: DragOptions['onDrag'] = data => {
    if (Math.abs(data.offsetY) >= verticalSwipeThreshold && !get(snapped)) {
      return setPosition({ x: 0, y: 0 });
    }

    if (snapThresholdMin < 0 && snapThresholdMax < 0) {
      if (data.offsetX > snapThresholdMax) {
        return setPosition({ x: maxTransform, y: 0 });
      }

      const transformed = Math.min(Math.max(data.offsetX, minTransform), maxTransform);
      const shouldSnap = Math.abs(prevOffsetX - data.offsetX) <= Math.abs(snapThresholdMin ?? Infinity);

      if (shouldSnap) {
        set(snapped, data.offsetX < snapThresholdMin);
      }

      const x = prevOffsetX = get(snapped)
        ? minTransform
        : transformed;

      setPosition({ x, y: 0 });
    } else {
      if (data.offsetX < snapThresholdMin) {
        return setPosition({ x: minTransform, y: 0 });
      }

      const transformed = Math.max(Math.min(data.offsetX, maxTransform), minTransform);
      const shouldSnap = Math.abs(prevOffsetX - data.offsetX) <= Math.abs(snapThresholdMax ?? Infinity);

      if (shouldSnap) {
        set(snapped, data.offsetX > snapThresholdMax);
      }

      const x = prevOffsetX = get(snapped)
        ? maxTransform
        : transformed;

      setPosition({ x, y: 0 });
    }
  };

  createEffect(() => {
    if (get(snapped) === undefined) {
      setPosition({ x: 0, y: 0 });
    }
  });

  const onDragStart: DragOptions['onDragStart'] = (data) => {
    if (data.currentNode !== lastEl[0] && !get(snapped)) {
      lastEl?.[1]?.({ x: 0, y : 0 });

      lastEl = [data.currentNode, setPosition];
    }

    set(isDragging, true);
  };

  const onDragEnd: DragOptions['onDragEnd'] = (data) => {
    if (snapThresholdMin < 0 ? data.offsetX > snapThresholdMin : (data.offsetX < snapThresholdMax)) {
      setPosition({ x: 0, y: 0 });
    }

    set(isDragging, false);
  };

  return [
    draggable,
    () => ({
      position: position(),
      onDrag,
      onDragEnd,
      onDragStart,
      disabled: disabled(),
      touchAction: 'pan-y',
    } satisfies DragOptions),
    isDragging,
    [position, setPosition],
  ] as const;
}
