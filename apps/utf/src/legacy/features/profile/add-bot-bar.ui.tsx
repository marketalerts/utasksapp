import WebApp from 'tma-dev-sdk';
import { Show, Suspense, createEffect, createResource, createSignal, useContext } from 'solid-js';
import type { ComponentProps } from 'solid-js';

import { getConfigString } from 'shared/firebase';

import { ProfileContext } from './profile.context';

import { t } from 'locales/create-button';

import Warning from 'i/Warning.svg';

export default function AddBotBar(props: ComponentProps<'div'>) {
  const [profile] = useContext(ProfileContext);
  const [data] = createResource(
    () => profile.latest?.isStarted ?? false,
    (isStarted) => Promise.all([
      isStarted,
      getConfigString('boturl').then(link => `${link || 'https://t.me/UTasksBot'}?start=start`),
    ],
  ).then(([isUserInitialized, botLink]) => ({ isUserInitialized, botLink })));

  const [isLightMode, setLightMode] = createSignal(true);

  createEffect(() => {
    setLightMode(WebApp.colorScheme === 'light');
  });

  return <Suspense>
    <Show when={!data.latest?.isUserInitialized && data.latest?.botLink}>
      <div {...props} class={`relative overflow-hidden rounded-4 ${props.class}`}>
        <div class="= absolute w-full h-full ltr:left-0 rtl:right-0 top-0 ltr:right-0 rtl:left-0 botton-0 bg-tg_bg opacity-70 z-1"
          classList={{ 'filter-invert': isLightMode() }}
        ></div>
        <div class="= relative flex w-full h-full gap-3 items-center p-2 px-3 z-2"
          classList={{ 'filter-invert': isLightMode() }}
        >
          <Warning class="= min-w-7 mix-blend-difference" />
          <div class="= flex flex-col">
            <span class="= app-text-title c-tg_text">{t('user add-bot title')}</span>
            <span class="= app-text-subtitle c-tg_text opacity-70">{t('user add-bot description')}</span>
          </div>
          <button class="= bg-transparent c-tg_button text-nowrap"
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            onClick={() => WebApp.openTelegramLink(data.latest!.botLink)}
            classList={{ 'filter-invert': isLightMode() }}
          >
            {t('user add-bot action')}
          </button>
        </div>
      </div>
    </Show>
  </Suspense>;
}
