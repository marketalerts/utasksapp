import WebApp from 'tma-dev-sdk';
import { useDirectives, model, datemodel } from 'solid-utils/model';
import { createHistorySignal } from 'solid-utils/history';
import { get, set } from 'solid-utils/access';
import { useContext, createRenderEffect, on, createSignal, Show, onCleanup, createMemo, createSelector } from 'solid-js';
import type { Signal } from 'solid-js';
import { A, useParams } from '@solidjs/router';

import { isInElement } from 'shared/platform';
import { TaskPriority, TaskStatus } from 'shared/network/schema';
import { dateToCron } from 'shared/l10n/cron';
import type { RepetitionType } from 'shared/l10n/cron';

import { postTask } from 'f/task/task.network';
import { BaseClientTask, defaultNotifications, TaskType } from 'f/task/task.adapter';
import type { TaskNotification } from 'f/task/task.adapter';
import { attachFiles } from 'f/task/files/network';
import { FilesList, getFormFiles } from 'f/task/editor.ui/files';
import { isDateEqual, isDateInPast, tomorrow, today as getToday, relativeDate, withTime, hasNoTime } from 'f/settings/units/date';
import { SettingsContext } from 'f/settings/settings.context';
import { UsersContext } from 'f/project/users.context';
import type { ClientUser } from 'f/project/users.adapter';
import { ProjectContext, defaultProject } from 'f/project/project.context';
import { isArea, ProjectType } from 'f/project/project.adapter';
import { ProfileContext } from 'f/profile/profile.context';
import { Permissions } from 'f/profile/profile.adapter';
import { GroupTreeContext, createGroupTreeResource } from 'f/group/list.context';

import { t as tTask } from 'locales/task';
import { t } from 'locales/home';
import { t as tButton } from 'locales/create-button';

import { useDialog } from 'shared/ui/use-dialog';
import ProBadge from 'shared/ui/pro-badge';
import { Loader } from 'shared/ui/loader.ui';

import { UserSelect } from 'f/task/user-select.ui';
import { ProjectSelect } from 'f/task/project-select.ui';
import DatesSelect from 'f/task/dates-select.ui';
import { ItemIcon } from 'f/group/explorer-item.ui';
import Priority from '#/task-editor/ui/priority';

import Repeat from 'icons/Repeat.svg';
import Project from 'icons/Project.svg';
import Plus from 'icons/Plus.svg';
import FlagFilled from 'icons/FlagFilled.svg';
import Flag from 'icons/Flag.svg';
import Calendar from 'icons/Calendar.svg';
import Attach from 'icons/Attach.svg';
import ArrowRight from 'icons/ArrowRight.svg';
import NotSet from 'icons/24/Priority/Not set.svg';

import './create-task.css';

export default function CreateTask(props: {
  onCreate?(): void;
  isOpen?: Signal<boolean>;
  showLimitHint?: boolean;
}) {
  useDirectives(model, datemodel);

  // TODO: refactor this logic
  const isOpen = props.isOpen ?? createSignal(false);

  const params = useParams();

  const applyDelta = relativeDate(params.projectId === 'g_tom' ? 1 : 0);
  const initialDate = () => applyDelta(getToday());

  const [initialProject] = useContext(ProjectContext);
  const [settings] = useContext(SettingsContext);
  const groupTree = useContext(GroupTreeContext) ?? createGroupTreeResource();

  // TODO: refactor this logic - use a forms library?
  const title = createHistorySignal('');
  const priority = createHistorySignal(TaskPriority.None);
  const assignees = createHistorySignal<ClientUser[]>([]);
  const dueDate = createHistorySignal<Date | null>(null);
  const planDate = createHistorySignal<Date | null>(initialDate());
  const planCron = createHistorySignal<string>();
  const selectedRepetition = createHistorySignal<RepetitionType>();
  const project = createHistorySignal(detectInitialProject());
  const planDateNotifications = createSignal<TaskNotification[]>(defaultNotifications, { equals: () => false });
  const dueDateNotifications = createSignal<TaskNotification[]>(defaultNotifications, { equals: () => false });

  createRenderEffect(on(() => settings.latest, () => {
    planDate.reset(initialDate());
    planCron.reset();
    selectedRepetition.reset();
  }));

  createRenderEffect(on(() => [initialProject.latest, groupTree[0].latest], () => {
    project.reset(detectInitialProject());
    assignees.reset();
  }));

  createRenderEffect(on(() => get(project), () => {
    assignees.reset();
  }));

  const resetFormData = () => {
    title.reset();
    priority.reset();
    planDate.reset(initialDate());
    planCron.reset();
    selectedRepetition.reset();
    dueDate.reset();
    project.reset(detectInitialProject());
    assignees.reset();
    set(planDateNotifications, defaultNotifications);
    set(dueDateNotifications, defaultNotifications);
    const form = formData[0]();
    form.forEach((_, key) => form.delete(key));
    set(formData, new FormData());
    set(isRequestSuccessful, undefined);
  };

  const requestProgress = createSignal(0);
  const isRequestSuccessful = createSignal<boolean>();

  createRenderEffect(() => {
    if (requestProgress[0]()) {
      WebApp.enableClosingConfirmation();
    } else {
      WebApp.disableClosingConfirmation();
    }
  });

  const isTitleEmpty = () => get(title).trim().length === 0;
  const isFormDisabled = () => isTitleEmpty() || !!get(requestProgress) || (
    get(project).type !== ProjectType.Dynamic && !taskLimit().canUse(get(project).count)
  );

  let taskTitle!: HTMLInputElement;

  const submitTask = async (e: Event & { currentTarget: HTMLElement; }) => {
    e.preventDefault();

    if (isFormDisabled()) {
      e.currentTarget.querySelector('input')?.focus();
      WebApp.HapticFeedback.notificationOccurred('error');
      return;
    }

    try {
      set(requestProgress, 0.1);

      const task = await postTask(BaseClientTask.fromRaw({
        title: get(title),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        planDate: (get(planCron) && get(planDate)) ? withTime(get(planDate)!) : get(planDate),
        planCron: get(selectedRepetition) ? get(planCron) : undefined,
        dueDate: get(dueDate),
        coassignees: get(assignees),
        type: TaskType.Task,
        description: undefined,
        status: TaskStatus.New,
        priority: get(priority),
        subtasks: [],

        planDateNotifications: get(planDateNotifications),
        dueDateNotifications: get(dueDateNotifications),
      }), get(project)?.id);

      if (task && getFormFiles(get(formData)).length > 0) {
        const [response, abort] = await attachFiles(task.id, get(formData), (progress) => {
          set(requestProgress, progress);
        }, task.lastMessageId);

        await response;
      }

      props.onCreate?.();

      set(isRequestSuccessful, true);
      WebApp.HapticFeedback.notificationOccurred('success');
      groupTree[1].refetch();
    } catch (e) {
      set(isRequestSuccessful, false);

      try {
        WebApp.HapticFeedback.notificationOccurred('error');
        WebApp.showPopup({
          title: 'Error creating the task!',
          message: JSON.stringify(e),
        });
      } catch {
        console.error(e);
      }
    } finally {
      setTimeout(() => {
        const isSuccess = get(isRequestSuccessful);

        set(requestProgress, 0);
        set(isRequestSuccessful, undefined);

        if (isSuccess) {
          resetFormData();
        }

        setTimeout(() => {
          openedRecently = false;
          defocus();
        });
      }, 500);
    }
  };

  const [profile] = useContext(ProfileContext);

  let taskForm!: HTMLFormElement;
  let openedRecently = true;

  const defocus = () => requestAnimationFrame(() => {
    if (openedRecently) {
      return;
    }

    taskTitle.blur();
    set(isOpen, false);
    window.removeEventListener('scroll', defocus);
  });

  createRenderEffect(() => {
    if (get(isOpen)) {
      WebApp.HapticFeedback.selectionChanged();
    } else {
      window.removeEventListener('scroll', defocus);
    }
  });

  onCleanup(() => {
    window.removeEventListener('scroll', defocus);
  });

  const onTitleInputFocus = () => {
    const rect = taskTitle.getBoundingClientRect();

    set(isOpen, true);
    openedRecently = true;

    let scrollY = Math.min(rect.top - 16 + window.screenY, window.scrollY);

    setTimeout(() => {
      window.scrollTo({ top: scrollY, behavior: 'smooth' });

      const interval = setInterval(() => requestAnimationFrame(() => {
        if (scrollY === window.scrollY) {
          window.addEventListener('scroll', defocus);

          clearInterval(interval);
        }

        scrollY = window.scrollY;
      }), 33);
    }, 350);

    setTimeout(() => {
      openedRecently = false;
    }, 1000);
  };

  const transitionOpen = createSignal(false);

  createRenderEffect(on(() => get(isOpen), () => {
    setTimeout(() => {
      set(transitionOpen, get(isOpen));
    }, 200);
  }));

  const assigneeLimit = createMemo(() => profile.latest.getPermission(Permissions.TaskAssigneeLimit, false));

  const cronDialog = useDialog('modal');

  const repetitionList = [undefined, 'year', 'month', 'weekday', 'day'] satisfies (RepetitionType | undefined)[];

  const isRepSelected = createSelector(selectedRepetition[0]);

  createRenderEffect(on(() => get(dueDate), date => {
    if (dueDate.canUndo()) {
      set(isOpen, true);
      setTimeout(() => {
        taskTitle?.focus();
      });
    }
  }));

  createRenderEffect(on(() => get(planDate), date => {
    if (!date || hasNoTime(date)) {
      set(selectedRepetition, undefined);
      set(planCron, undefined);
    }

    if (date && get(selectedRepetition)) {
      set(planCron, dateToCron(date, get(selectedRepetition)));
    }

    if (planDate.canUndo()) {
      set(isOpen, true);
      setTimeout(() => {
        taskTitle?.focus();
      });
    }
  }));

  const formData = createSignal(new FormData());
  const maxFileSize = () => profile.latest?.getPermission(Permissions.FileSize, true);
  const maxFileAmount = () => profile.latest?.getPermission(Permissions.FilesAmount, true);

  const dateDialog = useDialog('modal');

  return <>
    <form ref={taskForm} class="=
        relative bg-tg_bg rounded-3 h-11 min-h-11
        focus:(h-33 shadow-card) focus-within:(h-33 shadow-card) [&:focus-within>div>svg.plus]:(w-0 ltr:mr-0 rtl:ml-0)
        100-app-transition-height,box-shadow overflow-hidden shadow-none
      "
      id="create-task"
      classList={{ 'h-33 shadow-card!': get(isOpen) || !!get(requestProgress) }}
      // onMouseDown={e => !e.currentTarget.id.startsWith('create') && taskTitle.focus()}
      onFocusOut={(e) => !isInElement(e.relatedTarget as HTMLElement, e.currentTarget) && set(isOpen, false)}
      onFocusIn={() => set(isOpen, true)}
      onClick={() => !get(requestProgress) && taskTitle.focus()}
      onSubmit={submitTask}
    >
      <div class="= flex items-center px-4 h-11 w-full">
        <Plus class="= plus ui-icon-tertiary min-h-7.4 min-w-7.4 ltr:mr-4 rtl:ml-4 100-app-transition-width,margin"
          classList={{ 'min-w-0! w-0! ltr:mr-0! rtl:ml-0!': get(isOpen) || !!get(requestProgress) || get(title).length > 0 }}
          onClick={() => set(isOpen, true)}
        />
        <input class="= flex-grow p-0 py-2.5 placeholder:c-tg_hint app-text-subheadline"
          ref={el => {
            taskTitle = el;
          }}
          id="create-task-input"
          placeholder={t('new-task-quick input-title')}
          use:model={title}
          enterkeyhint="send"
          autocomplete="off"
          inputmode="text"
          type="search"
          aria-autocomplete="none"
          onFocus={onTitleInputFocus}
          disabled={!!get(requestProgress)}
        />
        <Show when={props.showLimitHint && taskLimit().limit && get(project).count && get(project).type !== ProjectType.Dynamic}>
          <span class="= ltr:text-right rtl:text-left mx-0 100-app-transition-margin app-text-footnote c-tg_hint"
            classList={{ 'ltr:mr-9 rtl:ml-9': get(title).length > 0 && !get(isOpen) && !get(requestProgress) }}
          >{get(project).count}/{taskLimit().limit}</span>
        </Show>
      </div>
      <div class="= flex items-center w-full px-4 justify-between">
        <div class="= flex items-center h-11 gap-2">
          <DatesSelect
            canUseDueDate={canUseDueDate}
            dueDate={dueDate}
            dueDateNotifications={dueDateNotifications}
            planDate={planDate}
            planDateNotifications={planDateNotifications}
            selectedRepetition={selectedRepetition}
          >{open =>
            <div class="= flex items-center gap-3">
              <div class="= flex gap-1 items-center"
                onClick={() => open('start')}
              >
                <Calendar
                  classList={{
                    'fill-urgent!': planDate.canUndo() && isDateInPast(get(planDate)),
                    'fill-tg_button': planDate.canUndo() && !isDateInPast(get(planDate)),
                    'fill-tg_hint': !planDate.canUndo(),
                  }}
                />
                <span class="app-text-subtitle ellipsis"
                  classList={{
                    'c-urgent': planDate.canUndo() && isDateInPast(get(planDate)),
                    'c-tg_button': planDate.canUndo() && !isDateInPast(get(planDate)),
                    'c-tg_hint': !planDate.canUndo(),
                  }}
                >
                  {hasNoTime(get(planDate))
                    ? tButton('new-task input-date', { date: get(planDate) ?? '' })
                    : tButton('new-task input-date-time', { date: get(planDate) ?? '' })}
                </span>
              </div>

              <span class="= inline-flex items-center"
                onClick={() => open('start')}
              >
                <Repeat
                  class="= mx-1 cursor-pointer"
                  classList={{
                    'fill-tg_button': !!get(selectedRepetition),
                    'ui-icon-tertiary': !get(selectedRepetition),
                  }}
                />

                <span class="= app-text-subtitle ml--2"
                  classList={{
                    'c-tg_button': selectedRepetition.canUndo(),
                    'c-tg_hint': !selectedRepetition.canUndo(),
                  }}
                >
                  {tTask('task plan-cron repetition-shortest', get(selectedRepetition))}
                </span>
              </span>
              <span onClick={() => open('end')}>
                <Show when={canUseDueDate()}>
                  <Show when={get(dueDate)} fallback={<Flag class="ui-icon-tertiary"/>}>
                    <FlagFilled
                      classList={{
                        'fill-urgent!': (
                          isDateEqual(get(dueDate), getToday())
                          || isDateInPast(get(dueDate))
                          || isDateInPast(getToday(), get(dueDate) ?? tomorrow())
                        ),
                      }}
                    />
                  </Show>
                </Show>
              </span>
            </div>
          }</DatesSelect>

          <div />
          <Show when={canUseFiles()}>
            <FilesList simple
              formData={formData[0]()}
              limit={maxFileAmount().limit}
              maxSize={maxFileSize().limit}
            />
          </Show>

          <Show when={canUsePriority()}>
            <Priority model={priority}
              class="scale-90 mt--0.5"
            />
          </Show>
        </div>
        <Show when={!profile.latest.isPro}>
          <A href="/subscribe" class="=create-task-subscribe-link flex items-center rounded-2 b-solid b-1 b-border-regular px-2 py-1 gap-4 ellipsis">
            <div class="= flex items-center gap-2">
              <Flag class="ui-icon-tertiary" />
              <Attach class="ui-icon-tertiary" />
              <NotSet class="ui-icon-tertiary" />
            </div>
            <ProBadge />
          </A>
        </Show>
      </div>
      <div class="= flex items-center justify-between px-4 w-full max-w-full h-11 b-t-1 b-t-solid b-t-tg_bg_secondary gap-2">
        <div class="= flex items-center gap-2 overflow-hidden ltr:pr-3 rtl:pl-3">
          <ProjectSelect neutralText project={project}
            icon={
              <Project class="= min-w-5 h-5" classList={{ 'fill-tg_button': project.canUndo(), 'ui-icon-tertiary': !project.canUndo() }} />
            }
          />
          <UsersContext.Provider value={undefined}>
            <Show when={get(project).type === ProjectType.Public}>
              <UserSelect buttonText={t('new-task-quick assignee')}
                users={assignees} hideName
                title={t('new-task-quick assignee')}
                limit={assigneeLimit().limit ?? undefined}
                projectId={get(project)?.id}
                projectIcon={<ItemIcon fallback={get(project).name} url={get(project).icon} />}
                icon={
                  <div class="= rounded-full b-dashed b-tg_hint b-1">
                    <Plus class="ui-icon-tertiary h-7.4" />
                  </div>
                }
              />
            </Show>
          </UsersContext.Provider>
        </div>
        <button type="submit" class="= relative rounded-full flex items-center relative bottom-0.125 p-0.5"
          id="create-task-submit"
          disabled={isFormDisabled()}
          classList={{
            'bg-tg_button!': !isFormDisabled(),
            'bg-tg_hint!': isFormDisabled(),
            'absolute! bottom-2! ltr:right-4 rtl:left-4': get(title).length > 0,
          }}
          onMouseDown={e => e.preventDefault()}
        >
          <Show when={!!get(requestProgress)}>
            <Loader class="= [&_svg]:(opacity-100! fill-tg_button) absolute z-2 scale-120 top--0.5 left--0.5" />
          </Show>
          <ArrowRight id="create-icon" class="= rtl:rotate-180"/>
        </button>
        <Show when={get(title).length > 0}>
          <div class="= w-8"></div>
        </Show>
        <Show when={!!get(requestProgress) && getFormFiles(get(formData)).length > 0}>
          <div role="status" class="= absolute left-0 h-0.5 bottom-0 pointer-events-none z-4 bg-tg_button"
            style={{ 'width': get(requestProgress) + '%' }}
          />
        </Show>
      </div>
    </form>
  </>;

  function detectInitialProject() {
    return initialProject.latest?.type === ProjectType.Dynamic
      ? isArea(initialProject.latest) ? getAreaRelatedProject() ?? defaultProject : defaultProject
      : initialProject.latest;
  }

  function getAreaRelatedProject() {
    const areas = groupTree[0].latest.areas;
    const area = areas.find(a => a.id === initialProject.latest.id);
    return area?.items[0];
  }

  function canUseFiles(): boolean | null | undefined {
    return profile.latest.canUse(Permissions.FilesAmount);
  }

  function canUsePriority(): boolean | null | undefined {
    return profile.latest.canUse(Permissions.Priority);
  }

  function canUseDueDate() {
    return profile.latest.canUse(Permissions.DueDate);
  }

  function taskLimit() {
    return isProjectPrivate()
      ? profile.latest.getPermission(Permissions.PrivateProjectTaskCount, true)
      : profile.latest.getPermission(Permissions.PublicProjectTaskCount, true);
  }

  function isProjectPrivate() {
    return get(project).type === ProjectType.Private;
  }

  function getPlanDateWith(time: Signal<string>, _date: Signal<Date | null> = planDate) {
    const date = get(_date);

    return date && withTime(date, ...get(time).split(':').map(Number));
  }
}
