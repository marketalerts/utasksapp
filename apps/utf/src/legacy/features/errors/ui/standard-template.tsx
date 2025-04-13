import WebApp from 'tma-dev-sdk';
import { For, Show, createSignal  } from 'solid-js';
import type { JSX } from 'solid-js';

import { t } from 'locales/errors';

import { getCssVariable } from 'shared/ui/telegram';

type ColorScheme = 'light' | 'dark';

export default function StandardErrorTemplate(
  props: {
    title: string | JSX.Element;
    subtitle: string | JSX.Element;
    img?: (colorScheme: ColorScheme) => Exclude<JSX.Element, number | boolean> | string;
    actions: JSX.Element[];
    error?: any;
  },
) {
  const textCopied = createSignal(false);

  console.error(props.error);

  const ErrorAsText = () => {
    try {
      return JSON.stringify(props.error);
    } catch (error) {
      return String(props.error);
    }
  };

  return <div class="=error-card flex flex-col gap-2 items-center justify-between p-7 pb-20">
    <ErrorImg />

    <p class="=error-title app-text-body-emphasized m-0 text-center">{props.title}</p>
    <p class="=error-subtitle app-text-footnote m-0 text-center">{props.subtitle}</p>

    <For each={props.actions}>
      {action => action}
    </For>

    <Show when={props.error}>
      <div class="= relative flex items-end justify-between w-full app-text-subheadline gap-4">
        <p>{t('standard-error stack-title')}</p>
        <button class="=copy-stack-trace absolute bottom--14 right-2 rounded-3 app-text-footnote whitespace-nowrap p-2 bg-tg_button"
          onClick={() => {
            navigator.clipboard.writeText(
              `Telegram ${WebApp.version}-${WebApp.platform};\n${navigator.userAgent}\n${props.error?.message}\n${props.error?.stack}`,
            ).then(() => textCopied[1](true));
          }}
        >
          <Show when={textCopied[0]()} fallback={t('standard-error stack-copy')}>
            {t('standard-error stack-copy-done')}
          </Show>
        </button>
      </div>
      <div class="=error-details b-solid b-1 b-tg_link rounded-3 p-4 pt-6 mt-2 bg-tg_bg max-w-full">
        <p class="=tg-version app-text-footnote c-tg_hint">
          Telegram {WebApp.platform}-{WebApp.version}
        </p>
        <p class="=user-agent app-text-footnote c-tg_hint m-revert!">
          {navigator.userAgent}
        </p>
        <Show when={props.error?.message && props.error?.stack}
          fallback={<ErrorAsText />}
        >
          <p class="=error-message font-700 m-revert!">
            {props.error.message}
          </p>
          <p class="=error-stack-trace app-text-footnote m-revert!">
            {props.error.stack}
          </p>
        </Show>
      </div>
    </Show>
  </div>;
}

export function ErrorImg(props: {
  img?: (colorScheme: ColorScheme) => Exclude<JSX.Element, number | boolean> | string;
}) {
  const colorScheme = () => getCssVariable('--tg-color-scheme', 'color-scheme') as ColorScheme;

  const _img = props.img?.(colorScheme());

  if (typeof _img === 'string' || !_img) {
    return <img src={`${import.meta.env.BASE_URL}${import.meta.env.APP_BASE}${_img ?? `error-standard-${colorScheme()}.png`}`}
      alt="locked"
      class="=error-img w-64 h-64 max-w-64 max-h-64"
    />;
  }

  return _img;
}