import { createMemo, Show } from 'solid-js';
import type { JSX } from 'solid-js';

import { getAttrs } from './adapter';
import type { DisplayableFile } from './adapter';

export function NameWithExt(props: { file?: DisplayableFile; fallback?: JSX.Element; }) {
  const attrs = createMemo(() => getAttrs(props.file));

  return <Show when={attrs()} fallback={props.fallback}>
    {attrs => <>
      <span class="=file-name text-ellipsis whitespace-nowrap overflow-hidden">{attrs().name}</span>
      <Show when={attrs().ext}>
        <span class="file-ext">.{attrs().ext}</span>
      </Show>
    </>}
  </Show>;
}