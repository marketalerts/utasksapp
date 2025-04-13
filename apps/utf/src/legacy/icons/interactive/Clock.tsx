import { mergeProps } from 'solid-js';
import type { ComponentProps } from 'solid-js';

import { today } from 'f/settings/units/date';

interface ClockProps extends ComponentProps<'svg'> {
  time: Date | null;
}

export default function Clock(props: ClockProps) {
  props = mergeProps({ width: 24, height: 24, time: today() }, props);

  const time = (date = props.time ?? today()) => [date.getHours(), date.getMinutes()];

  const hourAngle = (hours = time()[0]): number => (
    (hours * 30) - 180
  );

  const minuteAngle = (minutes = time()[1]): number => (
    (minutes * 6) - 180
  );

  return <svg class="= fill-tg_hint stroke-tg_hint" {...props} xmlns="http://www.w3.org/2000/svg">
    <g>
      <rect x="7" y="7" width="18" height="18" rx="5" stroke-width="2"
        style="fill:transparent!important;"
      />
      <rect x="15" y="15" width="2" height="6" rx="1" stroke-linejoin="round" stroke-width="0"
        class="= app-transition-transform-1000"
        style={`transform: rotate(${hourAngle()}deg); transform-origin: 16px 16px`}
      />
      <rect x="15" y="15" width="2" height="6.57452" rx="1" stroke-linejoin="round" stroke-width="0"
        class="= app-transition-transform-1000"
        style={`transform: rotate(${minuteAngle()}deg); transform-origin: 16px 16px`}
      />
    </g>
  </svg>;
}
