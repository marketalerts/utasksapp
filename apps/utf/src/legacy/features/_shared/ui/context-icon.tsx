import type { JSX } from 'solid-js';

import { isIOS } from 'shared/platform';

export function ContextIcon(props: {
  class?: string
  text: string;
  children: JSX.Element;
}) {
  return <div class="=context-icon w-full flex items-center p-0 gap-3"
    classList={{
      '= flex-row-reverse justify-between ltr:text-left rtl:text-right': isIOS(),
      '= whitespace-nowrap': !isIOS(),
      [props.class ?? '']: !!props.class,
    }}
  >
    {props.children}
    {props.text}
  </div>;
}
