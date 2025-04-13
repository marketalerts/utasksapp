import { Show } from 'solid-js';
import type { JSX } from 'solid-js';

import { waterfall } from 'ui/composables/use-waterfall';

import CheckboxOutlined from 'icons/24/Checkbox Outlined.svg';
import CalendarAdd from 'icons/24/Calendar Add Outlined.svg';

export default function ControlBar(
  props: {
    checkbox?: JSX.Element;
    dates?: JSX.Element;
    calendarLink?: JSX.Element;
  },
) {

  return <div class="relative flex items-center w-full py-1 px-2.5" >
    <Show when={!props.checkbox} fallback={props.checkbox}>
      <button class="p-1.5 h-9 w-9 flex">
        <CheckboxOutlined class="ui-icon-tertiary" />
      </button>
    </Show>

    {props.dates}

    <Show when={!props.calendarLink} fallback={props.calendarLink}>
      <button class="p-1.5 h-9 w-9 flex">
        <CalendarAdd class="ui-icon-tertiary" />
      </button>
    </Show>
  </div>;
}