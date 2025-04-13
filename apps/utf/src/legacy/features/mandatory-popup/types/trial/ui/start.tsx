import { createConfigResource } from 'shared/firebase';

import type { SplashProps } from 'f/mandatory-popup/ui/splash-root';

import { t } from 'locales/mandatory-popup';

import { MainButton, getCssColorVariable } from 'shared/ui/telegram';

export default function TrialStart(props: SplashProps) {
  const bgColor = getCssColorVariable('--tg-theme-bg-color', '--default-tg-theme-bg-color');
  const [trialConfigDays] = createConfigResource('trial_days', 5);

  return <div class="= absolute top-0 left-0 bottom-0 right-0 h-100vh pro-graddient-bg rounded-t-6 px-4">
    <div class="= relative flex flex-col items-center gap-4 text-center w-full h-full z-2">
      <img src={`${import.meta.env.BASE_URL}${import.meta.env.APP_BASE}3DLogo.webp`} class="= mb-4 mt-10 h-[25vh] max-h-[200px]" />
      <h1 class="= m-0 bg-tg_bg rounded-2 uppercase px-2 py-1 app-text-footnote font-590!">Pro Trial</h1>
      <p class="= m-0 app-text-page-title-extra c-tg_button_text">
        {t('trial start title').replace('5', String(trialConfigDays.latest))}
      </p>
      <p class="= m-0 app-text-subheadline c-tg_button_text">
        {t('trial start subtitle')}
      </p>
    </div>

    <div class="= absolute top-60% left-0 bottom-0 right-0 z-1"
      style={`background: linear-gradient(rgba(0,0,0,0),${bgColor.toHexString()})`}
    />

    <MainButton onClick={props.onMainButtonClick}
      showProgress={props.isLoading}
      disabled={props.isLoading}
      text={t('trial start button')}
    />
  </div>;
}
