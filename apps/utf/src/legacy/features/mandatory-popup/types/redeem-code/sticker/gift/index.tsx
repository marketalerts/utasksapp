import 'https://unpkg.com/@lottiefiles/lottie-player@latest/dist/tgs-player.js';

import type { ComponentProps } from 'solid-js';

import Gift from './Gift.tgs?url';

import StickerPlayer from 'shared/ui/tgs-player';


export default function GiftScreen(props: ComponentProps<'video'>) {
  return <StickerPlayer style="width:100%;height:100%" src={Gift} {...props} />;
}