import WebApp from 'tma-dev-sdk';
import { model, useDirectives } from 'solid-utils/model';
import { createHistorySignal } from 'solid-utils/history';
import { get, set } from 'solid-utils/access';
import { createStore } from 'solid-js/store';
import { For, Show, Suspense, batch, createEffect, createMemo, createRenderEffect, createSignal, createUniqueId, getOwner, on, onCleanup, onMount, runWithOwner, useContext } from 'solid-js';
import type { ParentProps, Signal } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';
import { MultiProvider } from '@solid-primitives/context';

import { getMessageLink, isInline, isMac, isMobile } from 'shared/platform';
import { parallel } from 'shared/network/utils';
import { TaskPriority, TaskStatus } from 'shared/network/schema';
import { resolvedBackendUrl } from 'shared/network/base-client';
import { memoize } from 'shared/memoize';
import { dateToCron, detectRepeats } from 'shared/l10n/cron';
import type { RepetitionType } from 'shared/l10n/cron';

import { deleteTask, uncompleteTask, completeTask, postToChat } from 'f/task/task.network';
import { BaseClientTask, defaultNotifications, FullClientTask, TaskType } from 'f/task/task.adapter';
import type { TaskNotification } from 'f/task/task.adapter';
import { hasNoTime, hasTime, isDateInPast, today, tomorrow, withTime } from 'f/settings/units/date';
import { UsersContext, createUsersResource } from 'f/project/users.context';
import { ClientUser, ClientUserStatus } from 'f/project/users.adapter';
import { ProjectContext, defaultProject } from 'f/project/project.context';
import { isArea, ProjectType } from 'f/project/project.adapter';
import type { ClientItem } from 'f/project/project.adapter';
import { ProfileContext } from 'f/profile/profile.context';
import { Permissions } from 'f/profile/profile.adapter';
import { createGroupTreeResource, GroupTreeContext } from 'f/group/list.context';
import { Subtask } from '#/task-editor/subtasks/definitions';

import { FullTaskContext } from '../task.context';
import { PreviewContext } from '../files/preview/context';
import type { FilePreviewController } from '../files/preview/context';
import PreviewHost from '../files/preview';
import { attachFiles, deleteFiles } from '../files/network';
import { ClientTaskFile } from '../files/adapter';
import type { DisplayableFile } from '../files/adapter';
import DatesSelect from '../dates-select.ui';

import { HistoryList } from './history';
import { FilesList, formFieldName, getFormFiles } from './files';

import { t } from 'locales/task';

import { useDialog } from 'shared/ui/use-dialog';
import { MainButton } from 'shared/ui/telegram';
import ProBadge from 'shared/ui/pro-badge';
import { Loader } from 'shared/ui/loader.ui';
import ListArrow from 'shared/ui/list-arrow';
import List from 'shared/ui/list';
import { InitialsAvatar } from 'shared/ui/initials-avatar';
import Checkbox from 'shared/ui/checkbox';

import { UserSelect } from 'f/task/user-select.ui';
import { ProjectSelect } from 'f/task/project-select.ui';
import { ItemIcon } from 'f/group/explorer-item.ui';
import TopCard from '#/task-editor/ui/form/top-card';
import TaskHeader, { ProjectSelector } from '#/task-editor/ui/form/task-header';
import ShortRepeat from '#/task/ui/ShortRepeat';

import Telegram from 'icons/list/Telegram.png';
import Trash from 'icons/Trash.svg';
import ReporterOutlined from 'icons/ReporterOutlined.svg';
import FlagSM from 'icons/FlagFilledSM.svg';
import ChevronCheck from 'icons/ChevronCheck.svg';
import Checkmark from 'icons/Checkmark.svg';
import Chat from 'icons/Chat.svg';
import AssigneeOutlined from 'icons/AssigneeOutlined.svg';
import CalendarAdd from 'icons/24/Calendar Add Outlined.svg';
import Clock from 'icons/16/Remind Outlined.svg';

export interface CreateTaskProps {
  task?: undefined;
  setTask(task: BaseClientTask, projectId?: string): Promise<readonly [() => void, undefined | FullClientTask]>;
}

export interface EditTaskProps {
  task: FullClientTask;
  setTask(task: FullClientTask, local?: boolean): Promise<readonly [() => void, undefined | FullClientTask]>;
}

export default function TaskEditor(props: CreateTaskProps | EditTaskProps) {
  onMount(() => {
    //setFrameColor('secondary_bg_color');
  });

  useDirectives(model);

  const groupTree = useContext(GroupTreeContext) ?? createGroupTreeResource();

  const lineHeight = 1.25 * 16;
  // 6 subheadline text lines
  const minSetDescriptionHeight = lineHeight * 6;

  const [source] = useContext(ProjectContext);

  const title = createHistorySignal('');
  const description = createHistorySignal('');
  const status = createHistorySignal<TaskStatus>(TaskStatus.New);
  const priority = createHistorySignal<TaskPriority>(TaskPriority.None);
  const isCompleted = createHistorySignal(false);
  const dueDate = createHistorySignal<Date | null>(null);
  const planDate = createHistorySignal<Date | null>(null);
  const planCron = createHistorySignal<string>();
  const files = createHistorySignal<ClientTaskFile[]>([]);
  const selectedRepetition = createHistorySignal<RepetitionType>();
  const assignees = createHistorySignal<ClientUser[]>([]);
  const planDateNotifications = createSignal<TaskNotification[]>(defaultNotifications, { equals: () => false });
  const dueDateNotifications = createSignal<TaskNotification[]>(defaultNotifications, { equals: () => false });
  const author = createHistorySignal<ClientUser[]>([]);
  const project = createHistorySignal<ClientItem>(
    detectInitialProject(),
  );

  const subtasks = createStore<Subtask[]>([new Subtask()]);

  function detectInitialProject() {
    return source.latest?.type === ProjectType.Dynamic
      ? isArea(source.latest) ? getAreaRelatedProject() ?? defaultProject : defaultProject
      : source.latest;
  }

  function getAreaRelatedProject() {
    const areas = groupTree[0].latest.areas;
    const area = areas.find(a => a.id === source.latest.id);
    return area?.items[0];
  }

  const contact = new ClientUser({
    title: 'Telegram Contact',
    userName: 'Telegram Contact',
  });

  contact.avatar = Telegram;

  const currentContact = createHistorySignal<ClientUser[]>([contact]);

  const selectedProjectUsers = createUsersResource(
    () => get(project).type === ProjectType.Public ? get(project).id : undefined,
    useContext(UsersContext)?.[0],
  );

  const [currentProjectUsers] = useContext(UsersContext) ?? [];

  const hasCompletedTask = memoize(
    (assignee?: ClientUser) => props.task?.completedUsers?.includes(assignee?.userId ?? -1),
    (assignee?: ClientUser) => assignee?.userId ?? assignee?.title ?? createUniqueId(),
  );

  const hasSomeCompletedUsers = createMemo(() => (props.task?.completedUsers?.length ?? 0) > 0);

  createEffect(on(() => [props.task, source.latest] as const, ([task, newProject]) => {
    batch(() => {
      title.reset(task?.title ?? title.original);
      status.reset(task?.status ?? status.original);
      priority.reset(task?.priority ?? priority.original);
      description.reset(task?.description ?? description.original);
      subtasks[1](task?.subtasks ?? subtasks[0]);

      files.reset(task?.files ?? []);
      set(planDateNotifications, task?.planDateNotifications ?? defaultNotifications);
      set(dueDateNotifications, task?.dueDateNotifications ?? defaultNotifications);
      isCompleted.reset((task?.isCompleted ?? isCompleted.original) || (task?.completedUsers?.some(id => id === WebApp.initDataUnsafe?.user?.id) ?? isCompleted.original));
      assignees.reset(task?.coassignees ?? assignees.original);
      author.reset(task?.author ? [task.author] : author.original);
      project.reset(
        (newProject === defaultProject || newProject.type === ProjectType.Dynamic)
          ? task?.project ?? project.original
          : newProject,
      );
      dueDate.reset(task?.dueDate ?? dueDate.original, true);
      planDate.reset(initialDate(), true);
      planCron.reset(task?.planCron, true);
      if (task?.planCron) {
        selectedRepetition.reset(detectRepeats(task.planCron));
      }
    });
  }));

  const [isRequestInProgress, setRequestInProgress] = createSignal(false);
  const [isDeleting, setIsDeleting] = createSignal(false);
  const [profile] = useContext(ProfileContext);

  const canUseFiles = () => profile.latest?.canUseAll([Permissions.FileSize, true], [Permissions.FilesAmount, true]);
  const maxFileSize = () => profile.latest?.getPermission(Permissions.FileSize, true);
  const maxFileAmount = () => profile.latest?.getPermission(Permissions.FilesAmount, true);
  const canUseDueDate = () => profile.latest?.canUse(Permissions.DueDate);

  const owner = getOwner();
  const navigate = useNavigate();

  const deleteTaskOnClick = () => {
    if (!props.task?.id) {
      return;
    }

    WebApp.showConfirm(t('delete confirm'), (confirmed) => {
      if (!confirmed) return;

      setIsDeleting(true);

      deleteTask(props.task?.id)
        .then(() => navigateBack())
        .catch(() => WebApp.showAlert(t('delete error')))
        .finally(() => setIsDeleting(false));
    });
  };

  createEffect(() => {
    if (isRequestInProgress()) {
      WebApp.enableClosingConfirmation();
    } else {
      WebApp.disableClosingConfirmation();
    }
  });

  const setTaskCompletionFailed = () => {
    set(isCompleted, false);
    WebApp.HapticFeedback.notificationOccurred('error');
  };

  const [isCompletionInProgress, setCompletionInProgress] = createSignal(false);

  let timeoutHandle: number;

  // TODO: refactor this
  const submitTaskComplete = (e?: MouseEvent, skipSave?: boolean) => {
    e?.stopPropagation();

    const taskId = props.task?.id;

    if (!taskId || isCompletionInProgress()) {
      return;
    }

    clearTimeout(timeoutHandle);

    setCompletionInProgress(true);

    const result = submitTask(false)
      .then(() => (
        !get(isCompleted)
        ? uncompleteTask(taskId)
        : completeTask(taskId)
    ));

    result.then((r) => {
      if (r.error) {
        setTaskCompletionFailed();
        return;
      }

      if (r.data && props.task) {
        props.setTask(r.data, true);
      }

      if (r.data?.isCompleted ?? get(isCompleted)) {
        navigateBack();
      }
    })
    .catch(() => {
      setTaskCompletionFailed();
    })
    .finally(() => {
      setCompletionInProgress(false);
    });
  };

  const formData = new FormData();

  const isFormDisabled = () => {
    const participants = [...props.task?.coassignees ?? [], props.task?.author].filter(x => !!x);
    const currentUserId = WebApp.initDataUnsafe.user?.id;

    return get(isCompleted)
      || props.task?.isCompleted
      || isRequestInProgress()
      || (props.task && !participants.some(u => currentUserId === u?.userId) && !isAdmin());
  };

  const onScroll = () => requestAnimationFrame(() => {
    (document.activeElement as HTMLElement).blur?.();
    removeEventListener('scroll', onScroll);
  });

  onMount(() => {
    addEventListener('scroll', onScroll);
  });

  onCleanup(() => {
    removeEventListener('scroll', onScroll);
  });

  const expandedDescription = createSignal(false);

  const descriptionHeight = createSignal(lineHeight);

  const postTaskToChat = () => {
    setRequestInProgress(true);
    const taskId = props.task?.id ?? useParams().taskId;

    postToChat(taskId)
      .then((inviteLink: string | number | undefined) => {
        const chatId = props.task?.project?.chatId;

        if (!isNaN(Number(inviteLink)) && chatId) {
          inviteLink = getMessageLink({
            messageId: Number(inviteLink),
            chatId,
          });
        } else if (chatId && props.task?.lastMessageId) {
          inviteLink = getMessageLink({
            messageId: props.task.lastMessageId,
            chatId,
          });
        }

        if (inviteLink) {
          WebApp.openTelegramLink(String(inviteLink));
        } else {
          WebApp.close();
        }
      })
      .finally(() => setRequestInProgress(false));
  };

  const assigneeLimit = createMemo(() => profile.latest.getPermission(Permissions.TaskAssigneeLimit));

  const displayDate = (date: () => Date | null) => {
    const _date = date();

    if (!_date) {
      return t('task-editor no-date');
    }

    return t('task plan-date', { date: _date }, hasNoTime(_date) ? {
      hour: undefined,
      minute: undefined,
    } : {});
  };

  createRenderEffect(on(() => get(planDate), date => {
    if (!date || hasNoTime(date)) {
      set(selectedRepetition, undefined);
      set(planCron, undefined);
    }

    if (date && get(selectedRepetition)) {
      set(planCron, dateToCron(date, get(selectedRepetition)));
    }
  }));

  createRenderEffect(on(() => get(selectedRepetition), (repetition) => {
    const date = get(planDate);

    if (date) {
      set(planCron, dateToCron(date, repetition));
    }
  }, { defer: true }));

  const isObserver = createMemo(() => {
    const currentUserId = WebApp.initDataUnsafe.user?.id;

    if (!currentUserId || !props.task) {
      return false;
    }

    const { coassignees, author } = props.task;
    const taskRelatedUsers = [...coassignees, author]
      .filter((a): a is ClientUser => typeof a !== 'undefined');

    return taskRelatedUsers.every(a => a.userId !== currentUserId);
  });

  const isAdmin = createMemo(() => {
    const currentUserId = WebApp.initDataUnsafe.user?.id;

    if (!currentUserId || !currentProjectUsers) {
      return false;
    }

    return currentProjectUsers.latest.some(u => (
      u.userId === currentUserId
      && [ClientUserStatus.Administrator, ClientUserStatus.Creator].includes(u.status!)
    ));
  });

  const planDateDialog = useDialog('modal');
  const [,setPlanDateDialog] = planDateDialog;

  const uploadProgress = new WeakMap<File, Signal<number | undefined>>();
  const uploadAbort = new WeakMap<File, () => true | void>();
  const filesToBeDeleted: ClientTaskFile[] = [];

  const combinedFiles = () => ([] as Array<DisplayableFile>)
    .concat(get(files))
    .concat(getFormFiles(formData));

  const showFilePreview = createSignal<number>();

  let fileContainer!: HTMLDivElement;

  createEffect(() => {
    if (typeof get(showFilePreview) === 'number' && isMobile() && window.scrollY === 0) {
      window?.scrollTo({ behavior: 'smooth', top: 1 });
    }
  });

  // TODO: debug the double-navigation problem deeper to provide a serious fix
  let isNavigating = false;

  return <MultiProvider values={[
    [FullTaskContext, () => props.task],
    [PreviewContext, { show: (file) => set(showFilePreview, file) } satisfies FilePreviewController],
  ]}>
    <PreviewHost files={combinedFiles()}
      index={showFilePreview}
    />

    <UsersContext.Provider value={selectedProjectUsers}>
    <TaskHeader task={props.task}
      taskKey={props.task?.number}
      projectSelector={
        <ProjectSelect project={project}
          // doesn't work
          disabled={isProjectDisabled()}
        >
          {(onClick, isSelected, text) => <ProjectSelector
            projectName={text}
            aria-disabled={isProjectDisabled()}
            onClick={!isProjectDisabled() ? onClick : undefined}
            classList={{ 'cursor-not-allowed!': isProjectDisabled() }}
            disabled={isProjectDisabled()}
          />}
        </ProjectSelect>
      }
    />
    <main class="p-4 pt-2 flex flex-col gap-4"
      style={{ 'min-height': get(files).length > 0 ? 'calc(100vh - 44px)' : undefined }}
    >
      <TopCard
        checkbox={<>
          <Checkbox class="p-1.5 h-9 w-9 flex"
            labelClass={isFormDisabled() ? 'opacity-70 filter-grayscale!' : ''}
            model={isCompleted}
            disabled={isRequestInProgress() || isCheckboxDisabled() || !props.task || isObserver()}
            onClick={submitTaskComplete}
            priority={get(priority)}
          />

          <Show when={isObserver()}>
            <ChevronCheck class="absolute ui-icon-tertiary top-4.5 ltr:left-6 rtl:right-6" />
          </Show>
        </>}

        dates={<DatesPopup />}

        priority={priority}
        status={status}

        contextMenu={props.task ? <>
          <Show when={isDiscussEnabled()}>
            <List.Item onClick={postTaskToChat} right={<></>}>
              <div class="flex items-center gap-3">
                <Chat class="ui-icon-secondary" />
                <span class="text-center flex-grow inline-flex items-center">
                  {t('discuss button-text')}
                </span>
              </div>
            </List.Item>
          </Show>
          <List.Item right={<></>}
            onClick={deleteTaskOnClick}
            disabled={!isDeleteEnabled()}
          >
            <div class="flex items-center gap-3">
              <Show when={!isDeleting()} fallback={<Loader />}>
                <Trash class="= fill-urgent" classList={{ 'fill-tg_hint!': !isDeleteEnabled() }} />
              </Show>
              <span class="text-center flex-grow inline-flex items-center" classList={{ 'c-tg_hint!': !isDeleteEnabled() }}>
                {t('delete button-text')}
              </span>
            </div>
          </List.Item>
        </> : undefined}

        title={title}
        description={description}
        subtasks={subtasks}
        calendarLink={
          <Show when={isCalendarAttachEnabled()} fallback={<div class="h-9 w-9 flex" />}>
            <a class="p-1.5 h-9 w-9 flex"
              href={`${resolvedBackendUrl}/api/tasks/${props.task?.id}/ical`}
              target={(isMobile() || isMac()) ? '_blank' : undefined}
              download={(props.task?.title ?? 'task') + '.ics'}
              onClick={e => {
                if (typeof WebApp.downloadFile === 'function') {
                  try {
                    WebApp.downloadFile({
                      url: `${resolvedBackendUrl}/api/tasks/${props.task?.id}/ical`,
                      file_name: (props.task?.number ?? 'task') + '.ics',
                    }, accepted => {
                      if (!accepted) return;
                    });

                    e.preventDefault();

                    return;
                  } catch (error) {
                    /*  */
                  }
                }

                if (isMobile()) {
                  e.preventDefault();
                  window.open(`${resolvedBackendUrl}/api/tasks/${props.task?.id}/ical`, '_blank');
                }
              }}
            >
              <CalendarAdd class="ui-icon-tertiary" />
            </a>
          </Show>
        }
      />

      <Show when={isPublicProject() || get(assignees).length > 0 || (props.task ? !props.task.fromInline : !isInline())}
        fallback={
          <Show when={isInline() || props.task?.fromInline}>
            <div class="= flex flex-col bg-section rounded-3">
              <InlineAssignee />
            </div>
          </Show>
        }
      >
        <div class="= flex flex-col bg-section rounded-3"
          classList={{
            'hidden': isPrivateProject() && (props.task ? !props.task.fromInline : !isInline()) && get(assignees).length === 0,
          }}
        >
            <Show when={props.task}>
              <UserSelect users={author}
                title={t('task author')}
                limit={1}
                projectId={get(project).id}
                projectIcon={<ItemIcon fallback={get(project).name} url={get(project).icon} />}
                disabled={isAuthorDisabled()}
                disallowEmpty
              >
                {(onClick) => <div role="button" class="= flex items-center cursor-pointer overflow-hidden min-h-11"
                  classList={{
                    'cursor-not-allowed!': isAuthorDisabled(),
                  }}
                  onClick={isAuthorDisabled() ? undefined : onClick}
                >
                  <div class="= min-w-14 flex items-top justify-center overflow-initial">
                    <ReporterOutlined class="= overflow-initial"
                      classList={{
                        'fill-tg_hint': !author.canUndo() || isAuthorDisabled(),
                        'fill-tg_button': author.canUndo() && !isAuthorDisabled(),
                      }}
                    />
                  </div>
                  <div class="= flex flex-grow items-center b-b-1 b-b-solid b-b-border-regular ltr:pr-2 rtl:pl-2 gap-4 overflow-hidden">
                    <p class="= app-text-subheadline flex-grow ltr:text-left rtl:text-right m-0"
                      classList={{
                        'c-tg_hint': isAuthorDisabled(),
                      }}
                    >
                      {t('task author')}
                    </p>
                    <p class="= app-text-subheadline-stable flex items-center m-0 py-2.25 gap-2 px-1 text-ellipsis whitespace-nowrap overflow-hidden">
                      <InitialsAvatar user={get(author)[0]} small />
                      <span class="= text-ellipsis whitespace-nowrap overflow-hidden"
                        classList={{
                          'c-tg_hint': !author.canUndo() || isAuthorDisabled(),
                          'c-tg_button': author.canUndo() && !isAuthorDisabled(),
                        }}
                      >
                        {get(author)[0]?.title}
                      </span>
                    </p>
                    <Show when={!isAuthorDisabled()}>
                      <ListArrow class="= overflow-initial fill-tg_hint ltr:ml--4 rtl:mr--4" />
                    </Show>
                  </div>
                </div>}
              </UserSelect>
            </Show>
            <Show when={get(assignees).length > 0 || !props.task || !props.task.fromInline}
              fallback={<>
                <InlineAssignee />
              </>}
            >
              <UserSelect users={assignees}
                title={t('task assignee')}
                limit={assigneeLimit().limit ?? undefined}
                projectId={get(project).id}
                projectIcon={<ItemIcon fallback={get(project).name} url={get(project).icon} />}
                disabled={isAssigneeDisabled()}
              >
                {(onClick) => <div role="button" class="= flex items-center cursor-pointer overflow-hidden min-h-11"
                  onClick={isAssigneeDisabled() ? undefined : onClick}
                  classList={{
                    'cursor-not-allowed!': isAssigneeDisabled(),
                  }}
                >
                  <div class="= min-w-14 h-11 flex items-center justify-center overflow-initial"
                    style="align-self: start"
                  >
                    <AssigneeOutlined class="= overflow-initial"
                      classList={{
                        'fill-tg_hint': !assignees.canUndo() || isAssigneeDisabled(),
                        'fill-tg_button': assignees.canUndo() && !isAssigneeDisabled(),
                      }}
                    />
                  </div>
                  <div class="= grid gap-x-2 flex-grow overflow-hidden"
                    style={{
                      'grid-template-columns': '[text] 1fr [assignee] auto',
                    }}
                  >
                    <For each={get(assignees)}
                      fallback={
                        <AssigneeRow showArrow>
                          <Show when={!isAssigneeDisabled()}
                            fallback={
                              <span class="= c-tg_hint mx-2">
                                {t('task-editor none')}
                              </span>
                            }
                          >
                            <span class="= c-tg_hint">
                              {t('task-editor add-assignee')}
                            </span>
                          </Show>
                        </AssigneeRow>
                      }
                    >
                      {(assignee, index) => <AssigneeRow assignee={assignee} showArrow={index() === 0} hideText={index() !== 0} />}
                    </For>
                  </div>
                </div>}
              </UserSelect>
            </Show>
        </div>
      </Show>

      <FilesList openPreview={(file) => set(showFilePreview, file)}
        ref={fileContainer}
        limit={maxFileAmount().limit}
        maxSize={maxFileSize().limit}
        formData={formData}
        files={files}
        disabled={isFilesDisabled()}
        onDisabled={() => navigate('/subscribe')}
        uploadProgress={uploadProgress}
        onRemoveFile={(file) => {
          if (file instanceof ClientTaskFile) {
            filesToBeDeleted.push(file);
            return;
          }

          const abort = uploadAbort.get(file);

          if (!abort) {
            uploadAbort.set(file, () => true);
          } else {
            abort();
          }
        }}
      >
        <Show when={!isRequestInProgress()}
          fallback={<Loader />}
        >
          <ProBadge when={!profile.latest.isPro} />
        </Show>
      </FilesList>

      <Suspense>
        <Show when={props.task}>
          {task => <HistoryList taskId={task().id} />}
        </Show>
      </Suspense>

    </main>
    </UsersContext.Provider>

    <MainButton text={!props.task ? t('task-editor button-create') : t('task button-save')}
      showProgress={isRequestInProgress()}
      disabled={isRequestInProgress() || (isFormDisabled() && !status.canUndo()) || (get(title).length === 0)}
      onClick={() => submitTask()}
    />
    <Show when={WebApp.platform === 'unknown'}>
      <button class="= w-full mt-2 rounded-2 p-3 c-tg_button_text"
        onClick={() => submitTask()}
        disabled={isRequestInProgress() || isFormDisabled() || (get(title).length === 0)}
      >
        {!props.task ? t('task-editor button-create') : t('task button-save')}
      </button>
    </Show>
  </MultiProvider>;

  function isCalendarAttachEnabled(): boolean {
    return !!props.task && (!!props.task?.planDate || !!props.task?.dueDate);
  }

  function InlineAssignee() {
    return <UserSelect users={currentContact}
      title={t('task assignee')}
      disabled
    >
      {() => <div role="button" class="= flex items-center cursor-pointer overflow-hidden min-h-11"
        classList={{
          'cursor-not-allowed!': true,
        }}
      >
        <div class="= min-w-14 h-11 flex items-center justify-center overflow-initial"
          style="align-self: start"
        >
          <AssigneeOutlined class="= overflow-initial"
            classList={{
              'fill-tg_hint': !assignees.canUndo() || true,
              'fill-tg_button': assignees.canUndo() && !true,
            }} />
        </div>
        <div class="= grid gap-x-2 flex-grow overflow-hidden"
          style={{
            'grid-template-columns': '[text] 1fr [assignee] auto',
          }}
        >
          <AssigneeRow assignee={contact} amount={1} />
        </div>
      </div>}
    </UserSelect>;
  }

  function navigateBack(): void {
    if (isInline() || isNavigating) {
      return;
    }

    isNavigating = true;

    return runWithOwner(owner, () => {
      try {
        navigate(-1);
      } catch {
        isNavigating = false;
      }
    });
  }

  function isFilesDisabled(): boolean | undefined {
    return !canUseFiles() || isFormDisabled();
  }

  function isAssigneeDisabled(): boolean | undefined {
    return (!isPrivateProject() && !(isUserAuthor() || isAdmin())) || isFormDisabled() || (isInline() && !isPublicProject()) || (get(project).id === defaultProject.id);
  }

  function isAuthorDisabled(): boolean | undefined {
    return !(isUserAuthor() || isAdmin()) || isFormDisabled() || (get(project).id === defaultProject.id);
  }

  function isProjectDisabled(): boolean | undefined {
    return !isUserAuthor()
      || (!isUserAuthor() && isAdmin())
      || isFormDisabled()
      || isInline()
      || (author.canUndo() && get(author).every(u => u.userId !== WebApp.initDataUnsafe.user?.id));
  }

  function isPlanDateDisabled(): boolean | undefined {
    return isFormDisabled();
  }

  function isDiscussEnabled() {
    return !isFormDisabled() && !isRequestInProgress();
  }

  function isDeleteEnabled() {
    return !(isFormDisabled() && !props.task?.isCompleted) && !isRequestInProgress() && !isDeleting() && (isUserAuthor() || isAdmin());
  }


  function AssigneeRow(props: ParentProps<{
    assignee?: ClientUser;
    showArrow?: boolean;
    hideText?: boolean;
    amount?: number;
  }>) {
    return <>
      <p class="= app-text-subheadline flex items-center flex-grow ltr:text-left rtl:text-right m-0"
        classList={{
          'c-tg_hint': isAssigneeDisabled(),
          'mt--1.5': (false === props.showArrow) && !isInline(),
          'opacity-0': !!props.hideText,
        }}
      >
        {t('task assignee', props.amount ?? get(assignees).length)}
      </p>
      <div class="= flex items-center gap-4 overflow-hidden ltr:pr-2 rtl:pl-2 justify-between"
        classList={{
          'mt--1.5': (false === props.showArrow) && !isInline(),
        }}
      >
        <p class="= app-text-subheadline-stable flex items-center m-0 py-2.25 ltr:pl-1 rtl:pr-1 gap-2 text-ellipsis whitespace-nowrap overflow-hidden"
          classList={{
            'c-tg_text': assignees.canUndo() && !isAssigneeDisabled(),
            'c-tg_hint': !assignees.canUndo() || isAssigneeDisabled(),
          }}
        >
          <Show when={!props.children} fallback={props.children}>
            <Show when={hasSomeCompletedUsers()}>
              <Checkmark class="= fill-tg_button min-w-6"
                classList={{ 'opacity-0': !hasCompletedTask(props.assignee) }}
              />
            </Show>
            <InitialsAvatar user={props.assignee} small
              classList={{ 'opacity-50': hasCompletedTask(props.assignee) }}
            />
            <span class="= text-ellipsis whitespace-nowrap overflow-hidden"
              classList={{ 'opacity-50': hasCompletedTask(props.assignee) }}
            >
              {props.assignee?.title}
            </span>
          </Show>
        </p>
        <Show when={props.showArrow && !isAssigneeDisabled()}
          fallback={<div class="= ltr:ml--3 rtl:mr--3"/>}
        >
          <ListArrow class="= overflow-initial fill-tg_hint ltr:ml--3 rtl:mr--3" />
        </Show>
      </div>
    </>;
  }

  function initialDate(): Date | null {
    return props.task ? props.task.planDate : (source.latest.id === 'g_tom' ? tomorrow() : today());
  }

  function isCheckboxDisabled(): boolean | undefined {
    return props.task?.completable ?? (
      (!props.task?.isCompleted && !isPrivateProject())
      || isCompletionInProgress()
    );
  }

  function isDueDateDisabled(): boolean | undefined {
    return (!isPrivateProject() && !(isUserAuthor() || isAdmin()))
      || isFormDisabled()
      || !canUseDueDate()
      || isFormDisabled();
  }

  function setDescriptionHeight(el: HTMLElement) {
    el.style.height = '1px';

    setTimeout(() => {
      if (el.scrollHeight < minSetDescriptionHeight) {
        el.style.height = '';
        return;
      }

      el.style.height = `${el.scrollHeight}px`;

      set(descriptionHeight, el.scrollHeight);

      if (el instanceof HTMLTextAreaElement) {
        el.style.height = '';
      } else {
        el.style.height = 'initial';
      }
    });
  }

  function submitTask(preventNavigation?: boolean) {
    setRequestInProgress(true);

    let taskId: string;

    return (
      props.task
      ? props.setTask(FullClientTask.fromRaw({
          ...props.task,
          title: get(title),
          description: get(description),
          isCompleted: get(isCompleted),
          author: get(author)[0] ?? undefined,
          dueDate: get(dueDate),
          planDate: (get(planCron) && get(planDate)) ? withTime(get(planDate)!) : get(planDate),
          planCron: get(selectedRepetition) ? get(planCron) : undefined,
          project: get(project),
          coassignees: get(assignees),
          subtasks: subtasks[0],
          status: get(status),
          priority: get(priority),
          planDateNotifications: get(planDateNotifications),
          dueDateNotifications: get(dueDateNotifications),
        }), false)
      : props.setTask(BaseClientTask.fromRaw({
          title: get(title),
          description: get(description),
          dueDate: get(dueDate),
          planDate: (get(planCron) && get(planDate)) ? withTime(get(planDate)!) : get(planDate),
          planCron: get(selectedRepetition) ? get(planCron) : undefined,
          coassignees: get(assignees),
          type: TaskType.Task,
          fromInline: isInline(),
          subtasks: subtasks[0],
          status: get(status),
          priority: get(priority),
          planDateNotifications: get(planDateNotifications),
          dueDateNotifications: get(dueDateNotifications),
        }), get(project).id)
    ).then(([refetchTask, task]) => {
      const newProject = get(project);
      const old = project.previous();

      if (newProject?.id !== old?.id) {
        refetchTask();
      }

      taskId = task?.id ?? props.task?.id ?? '';

      if (typeof taskId !== 'string' || !taskId) {
        return;
      }

      let messageId = task?.lastMessageId ?? props.task?.lastMessageId;

      return parallel(
        () => filesToBeDeleted.length > 0 ? deleteFiles(taskId, filesToBeDeleted.map(f => f.id), messageId) : undefined,
        async () => {
          if (formData.getAll('files').length <= 0) {
            return;
          }

          WebApp.BackButton.hide();

          try {
            let files = getFormFiles(formData);
            let first: File;

            if (!messageId) {
              [first, ...files] = files;

              const wrapper = await attachSingleFile(taskId, first);
              const response = typeof wrapper === 'string'
              ? wrapper
              : (typeof wrapper === 'object' && wrapper && 'json' in wrapper && typeof wrapper.json === 'function')
                ? await (wrapper)?.json()
                : undefined;

              messageId = response ? Number(response) : undefined;
              messageId = (typeof messageId === 'number' && isNaN(messageId)) ? undefined : messageId;
            }

            await Promise.all(
              files.map(file => attachSingleFile(taskId, file, messageId)),
            );

            setRequestInProgress(false);
          } catch (error) {
            WebApp.showAlert('Task created successfully, but some files failed to attach');
            console.error(error);

            setRequestInProgress(false);
          }
        },
      );
    })
    .catch((e) => {
      WebApp.showAlert('Task creation error:' + String(e).slice(0, 64) + '; Please, try again.');
      // Inline mode - task created in .finally
      if (isInline()) {
        return;
      }
    })
    .finally(() => {
      setRequestInProgress(false);

      // Inline mode - create task by id
      if (isInline() && taskId) {
        WebApp.switchInlineQuery(taskId);
        return;
      }

      [...formData.keys()].forEach(key => formData.delete(key));

      if (!preventNavigation) {
        navigateBack();
      }
    });

    async function attachSingleFile(taskId: string, file: File, messageId?: number) {
      const singleFile = new FormData();
      singleFile.append(formFieldName, file);

      if (uploadAbort.get(file)?.()) {
        return;
      }

      const [response, abort] = await attachFiles(
        taskId,
        singleFile,
        num => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          set(uploadProgress.get(file)!, num);
        },
        messageId,
      );

      uploadAbort.set(file, abort);

      return await response;
    }
  }

  function isPrivateProject() {
    return !get(project) || (get(project)?.type === ProjectType.Private) || get(project).id === defaultProject.id;
  }

  function isPublicProject() {
    return !get(project) || (get(project)?.type === ProjectType.Public);
  }

  function isUserAuthor() {
    return !props.task?.author || props.task?.author.userId === WebApp.initDataUnsafe.user?.id;
  }

  function DatesPopup() {
    return <>
      <DatesSelect
        canUseDueDate={canUseDueDate}
        dueDate={dueDate}
        dueDateNotifications={dueDateNotifications}
        planDate={planDate}
        planDateNotifications={planDateNotifications}
        selectedRepetition={selectedRepetition}
      >{() =>
        <div class="flex flex-col justify-center items-center">
          <p class="c-text-accented app-text-body-m/medium text-center cursor-pointer flex gap-1 items-center ws-nowrap"
            classList={{
              'c-text-negative': isDateInPast(get(planDate)),
            }}
          >
            <Show when={hasTime(get(planDate)) && (get(planDateNotifications).length || get(dueDateNotifications).length)}>
              <Clock class="ui-icon-accented"
                classList={{
                  'ui-icon-negative': isDateInPast(get(planDate)),
                  'mb-[-1px]': !isMac(),
                }}
              />
            </Show>

            <span>
              {displayDate(planDate[0])}
            </span>

            <ShortRepeat cron={get(planCron)} text={cron => t('task plan-cron repetition-shortest', cron)}
              iconClass={{
                'ui-icon-negative': isDateInPast(get(planDate)),
              }}
              textClass={{
                'c-text-negative': isDateInPast(get(planDate)),
              }}
            />
          </p>
          <Show when={dueDate[0]()}>
            <div class="flex items-center gap-0.5">
              <FlagSM class="ui-icon-negative" />
              <p class="c-text-negative app-text-body-s/medium text-center cursor-pointer ws-nowrap">
                {displayDate(dueDate[0])}
              </p>
            </div>
          </Show>
        </div>
      }</DatesSelect>
    </>;
  }
}