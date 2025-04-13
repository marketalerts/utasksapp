import { createMemo, createRenderEffect, ErrorBoundary, lazy, Show, useContext } from 'solid-js';
import confetti from 'canvas-confetti';

import Benefits, { createBenefitGenerator } from 'f/subscribe/benefits';
import { ProfileContext } from 'f/profile/profile.context';
import type { SplashProps } from 'f/mandatory-popup/ui/splash-root';

import { SplashContext } from '../context';
import { CodeActivationType, CodeType } from '../adapter';

import { t } from 'locales/mandatory-popup';

import { MainButton, getCssColorVariable } from 'shared/ui/telegram';

const BananaSticker = lazy(() => import('../sticker/banana'));
const GiftSticker = lazy(() => import('../sticker/gift'));

export default function GiftCertificate(props: SplashProps) {
  const bgColor = getCssColorVariable('--tg-theme-bg-color', '--default-tg-theme-bg-color');

  const getBenefits = createBenefitGenerator(
    key => {
      const text = t('pro benefits', { key, fallback: '' });
      // TODO: fix intl-schematic
      return text === 'pro benefits' ? undefined : text;
    },
    key => t('pro benefits links', { key, fallback: '' }),
  );

  const [redeem] = useContext(SplashContext) ?? [];
  const [profile] = useContext(ProfileContext);

  createRenderEffect(() => {
    try {
      if (redeem?.latest && !redeem.latest.activated/* redeem?.latest?.type === CodeType.Birthday */) {
        fireConfetti();

        setTimeout(fireConfetti, 750);
      } else if (redeem?.latest?.activated && profile.latest.isPro) {
        const scalar = 3;
        const banana = confetti.shapeFromText({ text: '🍌', scalar });

        fireConfetti([banana], { scalar, gravity: 0.5 });
      }
    } catch (error) {
      console.error('Your device no support confetti 🥺');
      console.error(error);
    }
  });

  const type = createMemo(() => redeem?.latest?.type ?? CodeType.Generic);
  const activationType = createMemo(() => redeem?.latest?.activationType ?? CodeActivationType.Redeem);

  return <div class="= px-4">
    <div class="= relative flex flex-col items-center gap-4 text-center min-w-full min-h-full z-2">
      <img src={`${import.meta.env.BASE_URL}${import.meta.env.APP_BASE}3DLogo.webp`} class="= mb-4 mt-10 h-[25vh] max-h-[200px]" />

      <Show when={redeem?.latest && !redeem.latest?.activated}
        fallback={<>
          <h1 class="= m-0 app-text-page-title-extra c-tg_button_text">
            {t(`gift activated title`)}
          </h1>
          <p class="= m-0 app-text-subheadline c-tg_button_text">
            <span class="= font-bold">
              {t(`gift activated subtitle`)}
            </span>
            {t('gift activated subtitle-2')}
          </p>

          <Show when={profile.latest.isPro}
            fallback={
              <p class="= m-0 app-text-subheadline c-tg_button_text">
                {t('gift activated benefits')}
              </p>
            }
          >
            <ErrorBoundary fallback={
              <p class="= m-0 app-text-subheadline c-tg_button_text">
                {t('gift activated benefits')}
              </p>
            }>
              <div>
                <p class="= m-0 app-text-subheadline c-tg_button_text">
                  {t('gift activated already-pro')} <span class="= lowercase m-0 app-text-subheadline c-tg_button_text">
                    {t('gift activated complementary')}
                  </span>
                </p>
              </div>

              <BananaSticker class="= max-w-50%" />
            </ErrorBoundary>
            <br />
          </Show>
        </>}
      >
        <h1 class="= m-0 app-text-page-title-extra c-tg_button_text">
          {t(`gift ${type()} title`)}
        </h1>
        {/* Denis Gerasimenko подарил(а) вам подписку UTasks Pro на 1 год. */}
        {/* После активации вам будут доступны все эксклюзивные функции: */}
        <div>
          <p class="= m-0 app-text-subheadline c-tg_button_text">
            <span class="= font-bold">
              {redeem?.latest?.author?.title ?? t('gift generic subtitle-author')}
            </span> <span>
              {t(`gift ${activationType()} subtitle-bulk`)}
            </span>
          </p>
          <p class="= font-bold m-0 c-tg_button_text">
            {t('gift generic subtitle-code', redeem?.latest?.priceCode ?? 'Y')}
          </p>
          <Show when={type() === CodeType.Birthday && !redeem?.latest?.activated}>
            <GiftSticker class="= ml--6 scale-60 my--12" />
          </Show>
          <br />
          <p class="= m-0 app-text-subheadline c-tg_button_text">
            {t(`gift ${activationType()} subtitle-2`)}
          </p>
        </div>
      </Show>

      <Benefits class="= ltr:text-left rtl:text-right mb-10"
        getBenefits={getBenefits}
      />
    </div>

    <div class="= fixed top-0 left-0 bottom-0 right-0 h-100vh pro-graddient-bg rounded-t-6 px-4" />

    <div class="= fixed top-60% left-0 bottom-0 right-0 z-1"
      style={`background: linear-gradient(rgba(0,0,0,0),${bgColor.toHexString()})`}
    />

    <MainButton onClick={props.onMainButtonClick}
      showProgress={props.isLoading}
      disabled={props.isLoading}
      text={t(`gift ${activationType()} ${redeem?.latest?.activated ? 'activated' : type()} button`)}
    />
  </div>;
}

function fireConfetti(shapes: confetti.Shape[] = ['circle', 'square', 'star', 'star'], overrides?: Partial<confetti.Options>) {
  confetti({
    shapes,
    drift: 1,
    origin: { x: 0 },
    angle: 60,
    ...overrides,
  });

  confetti({
    shapes,
    drift: -1,
    origin: { x: 1 },
    angle: 120,
    ticks: 300,
    ...overrides,
  });

  confetti({
    shapes,
    drift: 0,
    origin: { y: 1 },
    ...overrides,
  });
}
