import { Show } from 'solid-js';

import { detectRepeats } from 'shared/l10n/cron';
import type { RepetitionType } from 'shared/l10n/cron';

import RepeatSM from 'icons/RepeatSM.svg';

export default function ShortRepeat(props: {
  cron?: string;
  iconClass?: Record<string, boolean | undefined>;
  textClass?: Record<string, boolean | undefined>;
  text: (rt: RepetitionType | undefined) => string;
  small?: boolean;
}) {

  return <>
    <Show when={props.cron}>
      <div class="inline-flex items-end">
        <RepeatSM class="ui-icon-accented"
          classList={{ ...props.iconClass }}
        />
        <span class="app-text-body-m/medium c-text-accented ws-nowrap"
          classList={{
            ...(props.textClass ?? props.iconClass),
            'app-text-body-s/regular!': props.small,
          }}
        >
          {props.text(detectRepeats(props.cron))}
        </span>
      </div>
    </Show>
  </>;
}