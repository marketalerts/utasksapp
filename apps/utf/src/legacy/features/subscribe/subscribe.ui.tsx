import WebApp from 'tma-dev-sdk';
import { model, useDirectives } from 'solid-utils/model';
import { createHistorySignal } from 'solid-utils/history';
import { get, set } from 'solid-utils/access';
import { Dynamic } from 'solid-js/web';
import { For, Match, Show, Suspense, Switch, createContext, createEffect, createMemo, createRenderEffect, createResource, createSelector, createSignal, on, onCleanup, onMount, useContext } from 'solid-js';
import type { JSX, Setter, Signal } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';

import { isIOS, isMobile, setFrameColor } from 'shared/platform';
import { createConfigResource } from 'shared/firebase';

import { ProfileContext } from 'f/profile/profile.context';

import { applyPromocode, fetchInvoice, fetchPlans, unsubscribe } from './plans.network';
import { FreePlan, PaymentOptions  } from './plans.adapter';
import type { PlanKind } from './plans.adapter';
import type { Plan } from './plans.adapter';
import Benefits, { createBenefitGenerator } from './benefits';

import { t } from 'locales/subscribe';

import { MainButton, getCssColorVariable } from 'shared/ui/telegram';
import List from 'shared/ui/list';
import Checkbox, { CheckboxStyle } from 'shared/ui/checkbox';

import Star from 'icons/list/Pro.svg';
import Plus from 'icons/PlusOutlined.svg';
import Minus from 'icons/MinusOutlined.svg';
import Checkmark from 'icons/Checkmark.svg';
import Check from 'i/IconCheck.svg';
import IconAlertCircle from 'i/IconAlertCircle.svg';
import ArrowCircleRight from 'i/ArrowCircleRight.svg';

interface PlanModel {
  code: string;
  kind: string;
  price: number;
  currency?: string;
  decimals?: number;
}

let handle: number;

const QuantityContext = createContext<() => number>();

export function SubscribePage(props: {
  hideExtra?: boolean;
  showAltText?: {
    title: string;
    subtitle: string;
    button: string;
  };
  onBuy?: (invoiceRequest: Promise<unknown>) => void;
  children?: (p: Plan) => JSX.Element;
  selectedType?: Signal<string>;
}) {
  useDirectives(model);

  const navigate = useNavigate();

  const [user, { refetch: refetchUser, mutate: mutateUser }] = useContext(ProfileContext);

  onMount(() => {
    if (!props.hideExtra) {
      refetchUser();
    }

    //setFrameColor('secondary_bg_color');
  });

  const formDisabled = createSignal(false);
  const params = useParams();
  const paymentProviderApproved = createSignal(params.result === 'success');

  createEffect(on(() => params.result, (result) => {
    if (result === 'success') {
      set(paymentProviderApproved, true);
    }
  }));

  createEffect(on(() => get(formDisabled), () => {
    if (get(formDisabled)) {
      WebApp.MainButton.showProgress();
    } else {
      WebApp.MainButton.hideProgress();
    }
  }, { defer: true }));

  const paymentOptions = ['XTR' as PaymentOptions];

  const getPaymentOptions = () => paymentOptions.slice().sort(a => a === get(selectedPaymentOption) ? -1 : 0);

  const selectedPaymentOption = createHistorySignal(PaymentOptions.XTR);

  const shouldBeRedeemable = createSignal(false);
  const amountToBuy = createSignal(1);

  function setBuyAmount(newAmount: number) {
    if (newAmount <= 0) {
      newAmount = 1;
    }

    if (newAmount >= 200) {
      newAmount = 200;
    }

    set(amountToBuy, newAmount);

    if (newAmount > 1) {
      set(shouldBeRedeemable, true);
    }
  }

  const decrementAmount = () => setBuyAmount(get(amountToBuy) - 1);
  const incrementAmount = () => setBuyAmount(get(amountToBuy) + 1);

  function setRedeemable(redeemable: boolean) {
    set(shouldBeRedeemable, get(amountToBuy) > 1 || redeemable);
  }

  let intervalPtr: number | undefined = undefined;

  const delayedQuantity = createSignal(1);

  const [plans, { refetch: refetchPlans }] = createResource(
    () => [get(selectedPaymentOption), get(shouldBeRedeemable), get(amountToBuy)] as const,
    ([payment, redemable, amount]) => isIntervalTickActive()
      ? []
      : fetchPlans(payment, redemable, amount).then(r => (set(delayedQuantity, amount), r.data ?? [])),
    { initialValue: [] },
  );

  const getPlans = createMemo(() => (
    props.showAltText
      ? plans.latest.concat([FreePlan])
      : plans.latest
  ));

  const buttonColor = getCssColorVariable(
    '--tg-theme-button-color',
    '--default-tg-theme-button-color',
  );
  const hintColor = getCssColorVariable(
    '--tg-theme-hint-color',
    '--default-tg-theme-hint-color',
  );

  const colorSpin = 83 / 2;
  const accentColor = buttonColor.spin(colorSpin);

  const [alpha, setAlpha] = createSignal(0);

  const computeFinalColor = () => {
    return buttonColor.mix(accentColor, alpha() > 0 ? alpha() : -alpha());
  };

  const [finalColor, setFinalColor] = createSignal(computeFinalColor());

  let opacityAlpha = 0;

  onMount(() => {
    clearInterval(handle);

    handle = window.setInterval(() => {
      setAlpha((opacityAlpha > 100 ? opacityAlpha = -100 : opacityAlpha++));

      if (get(agreedToTerms) && !get(formDisabled)) {
        WebApp.MainButton.setParams({ color: setFinalColor(computeFinalColor()).toHexString() });
      }
    }, 33);
  });

  onCleanup(() => {
    // clearInterval(handle);
    WebApp.MainButton.setParams({ color: buttonColor.toHexString() });
  });

  const hueRotation = createMemo(() => finalColor().toHsl().h - buttonColor.toHsl().h, 0);

  const selectedPlan = createSignal<PlanModel>({
    code: '',
    kind: '',
    price: 0,
    currency: 'XTR',
  }, {
    equals(prev, next) {
      return next.code === prev.code && next.kind === prev.kind && next.price === prev.price;
    },
  });

  createEffect(on(() => plans.loading, (loading) => {
    if (loading) return;

    const defaultPlan = getPlans()?.find(p => p.default);
    const defaultKind = defaultPlan?.kinds.find(k => k.default);

    if (defaultPlan && defaultKind && get(selectedPlan).code === '' && defaultKind.enabled) {
      set(selectedPlan, toPlanModel(defaultPlan, defaultKind));
    } else {
      const selectedPlanItem = getPlans().find(p => p.code === get(selectedPlan).code);
      const selectedKind = selectedPlanItem?.kinds.find(p => p.enabled && p.code === get(selectedPlan).kind)
        ?? selectedPlanItem?.kinds.find(p => p.enabled);

      // Reapply selection to update currency info
      if (selectedPlanItem && selectedKind && selectedKind.enabled) {
        set(selectedPlan, toPlanModel(selectedPlanItem, selectedKind));
      }
    }

    const { kind, price, currency, decimals } = get(selectedPlan);

    WebApp.MainButton.setText(isFreeSelected() && props.showAltText ? props.showAltText.button : ReplaceXTR(
      t(
        kind === 'S' ? 'subscribe-trial' : isPaidUser() && !get(shouldBeRedeemable) ? 'resubscribe' : 'subscribe',
        // @ts-expect-error wrong lib typing
        { 'plan price': [price, { currency, maximumFractionDigits: decimals }], 'plan code-short': [kind] },
      ),
      '⭐',
    ));
  }));

  createEffect(() => {
    WebApp.MainButton.setText(isFreeSelected() && props.showAltText ? props.showAltText.button : ReplaceXTR(
      t(
        get(selectedPlan).kind === 'S' ? 'subscribe-trial' : isPaidUser() && !get(shouldBeRedeemable) ? 'resubscribe' : 'subscribe',
        // @ts-expect-error wrong lib typing
        { 'plan price': [get(selectedPlan).price, { currency: get(selectedPlan).currency, maximumFractionDigits: get(selectedPlan).decimals }], 'plan code-short': [get(selectedPlan).kind] },
      ),
      '⭐',
    ));
  });

  const openSubscriptionForm = (invoiceUrl: string) => {
    try {
      if (WebApp.platform === 'unknown') {
        WebApp.openTelegramLink(invoiceUrl);
        return;
      }

      WebApp.openInvoice(invoiceUrl, async (status) => {
        WebApp.MainButton.hideProgress();

        await refetchUser();

        if (status !== 'failed' && status !== 'cancelled') {
          try {
            mutateUser(old => {
              old.role = 'PRO';
              old.isFree = false;
              old.isPro = true;

              return old;
            });
          } catch (error) {
            console.error(error);
          }
        }

        navigate('/');
      });
    } catch {
      try {
        WebApp.openTelegramLink(invoiceUrl);
      } catch (error) {
        WebApp.MainButton.hide();
        location.href = invoiceUrl;
      } finally {
        if ((invoiceUrl.startsWith('https://t.me') || invoiceUrl.startsWith('http://t.me')) && isIOS()) {
          WebApp.close();
        }
      }
    }
  };

  const [disablePayments] = createConfigResource('disablePayments', false);

  const buyPlan = () => {
    if (disablePayments.latest && !isFreeSelected()) {
      /* DEACTIVATE SUBSCRIBE BUTTON */

      const title = t('payment-disabled title');
      const message = t('payment-disabled message');

      // Add ability to quickly cancel the disabling
      // because firebase remote config can lag up to 12 hours,
      // but firebase realtime db works instantly
      if (title && message) {
        WebApp.showPopup({
          title,
          message,
          buttons: [{ type: 'ok' }],
        });
        return;
      }
    }

    WebApp.HapticFeedback.impactOccurred('soft');

    if (props.selectedType) {
      set(props.selectedType, get(selectedPlan).code);
    }

    if (props.showAltText && isFreeSelected()) {
      return props.onBuy?.(Promise.resolve());
    }

    WebApp.MainButton.showProgress();
    WebApp.MainButton.setParams({ is_active: false });
    const plan = get(selectedPlan);
    const fetchingInvoice = fetchInvoice(
      plan.code,
      plan.kind,
      get(agreedToTerms),
      get(selectedPaymentOption),
      get(shouldBeRedeemable),
      get(amountToBuy),
    )
      .then(openSubscriptionForm)
      .catch(() => {
        WebApp.HapticFeedback.notificationOccurred('error');
      })
      .finally(() => {
        WebApp.MainButton.hideProgress();
        WebApp.MainButton.setParams({ is_active: true });
      });

    props.onBuy?.(fetchingInvoice);
  };

  const promocode = createSignal('');

  const [isPromoApplied, setPromoApplied] = createSignal<boolean>();

  const promoMessage = createSignal('');

  const agreedToTerms = createSignal(false);

  createEffect(() => {
    WebApp.MainButton.setParams({
      color: get(agreedToTerms) ? buttonColor.toHexString() : hintColor.toHexString(),
    });
  });

  const enter = (f: () => unknown) => (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      f();
    }
  };

  const applyPromo = () => {
    applyPromocode(get(promocode))
      .then(r => {
        try {
          if (typeof r === 'string') {
            set(promoMessage, r);
          } else {
            set(promoMessage, t('promo default-success'));
          }
        } finally {
          refetchUser();
          refetchPlans();
          setPromoApplied(true);
        }
      })
      .catch(e => {
        if (typeof e.detail === 'string') {
          set(promoMessage, e.detail);
        } else {
          set(promoMessage, t('promo default-error'));
        }
        setPromoApplied(false);
      });
  };

  const getBenefits = createBenefitGenerator(
    key => {
      const text = t('benefits', { key, fallback: '' });
      // TODO: fix intl-schematic
      return text === 'benefits' ? undefined : text;
    },
    key => t('benefits links', { key, fallback: '' }),
  );

  createRenderEffect(on(user, () => {
    if (!selectedPaymentOption.canUndo() && !isMobile())
      selectedPaymentOption.reset(user.latest.defaultPaymentType);
  }));

  const isSelected = createSelector(() => get(selectedPaymentOption));

  const [isPaymentOptionsOpen, setPOOpen] = createSignal(false);

  const initialTimeout = 600;
  const lowestTimeout = 75;
  let timeout = initialTimeout;
  let iterations = 0;

  function isIntervalTickActive() {
    return typeof intervalPtr === 'number';
  }

  function runIncreasedTick(callback: () => void): void {
    if (isIntervalTickActive() && iterations > 0) {
      timeout = Math.max(timeout / 2, lowestTimeout);
      clearInterval(intervalPtr);
      iterations = 0;
    }

    intervalPtr = window.setInterval(() => {
      if (iterations >= (initialTimeout / timeout)) {
        runIncreasedTick(callback);
      }

      iterations++;

      requestAnimationFrame(callback);
    }, timeout);
  }

  function stopIncreasedTick(callback?: () => void) {
    clearInterval(intervalPtr);
    intervalPtr = undefined;
    timeout = initialTimeout;
    iterations = 0;

    callback?.();
  }

  return <>
    <MainButton onClick={buyPlan}
      disabled={
        (
          ['pending', 'refreshing'].includes(plans.state)
          || !get(agreedToTerms)
          || get(formDisabled)
          || !getPaymentOptions().includes(get(selectedPaymentOption))
        ) && !isFreeSelected()
      } />

    <main class="= relative min-h-full flex flex-col items-stretch p-4 pb-28">
      <Suspense>
        <h1 class="= app-text-page-title-extra flex items-center text-center justify-center gap-2 mt--2 mb-2">
          <Switch fallback={t('title')}>
            <Match when={props.showAltText}>
              {props.showAltText?.title || t('title')}
            </Match>
            <Match when={!props.showAltText && isPaidUser()}>
              {t('title')} <Star class="= h-6 w-6" />
            </Match>
          </Switch>
        </h1>
        <Show when={!props.showAltText}
          fallback={
            <p class="= app-text-subtitle-extra text-center whitespace-break-spaces mt-0.5 mb-4">
              {props.showAltText?.subtitle}
            </p>
          }
        >
          <Switch fallback={
            <>
              <p class="= app-text-subtitle-extra font-700 text-center whitespace-break-spaces mt-0.5 mb-0">
                {t('trial-subtitle')}&nbsp;
              </p>
              <p class="= app-text-subtitle-extra text-center whitespace-break-spaces mt-0 mb-6">
                {t('trial-subsubtitle')}
              </p>
            </>
          }>
            <Match when={isPaidUser() && isSubscribed() && !user.latest.ofRole('TRIAL')}>
              <p class="= app-text-subtitle-extra font-700 text-center whitespace-break-spaces mt-0.5 mb-0">
                {t('paid-subtitle')}&nbsp;
              </p>
              <p class="= app-text-subtitle-extra text-center whitespace-break-spaces mt-0 mb-6">
                {t('paid-subsubtitle')}
              </p>
            </Match>
            <Match when={isPaidUser() && !isSubscribed() && !user.latest.ofRole('TRIAL')}>
              <p class="= app-text-subtitle-extra text-center whitespace-break-spaces mt-0 mb-6">
                <span class="= font-700">
                  {t('unpaid-subtitle')}&nbsp;
                </span>
                <span>
                  {t('unpaid-subsubtitle')}&nbsp;
                </span>
                <span class="= font-700">
                  {t('unpaid-subsubtitle-2')}
                </span>
              </p>
            </Match>
            <Match when={!isPaidUser()/*  && !user.latest.ofRole('TRIAL') */}>
              <p class="= app-text-subtitle-extra text-center whitespace-break-spaces mt-0 mb-6">
                <span class="= font-700">
                  {t('subtitle')}&nbsp;
                </span>
                <span>
                  {t('subsubtitle')}&nbsp;
                </span>
                <span class="= font-700">
                  {t('subsubtitle-2')}&nbsp;
                </span>
                <span>
                  {t('subsubtitle-3')}&nbsp;
                </span>
                <span class="= font-700">
                  {t('subsubtitle-4')}
                </span>
              </p>
            </Match>
          </Switch>
        </Show>
      </Suspense>
      <Show when={!props.hideExtra}>
        <Suspense>
          <Show when={isPaidUser()}>
            <h2 class="= app-text-footnote uppercase c-tg_hint mb-2">
              {t('about plan title')}
            </h2>
            <div class="= p-4 rounded-3 bg-tg_bg mb-4">
              <Show when={user.latest?.rolePriceCode}>
                {code =>
                  <p class="= app-text-body-regular m-0">
                    {t('about plan subtitle', { 'plan code': [code()] })}
                  </p>
                }
              </Show>
              <p class="= app-text-subheadline c-tg_hint m-0">
                <Show when={
                  user.latest.payDate || user.latest.roleExpires
                  ? { pay: user.latest.payDate, expires: user.latest.roleExpires, price: user.latest.rolePrice }
                  : undefined
                }>{(role, pay = role().pay, expires = role().expires, price = role().price) =>
                  <Show when={isSubscribed() && typeof price === 'number' && price > 0}
                    fallback={
                      t('about plan description-cancelled', {
                        'plan expiration-date': [{ date: pay ?? expires }],
                      })
                    }
                  >
                    {MaybeXTR(t('about plan description', {
                      'plan expiration-date': [{ date: pay }],
                      'plan price': [price, { currency: user.latest.currency }],
                    }))}
                  </Show>
                }</Show>
              </p>
            </div>
          </Show>
        </Suspense>
      </Show>

      <h2 class="= app-text-footnote uppercase c-tg_hint" id="payment-options">
        {t('payment-options section title single')}
      </h2>
      <div class="= relative rounded-3 mb-4"
        classList={{ 'overflow-hidden': !isPaymentOptionsOpen() }}
      >
        <List each={[0]}>
          {() => <List.Item
            left={<img src={`${import.meta.env.BASE_URL}${import.meta.env.APP_BASE ?? '/'}payments/${get(selectedPaymentOption)}.png`} class="= rounded-full min-h-9 min-w-9 max-h-9 max-w-9" />}
            right={<></>}
          >
            <div>
              <p class="= m-0">
                {t('payment-options title', { key: get(selectedPaymentOption), fallback: get(selectedPaymentOption) })}
              </p>
              <p class="= m-0 app-text-footnote c-tg_hint">
                {t('payment-options subtitle', { key: get(selectedPaymentOption), fallback: '' })}
              </p>
            </div>
          </List.Item>}
        </List>
        <div class="= absolute top-0 w-full bg-tg_bg rounded-3 app-transition-max-height,box-shadow,height z--1 overflow-hidden shadow-none max-h-full"
          classList={{ 'z-10! shadow-xl! max-h-initial!': isPaymentOptionsOpen() }}
        >
          <List each={getPaymentOptions()}>
            {(option) => <List.Item
              onClick={() => (set(selectedPaymentOption, option), setPOOpen(false), WebApp.HapticFeedback.selectionChanged())}
              right={
                <Checkmark class="= fill-tg_button app-transition-width,opacity"
                  classList={{ 'w-0 opacity-0': !isSelected(option), 'selected': isSelected(option) }}
                />
              }

              left={<img src={`${import.meta.env.BASE_URL}${import.meta.env.APP_BASE ?? '/'}payments/${option}.png`} class="= rounded-full min-h-9 min-w-9 max-h-9 max-w-9" />}
            >
              <div>
                <p class="= m-0">
                  {t('payment-options title', String(option))}
                </p>
                <p class="= m-0 app-text-footnote c-tg_hint">
                  {t('payment-options subtitle', String(option))}
                </p>
              </div>
            </List.Item>}
          </List>
        </div>
      </div>

      <h2 class="= app-text-footnote uppercase c-tg_hint" id="payment-amount-options">
        {t('amount section title')}
      </h2>
      <div class="= relative rounded-3">
        <List>
          <List.Item
            right={
              <div class="= rounded-3 bg-tg_bg_tertiary mx-2 flex items-center gap-2">
                <button class="= bg-transparent p-1.5 flex items-center bold c-tg_text font-bold!"
                  onMouseUp={() => stopIncreasedTick(decrementAmount)}
                  onMouseDown={() => runIncreasedTick(decrementAmount)}
                  onMouseOut={() => stopIncreasedTick()}
                >
                  <Minus class="= fill-tg_text" classList={{ 'fill-tg_hint!': get(amountToBuy) <= 1 }} />
                </button>
                <span>{get(amountToBuy)}</span>
                <button class="= bg-transparent p-1.5 flex items-center bold c-tg_text font-bold!"
                  onMouseUp={() => stopIncreasedTick(incrementAmount)}
                  onMouseDown={() => runIncreasedTick(incrementAmount)}
                  onMouseOut={() => stopIncreasedTick()}
                >
                  <Plus class="= fill-tg_text" classList={{ 'fill-tg_hint!': get(amountToBuy) >= 200 }} />
                </button>
              </div>
            }
          >
            {t('amount section quantity')}
          </List.Item>
          <List.Item onClick={() => setRedeemable(!get(shouldBeRedeemable))}
            right={
              <div class="= rounded-3 mx-2 pointer-events-none">
                <Checkbox checked={get(shouldBeRedeemable)} disabled={get(amountToBuy) > 1} />
              </div>
            }
          >
            {t('amount section gift')}
          </List.Item>
        </List>
      </div>
      <div class="= mt-1 mb-4">
        <For each={t('amount section subtitle', {}, '\n').split('\n')}>
          {text => <p class="= app-text-footnote c-tg_hint m-0">{text}</p>}
        </For>
      </div>

      <Show when={!props.hideExtra}>
        <Suspense>
          <h2 class="= app-text-footnote uppercase c-tg_hint">
            <Show when={isPaidUser()}
              fallback={t('plan title')}
            >{t('plan title-paid')}</Show>
          </h2>
        </Suspense>
      </Show>

      <Suspense>
        <Show when={plans.latest.length > 0}>
          <QuantityContext.Provider value={delayedQuantity[0]}>
            <Dynamic component={getPlans().length > 1 ? PlansList : OldPlansList}
              plans={getPlans()}
              hueRotation={hueRotation()}
              selectedPlan={selectedPlan}
            />
          </QuantityContext.Provider>
        </Show>
      </Suspense>

      <Show when={!props.hideExtra}>
        <div class="= w-full mb-2 flex items-center justify-between bg-tg_bg rounded-3">
          <input type="text"
            class="= w-full py-1 ltr:pl-4 rtl:pr-4 app-text-body-regular min-h-12 b-tg_hint"
            placeholder={t('promo placeholder')}
            use:model={promocode}
            onInput={() => setPromoApplied(undefined)}
            onKeyPress={enter(applyPromo)}
          />
          <Switch>
            <Match when={get(promocode).length > 0 && isPromoApplied() === undefined}>
              <ArrowCircleRight class="= cursor-pointer min-w-12 px-3 fill-tg_button"
                onClick={applyPromo}
              />
            </Match>
            <Match when={isPromoApplied()}>
              <Check class="= fill-success cursor-pointer min-w-12 px-3" />
            </Match>
            <Match when={isPromoApplied() === false}>
              <IconAlertCircle class="= fill-urgent cursor-pointer min-w-12 px-3" />
            </Match>
          </Switch>
        </div>

        <p class="= app-text-footnote c-tg_hint m-0">
          {get(promoMessage)}
        </p>

        <h2 class="= app-text-footnote uppercase c-tg_hint mt-4">
          {t('benefits title')}
        </h2>

        <Benefits getBenefits={getBenefits} class="= mb-4" />

        <h2 class="= app-text-footnote uppercase c-tg_hint mb-2">
          {t('about title')}
        </h2>
        <p class="= app-text-subheadline m-0 p-4 rounded-3 bg-tg_bg mb-2">
          {t('about description')}
        </p>
      </Show>

      <Show when={!props.hideExtra}>
        <Suspense>
          <Show when={isPaidUser() && user.latest?.isSubscribed && user.latest.id}>
            {userId =>
              <button class="= bg-transparent c-tg_link py-4 text-center font-600"
                onClick={requestUnsubscribe(userId())}
              >
                {t('unsubscribe')}
              </button>
            }
          </Show>
        </Suspense>
      </Show>
    </main>

    <div class="= fixed bottom-0 ltr:left-0 rtl:right-0 ltr:right-0 rtl:left-0 px-4 py-1 bg-tg_bg_secondary app-transition-bottom z-100"
      classList={{
        'bottom--20!': isFreeSelected(),
      }}
    >
      <Checkbox iconStyle={CheckboxStyle.Telegram} class="= flex items-center"
        model={agreedToTerms}
      >
        <p class="= m-0 app-text-footnote c-tg_hint ltr:ml-4 rtl:mr-4">
          {t('legal pre')}
          <a href="https://utasks.io/Terms%20of%20Use.pdf" target="_blank" class="= text-nowrap c-tg_link">{t('legal agreement')}</a>
          {t('legal conjunction-1')}
          <a href="https://utasks.io/Payment%20Policy.pdf" target="_blank" class="= text-nowrap c-tg_link">{t('legal policy payment')}</a>.
          {t('legal conjunction-2')}
          <a href="https://utasks.io/Privacy%20and%20Cookie%20Policy.pdf" target="_blank" class="= text-nowrap c-tg_link">{t('legal policy')}</a>.
        </p>
      </Checkbox>
    </div>
  </>;

  function isFreeSelected(plan = get(selectedPlan)): boolean {
    return plan.code === 'FREE';
  }

  function requestUnsubscribe(userId: string) {
    return () => (
      WebApp.showConfirm(t('unsubscribe confirm'), (result) => (
        set(formDisabled, result) && unsubscribe(userId)
          .then(() => {
            WebApp.showAlert(t('unsubscribe success'));
          })
          .catch(() => {
            WebApp.showAlert(t('unsubscribe fail'));
          })
          .finally(() => {
            refetchUser();
            refetchPlans();
            set(formDisabled, false);
          })
      ))
    );
  }

  function isPaidUser(): boolean{
    return get(paymentProviderApproved) || user.latest.isPro;
  }

  function isSubscribed() {
    return get(paymentProviderApproved) || user.latest.isSubscribed;
  }

  function PlansList(_props: {
    plans?: Plan[];
    hueRotation: number;
    selectedPlan: Signal<PlanModel>;
  }) {
    const currency = createMemo(() => _props.plans?.find(p => p.currency)?.currency ?? 'RUB');
    const decimals = createMemo(() => _props.plans?.find(p => p.decimals)?.decimals);

    return <fieldset class="= b-0 p-0 m-0">
      <For each={_props.plans}>
        {plan => {
          const isDisabled = createMemo(() => isPlanDisabled(plan));

          return <>
            <Checkbox type="radio" name={`default-${plan.code}`}
              class="= flex flex-grow gap-5 bg-tg_bg rounded-3 mb-2"
              checkClass="min-w-7.5 py-4 h-full ltr:ml-4.5 rtl:mr-4.5 z-2"
              labelClass="flex-grow relative flex items-center justify-between py-4 rtl:pl-4 ltr:pr-4"
              model={toPlanSelectorModel(plan)}
              rotateHue={_props.hueRotation}
              disabled={isDisabled()}
              disableFeedback
            >
              <div class="= flex flex-col flex-grow mt--0.5"
                classList={{ 'filter-grayscale-100 opacity-50': isDisabled() }}
              >
                <p class="= app-text-headline m-0">{plan.title}</p>

                <div class="= mt-2">
                  <span class="= app-text-title-2 c-tg_text">
                    {MaybeXTR(t('plan price', (getSelectedKind(plan).monthlyPrice) / 100, { currency: currency(), maximumFractionDigits: decimals() }))}
                  </span>
                  <span> </span>
                  <Show when={getSelectedKind(plan).payPrice !== 0}> <span class="= app-text-page-subtitle-extra c-tg_hint">
                    / {t('plan code-short', 'M')}
                  </span>
                  </Show>
                </div>

                <Show when={props.children}>
                  {props.children?.(plan)}
                </Show>

                <Show when={plan.kinds.length > 1 && plan.currency}>
                  <ul class="= reset-list rounded-3 b-solid b-1 b-border-regular ltr:pl-4 rtl:pr-4 mt-2">
                    <For each={plan.kinds}>
                      {kind => <PlanKindItem
                        plan={plan}
                        kind={kind}
                        hueRotation={_props.hueRotation}
                        model={/* @once */isDisabled() ? [() => false, () => {/**/}] : createKindModel(kind, plan)} />}
                    </For>
                  </ul>
                </Show>
              </div>
            </Checkbox>
          </>;
        }}
      </For>
    </fieldset>;

    function isPlanDisabled(plan: Plan): boolean {
      return plan.kinds?.every(k => k.enabled === false);
    }

    function getSelectedKind(plan: Plan) {
      return plan.kinds.find(k => k.code === get(_props.selectedPlan).kind) ?? plan.kinds[0];
    }

    function toPlanSelectorModel(plan: Plan): Signal<boolean> | undefined {
      if (isPlanDisabled(plan)) {
        return undefined;
      }

      return [
        () => {
          return get(_props.selectedPlan).code === plan.code;
        },
        ((v) => {
          if (v && plan.kinds[0].enabled !== false) {
            WebApp.HapticFeedback.selectionChanged();
            return !!set(_props.selectedPlan, toPlanModel(plan, plan.kinds[0]));
          }

          return v;
        }) as Setter<boolean>,
      ];
    }

    function createKindModel(kind: PlanKind, plan: Plan): Signal<boolean> {
      return [
        () => {
          const x = get(_props.selectedPlan);
          return x.code === plan.code && x.kind === kind.code && kind.enabled !== false;
        },
        (y) => {
          if (y && kind.enabled !== false) {
            WebApp.HapticFeedback.selectionChanged();
            set(_props.selectedPlan, toPlanModel(plan, kind));
          }

          return y;
        },
      ];
    }
  }
}

function ReplaceXTR(text: string, replacement = '') {
  if (!text.includes('XTR')) {
    return text;
  }

  return text.replace(/XTR/, replacement);
}

function MaybeXTR(text: string, replacement = '') {
  if (!text.includes('XTR')) {
    return text;
  }

  const [pre, post] = text.split('XTR');

  return <>
    {pre}
    <span class="= tgico">{replacement}</span>
    {post}
  </>;
}

function toPlanModel(plan: Plan, kind: PlanKind): PlanModel | ((prev: PlanModel) => PlanModel) | undefined {
  return { code: plan.code, kind: kind.code, price: kind.payPrice / 100, currency: plan.currency, decimals: plan.decimals };
}

function PlanKindItem(props: {
  plan: Plan;
  kind: PlanKind;
  hueRotation: number;
  model: Signal<boolean>;
}) {
  const discountPercent = -(props.kind.discountPercent ?? 0);

  const isSelected = () => get(props.model);

  const quantity = useContext(QuantityContext) ?? (() => 1);

  return <li class="= flex py-2 ltr:pr-4 rtl:pl-4 min-h-14 [&:last-child_.divider]:h-0 [&_*]:cursor-pointer"
    role="radio"
    onClick={() => isDisabled() ? undefined : set(props.model, true)}
    classList={{ '[&_*]:cursor-not-allowed filter-grayscale-100 opacity-50': isDisabled() }}
  >
    <div class="= flex gap-4 flex-grow relative flex items-center justify-between">
      <div class="= flex flex-col justify-center">
        <span class="= app-text-page-subtitle-extra">
          {t('plan code', props.kind.code)}
          <Show when={props.kind.discountPercent}>
            <span class="= px-1 py-0 rounded-1.5 app-text-badge c-tg_button_text bg-urgent ltr:ml-2 rtl:mr-2">
              {t('plan discount', discountPercent / 100)}
            </span>
          </Show>
        </span>
        <div class="= inline-flex items-center gap-2 flex-wrap max-h-[16px] overflow-hidden">
          <span class="= app-text-new-subtitle c-tg_hint inline-flex items-center">
            {MaybeXTR(t('plan price', (props.kind.payPrice / quantity()) / 100, { currency: props.plan.currency, maximumFractionDigits: props.plan.decimals }))}
          </span>

          <Show when={props.kind.oldYearlyPrice && props.kind.discountPercent}>
            <span class="= app-text-new-subtitle c-tg_hint inline-flex items-center decoration-line-through">
              {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
              {MaybeXTR(t('plan price', ((props.kind.oldYearlyPrice! / (props.kind.yearlyPrice / props.kind.payPrice)) / quantity()) / 100, { currency: props.plan.currency, maximumFractionDigits: props.plan.decimals }))}
            </span>
          </Show>
        </div>
      </div>
      <Checkmark class="= fill-tg_button app-transition-width,opacity"
        classList={{ 'w-0 opacity-0': !isSelected(), 'selected': isSelected() }}
      />
      <div class="= divider absolute bottom--2 bg-tg_bg_secondary h-[1px]" style={{ 'width': 'calc(100% + 1rem)' }}></div>
    </div>
  </li>;

  function isDisabled(): boolean | undefined {
    return props.kind.enabled === false;
  }
}


function OldPlansList(props: {
  plans?: Plan[];
  hueRotation: number;
  selectedPlan: Signal<PlanModel>;
}) {
  return <fieldset class="= b-0 p-0 m-0">
    <For each={props.plans}>
      {plan => <div class="= bg-tg_bg rounded-3 mb-2 ltr:pl-4 rtl:pr-4">
        <Show when={(props.plans?.length ?? 0) > 1}>
          <p class="= app-text-title mt-1 mb-1.5">{plan.title}</p>
        </Show>
        <ul class="= reset-list rounded-3">
          <For each={plan.kinds}>
            {kind => <OldPlanKindItem
              plan={plan}
              kind={kind}
              hueRotation={props.hueRotation}
              model={/* @once */createKindModel(kind, plan)} />}
          </For>
        </ul>
      </div>}
    </For>
  </fieldset>;

  function createKindModel(kind: PlanKind, plan: Plan): Signal<boolean> {
    return [
      () => {
        const x = get(props.selectedPlan);
        return x.code === plan.code && x.kind === kind.code;
      },
      y => {
        if (y) {
          set(props.selectedPlan, toPlanModel(plan, kind));
          WebApp.HapticFeedback.selectionChanged();
        }

        return y;
      },
    ];
  }
}

function OldPlanKindItem(props: {
  plan: Plan;
  kind: PlanKind;
  hueRotation: number;
  model: Signal<boolean>;
}) {
  const discountPercent = -(props.kind.discountPercent ?? 0);

  const quantity = useContext(QuantityContext) ?? (() => 1);

  return <li class="= flex py-2 ltr:pr-4 rtl:pl-4 min-h-14 [&:last-child_.divider]:h-0 [&_*]:cursor-pointer" role="radio"
    classList={{ '[&_*]:cursor-not-allowed filter-grayscale-100 opacity-50': isDisabled() }}
  >
    <Checkbox type="radio" name={`${props.kind.code}-${props.plan.code}`}
      class="= flex flex-grow gap-4 ml--1"
      checkClass="min-w-7.5"
      labelClass="flex-grow relative flex items-center justify-between"
      checked={isDisabled() ? undefined : false}
      rotateHue={props.hueRotation}
      model={props.model}
      disableFeedback
      disabled={isDisabled()}
    >
      <div class="= flex flex-col justify-center">
        <span class="= app-text-page-subtitle-extra">
          {t('plan code', props.kind.code)}
          <Show when={props.kind.discountPercent}>
            <span class="= px-1 py-0 rounded-1.5 app-text-badge c-tg_button_text bg-urgent ltr:ml-2 rtl:mr-2">
              {t('plan discount', discountPercent / 100)}
            </span>
          </Show>
        </span>
        <div class="= inline-flex items-center gap-2 flex-wrap max-h-[16px] overflow-hidden">
          <Show when={props.kind.payPrice !== props.kind.monthlyPrice}>
            <span class="= app-text-new-subtitle c-tg_hint inline-flex items-center">
              {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
              {MaybeXTR(t('plan price', ((props.kind.yearlyPrice! / (props.kind.yearlyPrice / props.kind.payPrice))) / quantity() / 100, { currency: props.plan.currency, maximumFractionDigits: props.plan.decimals }))}
            </span>
          </Show>

          <Show when={props.kind.oldYearlyPrice && props.kind.discountPercent}>
            <span class="= app-text-new-subtitle c-tg_hint inline-flex items-center decoration-line-through">
              {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
              {MaybeXTR(t('plan price', ((props.kind.oldYearlyPrice! / (props.kind.yearlyPrice / props.kind.payPrice))) / quantity() / 100, { currency: props.plan.currency, maximumFractionDigits: props.plan.decimals }))}
            </span>
          </Show>
        </div>
      </div>
      <div class="= app-text-page-subtitle-extra inline-flex justify-end items-center c-tg_text opacity-60">
        {MaybeXTR(t('plan price', (props.kind.monthlyPrice / quantity()) / 100, { currency: props.plan.currency, maximumFractionDigits: props.plan.decimals }))}
        /
        {t('plan code-short', 'M')}
      </div>
      <div class="= divider absolute bottom--2 bg-tg_bg_secondary h-[1px]" style={{ 'width': 'calc(100% + 1rem)' }}></div>
    </Checkbox>
  </li>;

  function isDisabled(): boolean | undefined {
    return props.kind.enabled === false;
  }
}
