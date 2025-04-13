import type { ZoomImageWheelState, ZoomImageWheelStateUpdate, ZoomImageWheelOptions  } from '@zoom-image/core';

export default function PreviewAudio(props: {
  src?: string;
  alt?: string;
  onAction?: (active: boolean) => void;
}) {

  return <>
    <audio controls
      class="= w-full h-full p-10 min-h-30 outline-none"
      src={props.src}
    />
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
