import type { ComponentProps } from 'solid-js';

import Up from 'icons/ArrowUpOutlined.svg';

export function DownloadIcon(props: ComponentProps<'div'> & {
  white?: boolean
}) {
  return <div {...props} class="=download-icon relative flex flex-col items-center justify-center p-2"
    classList={{
      [String(props.class)]: !!props.class,
      ...props.classList,
    }}
  >
    <Up class="= fill-tg_button rotate-180" classList={{ 'fill-tg_text!': props.white }} />
    <div class="= w-3 h-0.5 absolute bottom-2.5 bg-tg_button rounded-full" classList={{ 'bg-tg_text!': props.white }} />
  </div>;
}
