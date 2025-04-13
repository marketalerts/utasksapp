import type { ZoomImageWheelState, ZoomImageWheelStateUpdate, ZoomImageWheelOptions  } from '@zoom-image/core';

export default function PreviewVideo(props: {
  loop?: boolean;
  controls?: boolean;
  autoplay?: boolean;
  src?: string;
  alt?: string;
  onAction?: (active: boolean) => void;
}) {

  return <>
    <div class="= flex items-center justify-center">
      <video controls={props.controls !== false} loop={props.loop} autoplay={props.autoplay}
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
