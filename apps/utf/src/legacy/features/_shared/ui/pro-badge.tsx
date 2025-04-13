import { Show } from 'solid-js';
import type { JSX } from 'solid-js';

import { IconFix } from 'ui/elements/icon';

import Pro from 'icons/16/Pro MultiColor.svg';

export default function ProBadge(props: {
  when?: boolean;
  class?: string;
  fallback?: JSX.Element;
  noText?: boolean;
}) {
  return <Show when={props.when !== false}
    fallback={props.fallback ?? <>{/* The fragment is here to not let solid break the render when this component is the only child */}</>}
  >
    <span class="app-text-footnote! max-h-4 c-tg_hint inline-flex items-center gap-1 overflow-hidden flex-wrap justify-end"
      classList={{ [String(props.class)]: !!props.class }}
    >
      <IconFix>
        <Pro class="h-4 min-w-4 w-4" />
      </IconFix>
      <Show when={!props.noText}>
        <span class="ellipsis app-text-footnote!">
          Pro
        </span>
      </Show>
    </span>
  </Show>;
}