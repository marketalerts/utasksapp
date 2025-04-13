import WebApp from 'tma-dev-sdk';
import { model, useDirectives } from 'solid-utils/model';
import { get, set } from 'solid-utils/access';
import { Show, createEffect, createResource, createSignal, on, useContext, createContext, Suspense, createRoot, Match, Switch } from 'solid-js';
import type { ComponentProps, Signal } from 'solid-js';
import Clock from 'i/interactive/Clock';
import { A } from '@solidjs/router';

import { isMac } from 'shared/platform';
import { detectRepeats } from 'shared/l10n/cron';
import { getConfigNumber } from 'shared/firebase';
import { useHorisontalDragSnap } from 'shared/draggable';

import { completeTask, deleteTask, uncompleteTask } from 'f/task/task.network';
import { TaskType, toTaskHref } from 'f/task/task.adapter';
import type { ClientTask } from 'f/task/task.adapter';
import { afterTomorrow, hasNoTime, hasTime, isDateInPast } from 'f/settings/units/date';
import { ClientUser } from 'f/project/users.adapter';
import { ProjectContext, defaultProject } from 'f/project/project.context';
import { ProjectType } from 'f/project/project.adapter';

import { t } from './locales';

import { InitialsAvatar, InitialsAvatars } from 'shared/ui/initials-avatar';
import Checkbox from 'shared/ui/checkbox';

import ShortRepeat from '#/task/ui/ShortRepeat';

import Telegram from 'icons/list/Telegram.png';
import Trash from 'icons/Trash.svg';
import RepeatSM from 'icons/RepeatSM.svg';
import FlagSmall from 'icons/FlagFilledSM.svg';
import ChevronCheck from 'icons/ChevronCheck.svg';
import Attach from 'icons/Attach.svg';
import Reminder from 'icons/16/Remind Outlined.svg';


interface TaskRowProps {
  task: ClientTask;
  boldText?: boolean;
  privateTask?: boolean;
  showTomorrowTime?: boolean;
  showProject?: boolean;
  onCompleted?: (task: ClientTask) => Promise<unknown>;
  onDeleted?: (task: ClientTask) => void;
  deletePendingId: Signal<string>;
  isUserAdmin: boolean;
}

export default function TaskRow(props: TaskRowProps) {
  const snapped = createSignal<boolean | undefined>(false);
  const disabled = createSignal(false);

  const isDeleteDisabled = () => (
    props.task.author.userId !== WebApp.initDataUnsafe.user?.id && !props.isUserAdmin
  );

  const onDelete = () => {
    set(disabled, true);

    deleteTask(props.task.id).then(() => {
      props.onDeleted?.(props.task);
      WebApp.HapticFeedback.impactOccurred('light');
    });
  };

  createEffect(on(() => get(snapped), (newSnapped, oldSnapped) => {
    if (newSnapped === oldSnapped) {
      return;
    }

    if (newSnapped) {
      set(props.deletePendingId, props.task.id);

      WebApp.HapticFeedback.impactOccurred('soft');
    } else {
      WebApp.HapticFeedback.selectionChanged();
    }
  }, { defer: true }));

  createEffect(() => {
    if (get(props.deletePendingId) !== props.task.id) {
      set(snapped, undefined);
    }
  });

  return <li class="=task-list-item relative ltr:ml-10 rtl:mr-10 [&:last-child_[border-container]]:hidden">
    <TaskRowDraggable {...props}
      class="= relative h-full ltr:pl-3 rtl:pr-3 pt-3 ltr:ml--10 rtl:mr--10 z-2 bg-tg_bg"
      style={{ width: 'calc(100% + 1rem)' }}
      snapped={snapped}
      disabled={get(disabled)}
    />

    <button class="=delete-task absolute ltr:right-0 rtl:left-0 bottom-0 top-0 w-11 bg-tg_hint z-1 my-[1px] rounded-0"
      classList={{
        'bg-urgent!': get(snapped) && !get(disabled) && !isDeleteDisabled(),
        'mt-[0px]!': get(snapped),
      }}
      disabled={!get(snapped) || get(disabled) || isDeleteDisabled()}
      onClick={onDelete}
    >
      <Trash class="= fill-white"/>
    </button>

    <div border-container class="= absolute bottom-0 ltr:right--2 rtl:left--2 bg-border-regular h-[1px] w-full z-2"></div>
  </li>;
}

export function TaskRowDraggable(props: TaskRowProps & ComponentProps<'div'> & {
  snapped: Signal<boolean | undefined>;
  disabled?: boolean;
}) {
  const textDirection = document.body.parentElement?.getAttribute('dir') ?? 'ltr';

  const dir = textDirection === 'rtl' ? -1 : 1;

  const minTransform = dir < 0 ? 0 : -42;
  const maxTransform = dir < 0 ? 42 : 0;
  const snapThresholdMin = dir < 0 ? 4 : -40;
  const snapThresholdMax = dir < 0 ? 40 : -4;

  const [draggable, createDragableProps,, [, setPosition]] = useHorisontalDragSnap({
    snapped: props.snapped,
    disabled: () => props.task.isCompleted,
    minTransform,
    maxTransform,
    snapThresholdMin,
    snapThresholdMax,
  });

  useDirectives(model, draggable);

  const isChecked = createSignal(props.task.isCompleted);
  const isTaskCompleting = createSignal(false);
  const planDate = props.task.planDate;
  const dueDate = props.task.dueDate;
  const planDateNotifications = props.task.planDateNotifications;
  const dueDateNotifications = props.task.dueDateNotifications;

  const setTaskCompletionFailed = () => {
    set(isChecked, false);
    WebApp.HapticFeedback.notificationOccurred('error');
  };

  let timeoutHandle: number;

  // TODO: refactor this
  const submitTaskComplete = (e: MouseEvent) => {
    e.stopPropagation();

    if (get(isTaskCompleting)) {
      return;
    }

    clearTimeout(timeoutHandle);

    Promise.all([
      getConfigNumber(
        get(isChecked)
        ? 'taskuncomplete_send_delay'
        : 'taskcomplete_send_delay',
      ),
      getConfigNumber(
        get(isChecked)
        ? 'taskuncomplete_refetch_delay'
        : 'taskcomplete_refetch_delay',
      ),
    ] as const).then(([sendDelay, refetchDelay]) => {
      timeoutHandle = window.setTimeout(() => {
        if (get(isChecked) === props.task.isCompleted) {
          return;
        }

        set(isTaskCompleting, true);

        const result = !get(isChecked)
          ? uncompleteTask(props.task.id)
          : completeTask(props.task.id);

        result.then((r) => {
          if (r.error) {
            setTaskCompletionFailed();
          }

          setTimeout(() => {
            props.onCompleted?.(props.task)
              .then(() => {
                set(isTaskCompleting, false);
              });
          }, refetchDelay);
        })
        .catch(() => {
          setTaskCompletionFailed();
        });
      }, sendDelay);
    });
  };

  const toggleDragSnap = () => {
    set(props.snapped, !get(props.snapped));
    setPosition({ x: get(props.snapped) ? minTransform < 0 ? minTransform : maxTransform : 0, y: 0 });
  };

  const [source] = useContext(ProjectContext);

  const taskHref = () => toTaskHref(props.task, source.latest);

  return <>
    <div
      use:draggable={createDragableProps()}
      class="= draggable flex min-h-6 items-start gap-2 app-transition-transform"
      style={{ transform: 'translate3d(0, 0, 0)' }}
      classList={{
        [String(props.class)]: !!props.class,
        '[&_*]:c-tg_hint!': isGray(),
      }}
      onContextMenu={e => (e.preventDefault(), toggleDragSnap())}
    >
      <Switch>
        <Match when={isObserver()}>
          <A href={props.task.id} class="= relative">
            <Checkbox id={`task-${props.task.id}`}
              class="= min-w-8 h-8 ltr:ml--1 rtl:mr--1 mt--1.5"
              priority={props.task.priority}
              disabled />
            <ChevronCheck class="absolute ui-icon-tertiary opacity-50 top-1.5 ltr:left-2.5 rtl:right-2.5" />
          </A>
        </Match>
        <Match when={props.task.type === TaskType.Meet}>
          <Clock time={planDate ?? dueDate} class="= min-w-8 h-8 fill-tg_hint stroke-tg_hint ltr:mr-2 rtl:ml-2" />
        </Match>
        <Match when={props.task.type !== TaskType.Meet}>
          <Checkbox model={isChecked} id={`task-${props.task.id}`}
            class="= min-w-8 h-8 ltr:ml--1 rtl:mr--1 mt--1.5"
            isGray={isGray()}
            disabled={isCheckboxDisabled()}
            priority={props.task.priority}
            onClick={submitTaskComplete} />
        </Match>
      </Switch>

      <div class="= ltr:pr-3 rtl:pl-3 pb-2 flex min-h-6 items-top flex-grow">
        <A href={taskHref()}
          class="=task-link flex-grow flex items-center"
          id={`task-data-${props.task.id}`}
        >
          <div class="= grid overflow-hidden gap-1">
            <p title={props.task.author?.userName && `by @${props.task.author.userName}`}
              class="=task-list-item-title m-0 ltr:pr-1.5 rtl:pl-1.5 app-text-subheadline max-h-10 text-ellipsis overflow-hidden"
              style="display: -webkit-box;-webkit-line-clamp: 2;-webkit-box-orient: vertical;"
              classList={{
                'font-semibold!': props.boldText,
                'c-tg_hint': get(isTaskCompleting) || props.task.isCompleted || isObserver(),
              }}
            >
              {props.task.title}
            </p>
            <div class="= inline-flex items-center gap-2 overflow-hidden">
              <Show when={planDate && !(props.task.endDate && props.task.isCompleted)}>
                <Show when={hasTime(planDate) && (planDateNotifications.length || dueDateNotifications.length)}>
                  <Reminder class="ui-icon-accented"
                    classList={{
                      'ui-icon-negative': isDateInPast(planDate),
                      'mb-[-1px]': !isMac(),
                    }}
                  />
                </Show>
                <span class="=task-list-item-date app-text-caption-one-regular capitalize text-nowrap text-right overflow-hidden text-ellipsis"
                  classList={get(isTaskCompleting) || props.task.isCompleted ? {
                    'c-tg_hint': true,
                  } : {
                    'c-urgent!': isDateInPast(planDate),
                    'c-text-accented': !isDateInPast(planDate),
                  }}
                >
                  {t('task plan-date', { date: planDate },
                      hasNoTime(planDate) ? {
                          hour: undefined,
                          minute: undefined,
                      } : {},
                    )}
                </span>
                <Show when={props.task.planCron}>
                  <ShortRepeat cron={props.task.planCron} text={cron => t('task plan-cron repetition-shortest', cron)}
                    iconClass={get(isTaskCompleting) || props.task.isCompleted ? {
                      'ui-icon-tertiary': true,
                    } : {
                      'ui-icon-negative!': isDateInPast(planDate),
                      'ui-icon-accented!': !isDateInPast(planDate),
                    }}
                    textClass={get(isTaskCompleting) || props.task.isCompleted ? {
                      'c-text-tertiary': true,
                    } : {
                      'c-text-negative!': isDateInPast(planDate),
                      'c-text-accented': !isDateInPast(planDate),
                    }}
                    small
                  />
                </Show>
              </Show>
              <Show when={props.task.endDate && props.task.isCompleted}>
                <span class="=task-list-item-end-date app-text-caption-one-regular capitalize text-nowrap text-right c-tg_hint overflow-hidden text-ellipsis">
                  {t('task plan-date', { date: props.task.endDate },
                      hasNoTime(props.task.endDate) ? {
                          hour: undefined,
                          minute: undefined,
                      } : {},
                    )}
                </span>
              </Show>
              <Show when={dueDate && !props.task.isCompleted}>
                <span class="=task-list-item-due-date app-text-caption-one-regular capitalize c-tg_hint text-nowrap overflow-hidden text-ellipsis"
                  classList={{
                    'c-urgent!': isDateInPast(dueDate, afterTomorrow()),
                  }}
                >
                  <FlagSmall class="= fill-tg_hint inline-block overflow-initial mt--1 ltr:mr-1 rtl:ml-1"
                    classList={{
                      'fill-urgent!': isDateInPast(dueDate, afterTomorrow()),
                    }}
                  />
                  {t('task due-date', { date: dueDate },
                    hasNoTime(dueDate) ? {
                      hour: undefined,
                      minute: undefined,
                    } : {},
                  )}
                </span>
              </Show>
              <Show when={props.task.filesCount}>
                <div class="= flex items-center">
                  <Attach class="= fill-tg_hint" />

                  <p class="=task-list-item-files m-0 app-text-caption-regular rounded-2 p-1 px-1.5 bg-tg_bg_secondary c-tg_text">
                    {props.task.filesCount}
                  </p>
                </div>
              </Show>
            </div>
            <Show when={props.showProject}>
              <p class="=task-list-item-project m-0 app-text-caption-one-regular c-tg_hint mt--1">{(props.task.project ?? defaultProject).name}</p>
            </Show>
          </div>
        </A>
        <div class="= mt--1">
          <TaskSubtext users={props.task.coassignees ?? []} />
        </div>
      </div>
    </div>
  </>;

  function isObserver() {
    const currentUserId = WebApp.initDataUnsafe.user?.id;

    if (!currentUserId) {
      return true;
    }

    const { coassignees, author } = props.task;
    const taskRelatedUsers = [...coassignees, author]
      .filter((a): a is ClientUser => typeof a !== 'undefined');

    return !taskRelatedUsers.some(a => a.userId === currentUserId);
  }

  function isCheckboxDisabled(): boolean | undefined {
    return !props.task.isCompleted && (!props.task.completable/*  ?? (hasDifferentAssignee() || get(isTaskCompleting)) */);
  }

  function isGray(): boolean | undefined {
    return props.disabled
      || get(isTaskCompleting)
      || props.task.isCompleted
      || (get(isChecked) && !timeoutHandle && get(isChecked) !== props.task.isCompleted);
  }

  function TaskSubtext(_props: { users: ClientUser[] }) {
    const [assigneeDisplay] = useContext(DisplayAssignee);

    const contact = new ClientUser({
      title: 'Telegram Contact',
      userName: 'Telegram Contact',
    });

    contact.avatar = Telegram;

    return <Show when={props.task.project?.type !== ProjectType.Private}>
      <Show when={props.task.author.userId === WebApp.initDataUnsafe.user?.id}
        fallback={<InitialsAvatar user={props.task.author} small />}
      >
        <Show when={_props.users.length > 0 || !props.task.fromInline}
          fallback={<InitialsAvatars users={[contact]} small />}
        >
          <Suspense fallback={<InitialsAvatars users={_props.users} small />}>
            <InitialsAvatars users={_props.users} {...assigneeDisplay.latest} small />
          </Suspense>
        </Show>
      </Show>
    </Show>;
  }
}

const DisplayAssignee = createContext(createRoot(() => createResource(
  () => Promise.all([
    getConfigNumber('display_assignee_limit'),
    getConfigNumber('display_assignee_width'),
  ]).then(([limit, width]) => ({ limit, width })),
  {
    initialValue: {
      limit: 3,
      width: 2,
    },
  },
)));
