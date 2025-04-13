import { createSignal, onCleanup } from 'solid-js';

import { isAndroid, isIOS } from 'shared/platform';

import { today } from 'f/settings/units/date';

import Today from 'icons/list/TodayTextless.svg';

export default function TodayIcon() {
  const getCurrentDate = () => {
    return today().getDate();
  };

  const [date, setDate] = createSignal(getCurrentDate());

  const interval = setInterval(() => {
    setDate(getCurrentDate());
  }, 1000);

  onCleanup(() => clearInterval(interval));

  return <div class="= relative">
    <Today />
    <p class="=date-icon-text
      m-0 text-center flex items-center justify-center
      absolute ltr:left-0 rtl:right-0 ltr:right-0 rtl:left-0 top-[9px] h-[15px]
      sf-rounded text-[10px] line-height-180% c-[#2EC851] font-600"
      classList={{
        '=date-icon-text-ios-fix top-[10px]!': isIOS(),
        '= font-700!': isIOS() || isAndroid(),
      }}
    >
      {date()}
    </p>
  </div>;
}
