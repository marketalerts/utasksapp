import { Show, children, onMount } from 'solid-js';

import type { SplashProps } from 'f/mandatory-popup/ui/splash-root';

import { pageShown } from '../network';

import { t } from 'locales/mandatory-popup';

import ListArrow from 'shared/ui/list-arrow';
import Accordeon from 'shared/ui/accordeon';

import { SubscribePage } from 'f/subscribe/subscribe.ui';

export default function TrialFinish(props: SplashProps) {
  const freeSubdesc = children(() =>
    t('trial end free-subdesc', {}, '\n')
    .split('\n')
    .map(line => <p class="= app-text-subheadline m-0">{line}</p>),
  );

  onMount(() => {
    pageShown();
  });

  return <>
    <SubscribePage hideExtra selectedType={props.value}
      showAltText={{
        button: t('trial end button'),
        title: t('trial end title'),
        subtitle: t('trial end subtitle'),
      }}
      onBuy={(buying) => buying.then(() => (
        sessionStorage.setItem('disable-splash', 'true'),
        props.onMainButtonClick()
      ))}
    >
      {plan => <>
        <p class="= app-text-subheadline m-0 mb-1 mt-2">
          {t('trial end plan-desc', plan.code)}
        </p>
        <Show when={plan.code === 'FREE'}>
          {freeSubdesc()}
          <br />
          <Accordeon class="= min-h-auto!"
            isOpen={false}
            summary={(isOpen) => <>
              <div class="= flex items-center">
                <span role="heading" class="= app-text-footnote font-590">
                  {t('trial end free-title')}
                </span>
                <ListArrow isOpen={isOpen} />
              </div>
            </>}
          >
            {() =>
              <p class="= m-0 app-text-footnote c-tg_hint">
                {t('trial end free-desc')}
              </p>
            }
          </Accordeon>
        </Show>
      </>}
    </SubscribePage>
  </>;
}
