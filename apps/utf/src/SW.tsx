import { useRegisterSW } from 'virtual:pwa-register/solid';
import { get } from 'solid-utils/access';
import { Show, createEffect, createSignal, on } from 'solid-js';

import { t } from 'locales/home';

import Plus from 'i/Plus.svg';

export default function SW() {
  const intervalMS = 60 * 60 * 1000;

  const { updateServiceWorker, needRefresh } = useRegisterSW({
    immediate: true,
    onRegistered(r) {
      r && setInterval(() => {
        r.update();
      }, intervalMS);
    },
  });

  const [showOverride, setOverride] = createSignal(false);

  createEffect(() => setOverride(get(needRefresh)));

  const showDelay = 1000;
  const [lateShown, setLateShown] = createSignal(true);

  createEffect(on(showOverride, () => {
    if (!showOverride()) {
      setTimeout(() => setLateShown(false), showDelay);
    }
  }, { defer: true }));

  const [isUpdating, setUpdating] = createSignal(false);

  return <>
    <Show when={false/*lateShown()*/}>
      <div class="
          fixed flex justify-between items-center bottom--20 left-4 right-4
          bg-tg_bg rounded-3 py-2 p-3
          z-110 app-transition-bottom shadow-xl shadow-black
        "
        classList={{ 'bottom-5': showOverride() && get(needRefresh) }}
      >
        <div class="= flex items-center gap-2">
          <Plus class="= fill-tg_hint rotate--45 app-transition-transform w-4 h-4 cursor-pointer"
            role="button"
            onClick={() => setOverride(false)}
          />
          <span>{isUpdating() ? t('update title-loading') : t('update title')}</span>
        </div>

        <Show when={!isUpdating()}>
          <button class="= bg-transparent! c-tg_button"
            onClick={() => updateServiceWorker(setUpdating(true))}
          >{t('update button')}</button>
        </Show>
      </div>
    </Show>
  </>;
}
