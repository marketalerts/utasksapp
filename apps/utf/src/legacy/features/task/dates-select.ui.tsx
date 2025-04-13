import { model } from 'solid-utils/model';
import { get, set } from 'solid-utils/access';
import { Transition } from 'solid-transition-group';
import { Portal, untrack } from 'solid-js/web';
import { createEffect, createSelector, createSignal, Show } from 'solid-js';
import type { JSX, ParentProps, Signal } from 'solid-js';
import { isSafari } from '@solid-primitives/platform';

import { isMobile } from 'shared/platform';
import type { RepetitionType } from 'shared/l10n/cron';

import { today, tomorrow, withTime } from 'f/settings/units/date';

import { availableNotifications, maximumNotifications } from './task.adapter';
import type { TaskNotification } from './task.adapter';

import { t } from 'locales/task';
import { t as tButton } from 'locales/create-button';

import { withOffset } from 'ui/elements/datepicker/rules';
import { useDialog } from 'shared/ui/use-dialog';
import ProBadge from 'shared/ui/pro-badge';
import List from 'shared/ui/list';
import Dialog from 'shared/ui/dialog';
import DatePicker from 'shared/ui/datepicker';

import Checkmark from 'icons/Checkmark.svg';
import BigRepeat from 'icons/20/Repeat Outlined.svg';
import BigAlarm from 'icons/20/Remind Outlined.svg';
import BigClock from 'icons/20/Clock Outlined.svg';


export default function DatesSelect(props: {
  planDate: Signal<Date | null>;
  dueDate: Signal<Date | null>;
  planDateNotifications: Signal<TaskNotification[]>;
  dueDateNotifications: Signal<TaskNotification[]>;
  canUseDueDate: () => boolean;
  selectedRepetition: Signal<RepetitionType | undefined>;

  children: (open: (at?: 'start' | 'end') => void) => JSX.Element;
}) {
  model;
  const cronDialog = useDialog('modal');
  const dateDialog = useDialog('modal');
  const notificationDialog = useDialog('modal');

  const repetitionList = [undefined, 'year', 'month', 'weekday', 'day'] satisfies (RepetitionType | undefined)[];

  const isRepSelected = createSelector(props.selectedRepetition[0]);

  const notifications = (isFirst: boolean) => (
    isFirst ? props.planDateNotifications : props.dueDateNotifications
  );

  return <div class="flex-grow text-center">
    <DatePicker dialogControl={dateDialog}
      clearText={tButton('datepicker clear')}
      todayText={t('task plan-date', { date: today() })}
      tomorrowText={t('task plan-date', { date: tomorrow() })}

      cancelText={tButton('datepicker cancel')}
      acceptText={tButton('datepicker accept')}

      modelStart={props.planDate}
      modelEnd={props.dueDate}

      startTab={W => <W>
        {t('task plan-date-info')}
      </W>}

      endTab={W => <W>
        {t('task due-date-info')}
      </W>}

      endTabDisabled={props.canUseDueDate() ? undefined : W => <W>
        <span class="flex items-center gap-1">
          {t('task due-date-info')}

          <ProBadge noText class="scale-75" />
        </span>
      </W>}

      bottomChildren={(time, date, isFirst) => {
        const notificationModel = createSignal(untrack(() => get(notifications(isFirst()))), { equals: () => false });

        // TODO: optimize this
        const isNotificationSelected = (value: TaskNotification) => (
          !!get(notificationModel).find(n => value.equals(n))
        );

        createEffect(() => {
          set(notificationModel, get(notifications(isFirst())));
        });

        return <div class="relative">
          {/* Convoluted setup for animating the bottom list so it's more obvious that the controls have separate values for different models */}
          <Transition
            enterActiveClass={'absolute! ' + (isFirst() ? '10-animate-init-fade-in-left' : '10-animate-init-fade-in-right')}
            exitActiveClass={'absolute! ' + (isFirst() ? 'animate-init-fade-out-right' : 'animate-init-fade-out-left')}
          >
            <Show when={isFirst()} fallback={<BottomList isFirst={isFirst()} time={time()} date={date()} />}>
              <BottomList isFirst={isFirst()} time={time()} date={date()} />
            </Show>
          </Transition>

          <Portal>
            <Dialog dialogParams={notificationDialog}
              class="= fixed bg-app-section rounded-2 b-0 p-0 outline-none mx-4 w-[calc(100%_-_1rem)] z-100000"
            >
              <List each={[...availableNotifications.values()]} refactor>{notif =>
                <List.Item simple
                  // TODO: optimize and refactor this shit
                  onClick={() => set(notificationModel, v => {
                    const found = v.findIndex(item => notif.equals(item));

                    if (found > -1) {
                      return v.slice(0, found).concat(v.slice(found + 1));
                    }

                    return [...v, notif].slice(-maximumNotifications);
                  })}

                  right={
                    <Checkmark class="= relative fill-tg_button ml-2 opacity-0 right--100% app-transition-right,opacity"
                      classList={{ 'opacity-100 right--0': isNotificationSelected(notif) }}
                    />
                  }
                >
                  <span classList={{ 'c-app-text-accented': isNotificationSelected(notif) }}>
                    {translateNotification(notif)}
                  </span>
                </List.Item>
              }</List>

              <div class="grid grid-cols-2 grid-rows-1 b-t b-t-solid b-t-border-regular">
                <button class="c-app-text-accented b-r b-r-solid b-r-border-regular rounded-0 app-text-body-l/regular font-size-[15px] h-11 px-2 flex items-center justify-center"
                  onClick={() => notificationDialog[1](false)}
                >
                  {t('task button-cancel')}
                </button>
                <button class="c-app-text-accented rounded-0 app-text-body-l/regular font-size-[15px] h-11 px-2 flex items-center justify-center"
                  onClick={() => (set(notifications(isFirst()), get(notificationModel)), notificationDialog[1](false))}
                >
                  {t('task button-save')}
                </button>
              </div>
            </Dialog>

            <Dialog dialogParams={cronDialog}
              class="= fixed bg-transparent rounded-2 b-0 p-0 outline-none pb-3 mx-4 w-[calc(100%_-_1rem)] z-100000"
            >
              <List each={repetitionList} skipFilter refactor>
                {(value) => <List.Item simple
                  onClick={(e) => (e.stopPropagation(), cronDialog[1](false), set(props.selectedRepetition, value))}
                  right={
                    <Checkmark class="= fill-tg_button ml-2 opacity-0"
                      classList={{ 'opacity-100': isRepSelected(value) }}
                    />
                  }
                >
                  <span classList={{ 'c-app-text-accented': isRepSelected(value) }}>
                    {t(`task plan-cron repeat-${String(value) as RepetitionType | 'undefined'}`, {
                      'task plan-cron repetition': [value],
                      'task plan-cron repetition-short': [value],
                      'task plan-cron time': [getPlanDateWith(time(), date())],
                      'task plan-cron weekday': [getPlanDateWith(time(), date())],
                      [`task plan-cron ${value}`]: [getPlanDateWith(time(), date())],
                    })}
                  </span>
                </List.Item>}
              </List>
            </Dialog>
          </Portal>
        </div>;
      }}
    >
      {props.children}
    </DatePicker>
  </div>;

  function translateNotifications(notifications: (isFirst: boolean) => Signal<TaskNotification[]>, isFirst: boolean) {
    const array = get(notifications(isFirst));

    if (array.length === 0)
      return t('task-editor none');

    return array.map(translateNotification).join(', ');
  }

  function translateNotification(notification: TaskNotification) {
    if (notification.value === 0) {
      return t('task-editor notification-immediate');
    }

    const result = t('task-editor notification', {
      'task-editor notification-value': [notification.value, { unit: notification.format }],
    });

    return notification.value === 1 && notification.format === 'week'
      ? result.replace(/я$/, 'ю') // monkeypatch this for now
      : result;
  }

  function getPlanDateWith(time: Signal<string>, _date: Signal<Date | null>) {
    const date = get(_date);

    return date && withTime(date, ...get(time).split(':').map(Number));
  }

  function BottomList(_props: { isFirst: boolean; time: Signal<string>; date: Signal<Date | null>; }) {
    let input!: HTMLInputElement;
    return <List refactor class="relative top-0">
      {/* Time */}
      <List.Item
        disabled={!get(_props.date)}
        onClick={() => input.focus()}
        left={<>
          <BigClock class="ui-icon-tertiary" />
          <Show when={isMobile()}>
            <input type="time" ref={input}
              disabled={!get(_props.date)}
              class="opacity-0 absolute top-0 w-100vw bottom-0 z-10 cursor-pointer"
              classList={{
                'cursor-not-allowed': !get(_props.date),
              }}
              pattern="[0-9]{2}\:[0-9]{2}"
              use:model={_props.time}
              value={get(_props.time)}
              onClick={e => e.stopPropagation()}
            />
          </Show>
        </>}

        right={!isMobile() ? <div class="relative flex items-center h-11">
          <input type="time" ref={input}
            disabled={!get(_props.date)}
            class="px-2 relative z-2 h-full w-full cursor-text"
            classList={{
              'cursor-not-allowed': !get(_props.date),
              '[&:not(:focus)]:opacity-0 [&:focus+div>span]:opacity-0': isSafari && !get(_props.time),
            }}
            pattern="[0-9]{2}\:[0-9]{2}"
            use:model={_props.time}
            value={get(_props.time)}
            onClick={e => e.stopPropagation()}
          />

          <div class="bg-app-primary absolute top-0 left--2 right--2 bottom-0 z-1 opacity-30 flex items-center justify-center">
            <Show when={isSafari && !get(_props.time)}>
              <span>--:--</span>
            </Show>
          </div>
        </div> : undefined}

        rightHint={isMobile() ? <>
          <span class="app-text-body-m/regular"
            classList={{ 'mx-2': !get(_props.date) }}
          >
            {get(_props.time) || t('task-editor none')}
          </span>
        </> : undefined}
      >
        {t('task time-info')}
      </List.Item>

      {/* Notifications */}
      <List.Item onClick={() => notificationDialog[1](true)}
        disabled={!get(_props.time)}
        left={<>
          <BigAlarm class="ui-icon-tertiary" />
        </>}

        rightClass="ellipsis flex-shrink flex-[20]"
        rightHint={<>
          <Show when={get(_props.time)}
            fallback={
              <span class="ellipsis max-w-full mx-2 app-text-body-m/regular">
                {tButton('datepicker time')}
              </span>
            }
          >
            <span class="ellipsis max-w-full app-text-body-m/regular">
              {translateNotifications(notifications, _props.isFirst)}
            </span>
          </Show>
        </>}
      >
        {t('task-editor notifications-info')}
      </List.Item>

      {/* Repeat */}
      <Show when={_props.isFirst}>
        <List.Item onClick={() => cronDialog[1](true)}
          left={<BigRepeat class="ui-icon-tertiary" />}
          disabled={!get(_props.time)}

          rightHint={<>
            <Show when={get(_props.time)}
              fallback={
                <span class="ellipsis max-w-full mx-2 app-text-body-m/regular">
                  {tButton('datepicker time')}
                </span>
              }
            >
              <span class="app-text-body-m/regular">
                {t(`task plan-cron repeat-${String(get(props.selectedRepetition)) as RepetitionType | 'undefined'}-short`, {
                  'task plan-cron repetition-short': [get(props.selectedRepetition)],
                  [`task plan-cron ${get(props.selectedRepetition)}`]: [getPlanDateWith(_props.time, _props.date)],
                  // @ts-expect-error wrong lib types
                  'task plan-cron time': [getPlanDateWith(_props.time, _props.date)],
                  'task plan-cron weekday': [getPlanDateWith(_props.time, _props.date)],
                })}
              </span>
            </Show>
          </>}
        >
          {t('task plan-cron-info')}
        </List.Item>
      </Show>
    </List>;
  }
}