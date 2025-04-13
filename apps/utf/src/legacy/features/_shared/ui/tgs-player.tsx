import 'https://unpkg.com/@lottiefiles/lottie-player@latest/dist/tgs-player.js';

import { mergeProps } from 'solid-js';
import type { ComponentProps } from 'solid-js';

declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      'tgs-player': import('solid-js').ComponentProps<'video'> & {
        mode?: string;
        speed?: string;
      };
    }
  }

}

export default function StickerPlayer(props: ComponentProps<'tgs-player'>) {
  props = mergeProps({
    autoplay: true,
    loop: true,
  }, props);

  return <>
    <tgs-player class="= w-full h-full sticker-player"
      {...props} mode="normal"
    />
  </>;
}