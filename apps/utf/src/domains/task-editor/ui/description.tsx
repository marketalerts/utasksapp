import { get, set } from 'solid-utils/access';
import { createEffect, createSignal, on } from 'solid-js';
import type { Signal } from 'solid-js';

import { currentTextDirection } from 'shared/l10n';

import { t } from 'locales/task';

import TextArea from 'ui/elements/text-area';
import { waterfall } from 'ui/composables/use-waterfall';
import { useLinkMarker } from 'shared/ui/markers/link';

export default function TaskDescription(props: {
  model: Signal<string>;
}) {
  const textArea = createSignal<HTMLTextAreaElement>();
  const isFocused = createSignal(false);
  const textMark = useLinkMarker({
    dependencies: isFocused[0],
  });

  return <>
    <div
      class="pt-1.5 pb-2 [&[data-appearance]]:animate-init-fade-in-200 overflow-hidden"
    >
      <TextArea model={props.model} ref={el => set(textArea, el)}
        data-id="task-description"
        class="**:app-text-body-l/regular-long-stable max-h-33"
        autofocus
        placeholder={t('task-editor description-placeholder')}
        maxLines={6}
        focused={isFocused}
        more={
          props => <button
            class="absolute app-text-body-m/regular
              ltr:right-0 rtl:left-0 bottom-0 z-10
              c-text-link
              pt-3 ltr:pl-5 rtl:pr-5
              rounded-0
            "
            onClick={props.onClick}
            style={{
              background: currentTextDirection() === 'rtl'
                ? 'radial-gradient(ellipse at bottom left, var(--tg-theme-section-bg-color) 50%, transparent 70%)'
                : 'radial-gradient(ellipse at bottom right, var(--tg-theme-section-bg-color) 50%, transparent 70%)',
            }}
          >
            <span>
              {t('task-editor description-more')}
            </span>
          </button>
        }
      >{text => textMark.mark(text)}</TextArea>
    </div>
  </>;
}