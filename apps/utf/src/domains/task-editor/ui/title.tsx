import type { Signal } from 'solid-js';

import { t } from 'locales/task';

import TextArea from 'ui/elements/text-area';
import { waterfall } from 'ui/composables/use-waterfall';


export default function TaskTitle(props: {
  model: Signal<string>;
}) {
  return <>
    <div
      class="px-4 pt-3 pb-2"
    >
      <TextArea model={props.model}
        data-id="task-title"
        class="**:app-text-title-s/medium-stable"
        autofocus
        placeholder={t('task-editor title-placeholder')}
      />
    </div>
  </>;
}