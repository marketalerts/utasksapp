import WebApp from 'tma-dev-sdk';
import { model, useDirectives } from 'solid-utils/model';
import { createHistorySignal } from 'solid-utils/history';
import type { HistorySignal } from 'solid-utils/history';
import { get, set } from 'solid-utils/access';
import { Transition } from 'solid-transition-group';
import { Portal } from 'solid-js/web';
import { For, Show, children, createEffect, createMemo, createRenderEffect, createSignal, createUniqueId, on } from 'solid-js';
import type { JSX, ParentComponent, ParentProps, Ref, Signal } from 'solid-js';
import { isIOS } from '@solid-primitives/platform';

import { isMobile } from 'shared/platform';
import { currentLocale } from 'shared/l10n';

import { hasTime, withTime, withConfigTimezone, hasNoTime, today, fromConfigTimezone } from 'f/settings/units/date';
import { getCurrentTimezoneId, getCurrentTimezoneOffset } from 'f/settings/timezone';

import { useDialog } from '../use-dialog';
import { BackButton, MainButton, SecondaryButton } from '../telegram';

import TabToggle, { TabWrapper } from 'ui/elements/tabs/tab-toggle';
import type { TabItem } from 'ui/elements/tabs';
import { withOffset } from 'ui/elements/datepicker/rules';
import Datepicker from 'ui/elements/datepicker';

import Tomorrow from 'icons/24/Tomorrow.svg';
import Today from 'icons/24/Today.svg';
import Clear from 'icons/24/Clear Date.svg';
import Right from 'icons/16/Chevron Right Filled.svg';
import Left from 'icons/16/Chevron Left Filled.svg';
import Plus from 'i/Plus.svg';

export default function DatePicker(props: {
  dialogControl?: ReturnType<typeof useDialog>;
  modelStart: Signal<Date | null>;
  modelEnd: Signal<Date | null>;
  disabled?: boolean;
  clearText?: string;
  todayText?: string;
  tomorrowText?: string;
  timeLabel?: string;

  cancelText: string;
  acceptText: string;

  startTab: (Wrapper: ParentComponent) => JSX.Element;
  endTab: (Wrapper: ParentComponent) => JSX.Element;
  endTabDisabled?: (Wrapper: ParentComponent) => JSX.Element;

  bottomChildren?: (
    timeModel: () => Signal<string>,
    dateModel: () => Signal<Date | null>,
    isStartModel: () => boolean
  ) => JSX.Element;

  children: (open: (at?: 'start' | 'end') => void) => JSX.Element;
}) {
  let root!: HTMLDivElement;
  const localModelStart = createHistorySignal<Date | null>(getSelectionObject(get(props.modelStart)) ?? today());
  const timeModelStart = createHistorySignal(getStringFromTime(props.modelStart));

  const localModelEnd = createHistorySignal<Date | null>(getSelectionObject(get(props.modelEnd)));
  const timeModelEnd = createHistorySignal(getStringFromTime(props.modelEnd));

  const currentModel = createSignal(localModelStart);
  const currentTimeModel = createMemo(() => get(currentModel) === localModelStart ? timeModelStart : timeModelEnd);

  createRenderEffect(on(() => [get(localModelStart), get(localModelEnd)], () => {
    WebApp.HapticFeedback.selectionChanged();
  }));

  createRenderEffect(on(() => get(props.modelStart), () => {
    localModelStart.reset(getSelectionObject(get(props.modelStart)));
    timeModelStart.reset(getStringFromTime(props.modelStart) ?? '');
  }));

  createRenderEffect(on(() => get(props.modelEnd), () => {
    localModelEnd.reset(getSelectionObject(get(props.modelEnd)));
    timeModelEnd.reset(getStringFromTime(props.modelEnd) ?? '');
  }));

  const [isOpen, setOpen, setRef, ref] = props.dialogControl ?? useDialog('modal');

  useDirectives(model);

  const acceptDate = () => {
    applyDateFromLocalModel(get(timeModelStart), get(localModelStart), props.modelStart);
    applyDateFromLocalModel(get(timeModelEnd), get(localModelEnd), props.modelEnd);
    setOpen(false);
  };

  let timeInput!: HTMLInputElement;

  const bottomChildren = children(() => props.bottomChildren?.(currentTimeModel, () => get(currentModel), () => get(currentModel) === localModelStart));

  const language = () => new Intl.Locale(currentLocale() ?? navigator.language).language;

  const displayMonthNames = createMemo(() => new Intl.DateTimeFormat(
    language(),
    { month: 'long', year: 'numeric' },
  ));

  const formatMonthName = (date: Date) => displayMonthNames()
    .formatToParts(date)
    .reduce((s, p) => p.type !== 'literal' ? s + ' ' + p.value : s, '');

  const displayWeekNames = createMemo(() => new Intl.DateTimeFormat(
    language(),
    { weekday: 'short' },
  ));

  const tabs = [
    {
      children: props.startTab,
      value: localModelStart,
    },
    {
      children: W => props.endTabDisabled?.(W) ?? props.endTab(W),
      value: localModelEnd,
      disabled: () => !!props.endTabDisabled,
    },
  ] satisfies TabItem<Signal<Date | null>>[];

  const bgColor = `var(--tg-theme-secondary-bg-color)`;

  createEffect(on(isOpen, () => {
    if (isOpen()) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, { defer: true }));

  const resolved = children(() => props.children((at) => {
    set(currentModel, at === 'end' ? localModelEnd : localModelStart);
  }));

  return (<>
    <button onClick={(e) => props.disabled || (e.stopPropagation(), setOpen(true))}
      type="button"
      class="relative bg-transparent cursor-pointer p-0"
      disabled={props.disabled}
    >
      {resolved()}
    </button>

    <Portal>
      {/* <Transition
        enterActiveClass="animate-init-fade-in-right"
        exitActiveClass="animate-init-fade-out-right"
      > */}
      <Show when={isOpen()}>
        <div ref={root}
          class="fixed top-0 left-0 right-0 bottom-0 p-0 bg-app-secondary border-0 z-100 overflow-y-auto overflow-x-hidden"
          style="overscroll-behavior: contain"

          onClick={e => e.stopPropagation()}
        >
          <TabWrapper>
            <TabToggle selected={currentModel} tabs={tabs} />
          </TabWrapper>

          <Datepicker today={today()}
            start={localModelStart}
            end={localModelEnd}
            model={currentModel as any as Signal<Signal<Date | null>>}
            weekStartDay={1}
            bgColor={bgColor}

            onScroll={() => isIOS ? WebApp.HapticFeedback.impactOccurred('soft') : WebApp.HapticFeedback.selectionChanged()}

            header={ctx => <>
              <div class="pt-1 flex items-center justify-between rtl:flex-row-reverse w-full">
                <div class="h-10 w-10 flex items-center justify-center cursor-pointer" role="button"
                  onClick={e => {e.stopPropagation(); ctx.selectPreviousMonth(); }}
                >
                  <Left class="ui-icon-primary" />
                </div>
                <p class="flex-grow text-center capitalize app-text-subheadline font-600!"
                  onClick={e => {e.stopPropagation(); ctx.onMonthClick(); }}
                >
                  {formatMonthName(ctx.date())}
                </p>
                <div class="h-10 w-10 flex items-center justify-center cursor-pointer" role="button"
                  onClick={e => {e.stopPropagation(); ctx.selectNextMonth(); }}
                >
                  <Right class="ui-icon-primary" />
                </div>
              </div>
            </>}

            weekNames={(days, WeekName) =>
              <For each={days}>
                {date =>
                  <WeekName day={date}>
                    {displayWeekNames().format(date).slice(0, 2)}
                  </WeekName>
                }
              </For>
            }

            footer={selectDate => <div class="p-4 gap-4 flex flex-col">
              <div class="grid grid-rows-1 grid-cols-3 gap-2 w-full">
                <button class="flex flex-col items-center rounded-3 bg-app-section px-1 gap-1 min-h-15 justify-center"
                  onClick={e => {
                    e.stopPropagation();
                    selectDate(null);
                    set(currentTimeModel(), '');

                    if (!timeInput) return;

                    timeInput.value = '';
                  }}
                >
                  <Clear class="ui-icon-accented" />
                  <span class="app-text-body-s/medium c-app-text-accented">
                    {props.clearText}
                  </span>
                </button>

                <button class="flex flex-col items-center rounded-3 bg-app-section px-1 gap-1 min-h-15 justify-center"
                  onClick={e => {
                    e.stopPropagation();
                    selectDate(today());
                  }}
                >
                  <Today class="ui-icon-accented" />
                  <span class="app-text-body-s/medium c-app-text-accented">
                    {props.todayText}
                  </span>
                </button>

                <button class="flex flex-col items-center rounded-3 bg-app-section px-1 gap-1 min-h-15 justify-center"
                  onClick={e => {
                      e.stopPropagation();
                    selectDate(withOffset(today(), { days: +1 }));
                  }}
                >
                  <Tomorrow class="ui-icon-accented" />
                  <span class="app-text-body-s/medium c-app-text-accented">
                    {props.tomorrowText}
                  </span>
                </button>
              </div>

              <Show when={props.timeLabel}>
                <TimeInput timeLabel={props.timeLabel!} timeModel={currentTimeModel()} ref={timeInput} />
              </Show>

              {bottomChildren()}
            </div>}
          />

          <SecondaryButton onClick={dismissDate}
            text={props.cancelText}
          >
          </SecondaryButton>

          <MainButton onClick={acceptDate}
            text={props.acceptText}
          >
          </MainButton>

          <BackButton onClick={dismissDate}>
          </BackButton>
        </div>
      </Show>
      {/* </Transition> */}
    </Portal>
  </>);

  function dismissDate(): void {
    setOpen(false);
    set(localModelStart, getSelectionObject(get(props.modelStart)));
    set(localModelEnd, getSelectionObject(get(props.modelEnd)));
  }

  function getSelectionObject(date: Date | null): Date | null {
    if (!date) {
      return null;
    }

    if (hasNoTime(date)) {
      return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      );
    }

    return new Date(date);
  }
}

export function applyDateFromLocalModel(timeText: string, dateSource: Date | null, targetModel: Signal<Date | null>) {
  if (!dateSource) {
    return set(targetModel, null);
  }

  const timeDate = new Date(
    dateSource.getFullYear(),
    dateSource.getMonth(),
    dateSource.getDate(),
  );

  const [hours, minutes] = timeText?.split(':').map(v => Number(v)) ?? [0, 0];

  if (isNaN(hours) || isNaN(minutes)) {
    // "No time" means 00:00 in UTC
    timeDate.setMinutes(-getCurrentTimezoneOffset(), 0, 0);
    return set(targetModel, timeDate);
  }

  set(targetModel, withTime(timeDate, Number(hours), Number(minutes)));
}

export function getStringFromTime(timeModel: Signal<Date | null>) {
  return hasTime(get(timeModel)) ? get(timeModel)?.toLocaleTimeString('en', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }) ?? '' : '';
}

export function TimeInput(props: {
  timeLabel: string;
  timeModel: HistorySignal<string>;
  ref?: Ref<HTMLInputElement>;
}) {
  const inputTimeId = `${createUniqueId()}-time`;
  let timeInput!: HTMLInputElement;

  return <div class="=time-input-container px-5 max-w-full flex justify-between items-center overflow-hidden mb-4">
    <label class="=time-label c-tg_hint flex items-center" for={inputTimeId}>
      {props.timeLabel}
      <Show when={shouldShowTimeClearButton()}
        fallback=":"
      >
        <span role="button" onClick={(e) => (e.stopPropagation(), props.timeModel.reset(), timeInput.value = '')}
          class="=clear-time ltr:ml-2 rtl:mr-2 cursor-pointer"
        >
          <Plus class="= fill-tg_hint rotate-45 w-4" />
        </span>
      </Show>
    </label>

    <input type="time" id={inputTimeId} ref={e => (typeof props.ref === 'function' ? props.ref!(e) : props.ref = e, timeInput = e)}
      class="min-w-16 max-w-40% h-10 ltr:ml-4 rtl:mr-4 text-center b-solid b-1 b-tg_hint rounded-3 cursor-text"
      pattern="[0-9]{2}\:[0-9]{2}"
      use:model={props.timeModel}
      value={get(props.timeModel)}
      onClick={e => e.stopPropagation()}
    />
  </div>;

  function shouldShowTimeClearButton(): boolean | null | undefined {
    return !isMobile() && !!get(props.timeModel) && !!get(props.timeModel)?.split(':').some(x => !isNaN(Number(x)));
  }
}
