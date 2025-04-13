import { createRenderEffect, mergeProps, onCleanup } from 'solid-js';
import { useZoomImageWheel } from '@zoom-image/solid';
import type { ZoomImageWheelState, ZoomImageWheelStateUpdate, ZoomImageWheelOptions  } from '@zoom-image/core';

import { isMobile } from 'shared/platform';

export default function PreviewImage(_props: {
  src?: string;
  alt?: string;
  options?: ZoomImageWheelOptions;
  onAction?: (active: boolean) => void;
}) {
  const { createZoomImage, zoomImageState } = useZoomImageWheel();

  const props = mergeProps({
    options: {
      maxZoom: 4,
      wheelZoomRatio: isMobile() ? 0.1 : 1,
      dblTapAnimationDuration: 200,
      initialState: {
        enable: true,
      },
    } satisfies ZoomImageWheelOptions,
  }, _props);

  createRenderEffect(() => {
    props.onAction?.(zoomImageState.currentZoom !== 1);
  });

  const observer = new MutationObserver((mutationsList) => {
    const [style] = mutationsList;

    (style.target as HTMLDivElement).style.overflow = '';
  });

  onCleanup(() => {
    observer.disconnect();
  });

  return <>
    <div class="= flex items-center justify-center"
      ref={el => {
        observer.observe(el, { attributes: true, attributeOldValue: true, attributeFilter: ['style'] });
        createZoomImage(el, props.options);
      }}
    >
      <img alt={props.alt}
        class="= w-full h-full"
        src={props.src}
      />
    </div>
  </>;
}

declare module '@zoom-image/solid' {
  export function useZoomImageWheel(): {
    // Fix for broken library types
    createZoomImage: (container: HTMLElement, options?: ZoomImageWheelOptions | undefined) => void;
    zoomImageState: ZoomImageWheelState;
    setZoomImageState: (state: ZoomImageWheelStateUpdate) => void;
  };
}
