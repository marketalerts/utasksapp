import WebApp from 'tma-dev-sdk';
import { get, set } from 'solid-utils/access';
import { Dynamic, Portal } from 'solid-js/web';
import { createStore } from 'solid-js/store';
import { For, Match, Show, Suspense, Switch, createContext, createEffect, createMemo, createSignal, lazy, useContext } from 'solid-js';
import type { ComponentProps, JSX, ParentProps } from 'solid-js';
import { makePersisted } from '@solid-primitives/storage';
import { createElementSize } from '@solid-primitives/resize-observer';
import { MultilineRaw } from '@intl-schematic/solid/Multiline';

import { isMobile } from 'shared/platform';
import type { Marker } from 'shared/memoize';
import { detectRepeats } from 'shared/l10n/cron';
import { currentTextDirection } from 'shared/l10n';
import { ImgStatus, useImgStatus } from 'shared/img-status';

import type { ClientUser } from 'f/project/users.adapter';
import { defaultProject } from 'f/project/project.context';
import type { ClientItem } from 'f/project/project.adapter';
import type { Subtask } from '#/task-editor/subtasks/features';

import { FullTaskContext } from '../task.context';
import type { FullClientTask, TaskNotification } from '../task.adapter';
import { createHistoryResource } from '../history/context';
import { filterComment, filterUpdate, isComment } from '../history/adapter';
import type { ClientTaskHistoryUpdate, ClientTaskHistoryComment, ClientTaskHistoryItem, HistorySorting, HistoryFilter } from '../history/adapter';
import { PreviewContext } from '../files/preview/context';
import type { FilePreviewController } from '../files/preview/context';
import Preview from '../files/preview';
import type { ClientTaskFile } from '../files/adapter';

import { FilePill } from './files';

import { t } from 'locales/task';

import { waterfall } from 'ui/composables/use-waterfall';
import { useDialog } from 'shared/ui/use-dialog';
const StickerPlayer = lazy(() => import('shared/ui/tgs-player'));
import { CloudStorage } from 'shared/ui/telegram';
import { linkRegexp, useLinkMarker } from 'shared/ui/markers/link';
import { checkRegexp, useChecklistMarker } from 'shared/ui/markers/checklist';
import { Loader } from 'shared/ui/loader.ui';
import ListArrow from 'shared/ui/list-arrow';
import List from 'shared/ui/list';
import { InitialsAvatar, getColor } from 'shared/ui/initials-avatar';
import Dialog from 'shared/ui/dialog';

import Subtasks from '#/task-editor/subtasks/ui';

import ReporterOutlined from 'icons/ReporterOutlined.svg';
import Repeat from 'icons/Repeat.svg';
import Project from 'icons/Project.svg';
import Plus from 'icons/PlusOutlined.svg';
import More from 'icons/More.svg';
import ListIcon from 'icons/List.svg';
import History from 'icons/HistoryOutlined.svg';
import Gear from 'icons/Gear.svg';
import FlagFilled from 'icons/FlagFilled.svg';
import Document from 'icons/Document.svg';
import CheckmarkEmpty from 'icons/CheckmarkEmpty.svg';
import Checkmark from 'icons/CheckmarkCircleFilled.svg';
import Calendar from 'icons/Calendar.svg';
import Attach from 'icons/Attach.svg';
import AssigneeOutlined from 'icons/AssigneeOutlined.svg';
import Alarm from 'icons/AlarmClock.svg';

type ValidComment = Omit<ClientTaskHistoryComment, 'messageId' | 'chatId'> & Required<Pick<ClientTaskHistoryComment, 'messageId' | 'chatId'>>;

const ReplyContext = createContext<(commentId: number, chatId: number) => ValidComment>();

export function HistoryList(props: { taskId: string; }) {
  const isOpen = createSignal(false);
  const displayHint = makePersisted(createSignal(true), {
    name: 'display-history-hint',
  });

  const sorting = makePersisted(createSignal<HistorySorting>('old-first'), {
    name: 'history-sort',
    storage: CloudStorage,
  });

  const filter = makePersisted(createSignal<HistoryFilter>(null), {
    name: 'history-filter',
    storage: CloudStorage,
  });

  const toggleSort = () => set(sorting, old => old === 'new-first' ? 'old-first' : 'new-first');

  const getNextFilter = (old?: HistoryFilter): HistoryFilter => (
    !old ? 'comment' : old === 'comment' ? 'update' : null
  );

  const toggleFilter = () => set(filter, getNextFilter);

  const [history] = createHistoryResource(() => props.taskId, () => ({
    sort: get(sorting),
    filter: get(filter),
  }));

  const historyLength = createMemo(() => history.latest.length);

  const listHeight = createSignal(0);
  const historyList = createSignal<HTMLElement>();

  const historySize = createElementSize(historyList[0]);

  createEffect(() => {
    const scrollHeight = historySize.height ?? 0;

    if (scrollHeight > 0)
      requestAnimationFrame(() => set(listHeight, scrollHeight + 512));
  });

  const listStub = [0];

  type CommentHash = `${number}-${number}`;
  const [comments, updateComments] = createStore({} as Record<CommentHash, ValidComment>);
  const commentHash = (item: { chatId: number; messageId: number; }): CommentHash => `${item.chatId}-${item.messageId}`;
  const getComment = (messageId: number, chatId: number) => comments[commentHash({ chatId, messageId })];

  return <ReplyContext.Provider value={getComment}>
    <List refactor type="div" each={listStub}>
      {() => <List.Item onClick={() => set(isOpen, !get(isOpen))}
        class="max-h-11 overflow-hidden app-transition-max-height"
        style={get(isOpen) ? {
          'max-height': `${get(listHeight)}px`,
        } : {}}
        left={<History class="fill-tg_hint! ml-0.5" />}
        rightHint={
          <Show when={!history.loading} fallback={<Loader />}>
            <span class="app-text-body-s/regular rounded-2 p-1 px-1.5 bg-tg_bg_secondary c-tg_text">
              {historyLength()}
            </span>
          </Show>
        }
        right={<ListArrow class="overflow-initial fill-tg_hint"
          isOpen={isOpen[0]} />}
        bottom={
          <div class="overflow-hidden" classList={{ '[&>:last-child]:opacity-90': history.loading }}>
            <Suspense>
              <HistoryBody hidden={history.latest.length === 0}>
                <For each={history.latest}>
                  {(item) => {
                    if (isValidComment(item)) {
                      updateComments({ [commentHash(item.comment)]: item.comment });
                    }

                    return <HistoryItem item={item} />;
                  }}
                </For>
              </HistoryBody>
            </Suspense>
          </div>
        }
      >
        <p class="app-text-subheadline flex-grow ltr:text-left rtl:text-right m-0">
          {t('task history')}
        </p>
      </List.Item>}
    </List>
  </ReplyContext.Provider>;

  function isValidComment(item: ClientTaskHistoryItem): item is ClientTaskHistoryItem & {
    comment: ValidComment;
  } {
    return isComment(item)
      && typeof item.comment.messageId === 'number'
      && typeof item.comment.chatId === 'number';
  }

  function HistoryBody(props: ParentProps<{ hidden: boolean; }>): JSX.Element {
    return <>
      <Show when={!props.hidden}>
        <div class="flex flex-col gap-2 px-4 w-full cursor-initial!" onClick={e => e.stopPropagation()}>
          <TimelineEvent
            pin={<Gear viewBox="0 0 24 24"
              class="fill-tg_hint h-5 w-5 mx-0.5" />}
            header={<>
              <div class="flex items-baseline overflow-hidden mx-0.5">
                <p class="m-0 font-600! app-text-caption-one-regular">
                  {t('task history sort title')}
                </p>
                {/* <div role="button" class="inline rounded-3 py-3 c-tg_link cursor-pointer app-text-body-s ellipsis ltr:direction-rtl rtl:direction-ltr"
                  onClick={toggleFilter}
                >
                  {t('task history filter type', get(filter) ?? 'all')}
                </div>
                <span class="c-tg_hint app-text-body-s mr-1">, </span> */}
                <div role="button" class="inline rounded-3 py-3 mx-2 c-tg_link cursor-pointer app-text-body-s ellipsis ltr:direction-rtl rtl:direction-ltr"
                  onClick={toggleSort}
                >
                  {t('task history sort type', get(sorting))}
                </div>
              </div>
            </>}
          >
            {/* <div role="button"
              class="rounded-3 ltr:ml--2 rtl:mr--2 p-1 bg-tg_bg_tertiary text-center cursor-pointer app-text-body-s opacity-80 hover:opacity-100"
              onClick={toggleFilter}
            >
              {t('task history filter', {
                'task history filter type': [getNextFilter(get(filter)) ?? 'all'],
              })}
            </div> */}
          </TimelineEvent>
        </div>
      </Show>
      <div class="flex flex-col items-stretch cursor-initial!" onClick={e => e.stopPropagation()}>
        <div class="relative flex flex-col p-4 pt-1 gap-6 cursor-initial!"
          onClick={e => e.stopPropagation()}
          ref={el => set(historyList, old => old ?? el)}
          classList={{ 'p-0.5! mt--5': props.hidden }}
        >
          {props.children}
          <div class="absolute w-0.5 bg-border-regular top-7 bottom-7 ltr:left-7 rtl:right-7 z-0" />
        </div>
        <div class="relative px-4 z-2 [&>div>div:first-child]:bg-transparent [&>div>div:last-child]:bg-tg_bg_secondary app-transition-max-height,padding overflow-hidden"
          classList={{
            'max-h-0': !get(displayHint),
            'max-h-60 py-4': get(displayHint),
          }}
        >
          <Comment comment={{
            author: {
              title: 'UTasks',
              avatar: `${import.meta.env.BASE_URL}${import.meta.env.APP_BASE ?? '/'}Logo.jpg`,
              userName: 'UTasksBot',
            } as ClientUser,
            text: t('task history hint'),
          } as ClientTaskHistoryComment} />
          {/* <div role="button"
            class="relative ltr:ml-8 rtl:mr-8 mt-2 rounded-3 p-2 bg-tg_button c-tg_button_text text-center cursor-pointer app-text-footnote opacity-80 hover:opacity-100"
            onClick={() => set(displayHint, false)}
          >
            {t('task history hint hide')}
          </div> */}
        </div>
      </div>
    </>;
  }
}

function TimelineEvent(props: ParentProps<{ header: JSX.Element; pin: JSX.Element; compact?: boolean; }>) {
  return <section class="relative flex flex-col z-2 [&:last-of-type_.end]:bg-section">
    <div class="flex items-center [&_*]:app-text-body-regular c-tg_hint gap-2 mb-1">
      {props.pin}

      {props.header}
    </div>
    <Show when={props.children}>
      <div class="ltr:pl-8.5 rtl:pr-8.5 mt-1 flex flex-col gap-2" classList={{ 'mt--1!': props.compact }}>
        {props.children}
      </div>
    </Show>
  </section>;
}

function HistoryItem(props: { item: ClientTaskHistoryItem; }) {
  return <>
    <Show when={filterUpdate(props.item)}>
      {item => <Update update={item().update} />}
    </Show>
    <Show when={filterComment(props.item)}>
      {item => <Comment comment={item().comment} update={item().update} />}
    </Show>
  </>;
}

function Comment(props: { comment: ClientTaskHistoryComment; update?: ClientTaskHistoryUpdate; }) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const getComment = useContext(ReplyContext)!;

  const reply = createMemo(() => (
    typeof props.comment.replyToMessageId === 'number'
    && typeof props.comment.chatId === 'number'
    ? getComment(props.comment.replyToMessageId, props.comment.chatId) : undefined
  ));

  const linkMarker = useLinkMarker({
    props: { class: 'app-text-hint select-text!' },
  });

  const [nonImageFiles, updateNonImageFiles] = createStore<ClientTaskFile[]>([], {
    name: 'nonImageFiles',
  });

  const [stickers, updateStickers] = createStore<ClientTaskFile[]>([], {
    name: 'stickers',
  });

  const task = useContext(FullTaskContext);
  const preview = useContext(PreviewContext);
  const { createFilePreview, backup } = useFilePreview(preview, task);

  return <>
    <section class="flex items-top gap-2 z-1 [&:last-of-type>:first-child]:bg-section">
      <div class="p-0.5 my--0.5 rounded-full" onClick={openUserLink(props.comment.author)}
        classList={{ 'cursor-pointer': isUserClickable(props.comment.author) }}
      >
        <InitialsAvatar small user={props.comment.author} />
      </div>

      <div class="flex flex-col rounded-4 pt-1 pb-2 px-3 z-2 overflow-hidden bg-secondary bg-op-20"
        onClick={openCommentLink(props.comment.link)}
        classList={{
          'cursor-pointer': !!props.comment.link,
        }}
        style={{ [`border-top-${currentTextDirection() === 'rtl' ? 'right' : 'left'}-radius`]: 0 }}
      >
        <div class="flex items-center">
          <p class="m-0 font-600! app-text-caption-one-regular mb-1 ellipsis" onClick={openUserLink(props.comment.author)}
            classList={{ 'cursor-pointer': isUserClickable(props.comment.author) }}
            style={{ 'color': getColor(props.comment.author), 'user-select': 'text' }}
          >
            {props.comment.author.title}
          </p>
        </div>
        <Show when={reply()}>
          {reply => <Reply reply={reply()} comment={props.comment} />}
        </Show>
        <Show when={props.update?.newValue?.files}>
          {files => <>
            <ul class="reset-list flex flex-wrap overflow-hidden my-1 empty:hidden rounded-3 cursor-pointer max-w-full">
              <For each={files()}>
                {file => {
                  const { showPreview, index } = createFilePreview(file);
                  const { setImgStatus, isImgBad, isImgLoading } = useImgStatus();

                  return <>
                    <Show when={!isImgBad()}>
                      <li class="flex last:flex-grow-10 flex-grow overflow-hidden max-h-15vh min-h-5vh"
                        style="aspect-ratio:1 auto;"
                      >
                        <Show when={isImgLoading()}>
                          <Loader class="self-center m-auto scale-150" />
                        </Show>
                        <img src={file.downloadLink} alt={file.name}
                          class="object-cover min-h-full min-w-full"
                          classList={{ 'hidden': isImgLoading() }}
                          onLoad={() => setImgStatus(ImgStatus.GOOD)}
                          onError={() => {
                            setImgStatus(ImgStatus.BAD);
                            if (file.name.endsWith('.tgs')) {
                              updateStickers(files => [...files, file]);
                            } else {
                              updateNonImageFiles(files => [...files, file]);
                            }
                          }}
                          onClick={() => file.name.endsWith('.tgs') ? undefined : showPreview()}
                        />
                      </li>
                      <Show when={index < 0}>
                        <Portal>
                          <Preview files={[file]}
                            index={backup}
                          />
                        </Portal>
                      </Show>
                    </Show>
                  </>;
                }}
              </For>
            </ul>
            <ul class="reset-list flex flex-wrap gap-2 my-1 empty:hidden max-w-full">
              <For each={stickers}>
                {file => {
                  return <li class="max-w-50vw">
                    <StickerPlayer src={file.downloadLink} />
                  </li>;
                }}
              </For>
            </ul>
            <ul class="reset-list flex flex-wrap gap-2 my-1 empty:hidden max-w-full">
              <For each={nonImageFiles}>
                {file => {
                  const { showPreview, index } = createFilePreview(file);

                  return <li>
                    <FilePill file={file} onClick={() => showPreview()} />
                    <Show when={index < 0}>
                      <Portal>
                        <Preview files={[file]}
                          index={backup}
                        />
                      </Portal>
                    </Show>
                  </li>;
                }}
              </For>
            </ul>
          </>}
        </Show>
        <div class="flex flex-wrap items-end inline-block overflow-hidden">
          <MultilineRaw lines={props.comment.text}>{line =>
            <p class="m-0 w-auto app-text-hint" style="user-select: text">
              {linkMarker.mark(line)}
            </p>
          }</MultilineRaw>
          <Show when={props.comment.date}>
            {date => <p class="m-0 mt-1 w-auto app-text-caption-s/regular flex-grow ltr:text-right ltr:text-left c-tg_hint ltr:ml-2 rtl:mr-2">
              {t('task history-date', { date: date() })}
            </p>}
          </Show>
        </div>
      </div>
    </section>
  </>;

  function Reply(props: { reply: ValidComment; comment: ClientTaskHistoryComment; }) {
    const color = getColor(props.reply.author);

    const goToReply = props.reply.link
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      ? (e: Event) => (e.stopPropagation(), WebApp.openTelegramLink(props.reply.link!))
      : undefined;

    return <div class="relative rounded-1 overflow-hidden pt-0.5 px-2 pb-1 mb-1 max-w-full"
      onClick={goToReply}
    >
      <p class="m-0 font-600! app-text-caption-one-regular mb-0.5 ellipsis" onClick={openUserLink(props.comment.author)}
        classList={{ 'cursor-pointer': isUserClickable(props.comment.author) }}
        style={{ 'color': color, 'user-select': 'text' }}
      >
        {props.reply.author.title}
      </p>
      <p class="relative z-1 m-0 app-text-footnote ellipsis">
        {props.reply.text}
      </p>
      <div class="absolute top-0 left-0 right-0 bottom-0 ltr:(b-l-solid b-l-2) rtl:(b-r-solid b-r-2) z-0" style={{ 'border-color': color }}>
        <div class="opacity-20 w-full h-full" style={{ 'background-color': color }} />
      </div>
    </div>;
  }
}


const fieldOrder = {
  '': -10,
  'create': -1,
  'title': 0,
  'description': 1,
  'attach': 2,
  'planDate': 3,
  'planCron': 4,
  'dueDate': 5,
  'project': 6,
  'author': 7,
  'coassignees': 8,
  'reopen': 9,
  'detach': 2,
  'complete': 10,
  'completedUsersComplete': 11,
  'completedUsersReopen': 11,
  'planDateNotifications': 12,
  'dueDateNotifications': 12,
} satisfies Record<UpdateTypes, number>;

function Update(props: { update: ClientTaskHistoryUpdate }) {
  const hasAuthorCompleted = createMemo(() => {
    return props.update.newValue?.completedUsers?.some(u => u === props.update.author.userId);
  });

  const task = useContext(FullTaskContext);
  const preview = useContext(PreviewContext);

  const fields = createMemo(() => Object.keys({
    ...props.update.newValue,
    ...props.update.oldValue,
  }).filter(k => k !== 'subtasks').sort((a, b) => {
    switch (a + b) {
      // Man 🤦‍♂️
      case 'completedUsersisCompleted':
        return 1;

      case 'isCompletedcompletedUsers':
        return -1;

      default:
        return fieldOrder[a as UpdateTypes] - fieldOrder[b as UpdateTypes];
    }
  }));

  return <>
    <TimelineEvent
      pin={
        <div class="p-0.5 rounded-full [&_[title]]:block" onClick={openUserLink(props.update.author)}
          classList={{ 'cursor-pointer': isUserClickable(props.update.author) }}
        >
          <InitialsAvatar small user={props.update.author} />
        </div>
      }
      header={
        <div class="flex gap-2">
          <p class="m-0 font-600! app-text-caption-one-regular ellipsis" onClick={openUserLink(props.update.author)}
            classList={{ 'cursor-pointer': isUserClickable(props.update.author) }}
            style={{ 'color': getColor(props.update.author), 'user-select': 'text' }}
          >
            {props.update.author.title}
          </p>
          <span class="app-text-body-s c-tg_hint" style="user-select: text; line-height:1rem">
            {t('task plan-date', { date: props.update.date })}
          </span>
        </div>
      }
    >
      <For each={fields()}>{(field, index) =>
        <div class="relative mb-2">
          <div class="absolute ltr:left--5 rtl:right--5 w-4 mt--2 b-b-solid b-border-regular z-0 rtl:scale-x--100"
            style="border-radius: 0 0 0 20px;
                  border-bottom-width: 2px;
                  border-left-width: 2px;
                  height: 16px;"
          />
          <UpdateIcon type={getUpdateType(props.update, field)}
            class="fill-tg_hint h-5 w-5 absolute ltr:left--7.75 rtl:right--7.75 mt--0.75 scale-90 bg-section"
          />
          <Switch fallback={
            <>
              <p class="m-0 c-tg_hint app-text-caption-regular" style="user-select: text">
                {t('task history update', { key: field })}
              </p>
              <Update field={field} />
            </>
          }>
            <Match when={field === 'subtasks'}>
              <></>
            </Match>
            <Match when={field === 'description'}>
              <p class="m-0 c-tg_hint app-text-caption-regular" style="user-select: text">
                {t('task history update', { key: 'description' })}
              </p>
              <Update<string> field={field} single>
                {(oldVal, newVal) => {
                  const dialogParams = useDialog('modal', true);

                  const textMark = useLinkMarker();

                  return <>
                    <button class="mt-2 app-text-hint bg-transparent bg-border-regular p-1 px-2 hover:bg-app-icon-tertiary c-tg_text"
                      onClick={() => dialogParams[1](old => !old)}
                    >
                      {t('task history description view')}
                    </button>
                    <Dialog dialogParams={dialogParams}
                      class="fixed bg-section rounded-3 pt-0 pb-9 px-0 b-0 w-full max-w-full overflow-hidden"
                    >
                      <div class="inline-block w-full [&_*]:app-text-body-s-stable overflow-y-auto max-h-80vh">
                        <DescriptionViewer title={t('task history description view old')}
                          description={oldVal ?? ''}
                          subtasks={props.update.oldValue?.subtasks}
                          textMark={textMark}
                        />
                        <div class="bg-tg_bg_secondary w-full h-4" />
                        <DescriptionViewer title={t('task history description view new')}
                          description={newVal ?? ''}
                          subtasks={props.update.newValue?.subtasks}
                          textMark={textMark}
                        />
                      </div>
                      <button class="bottom-0 absolute left-0 right-0 z-100 p-2 bg-border-regular rounded-0 app-text-subheadline c-tg_text"
                        onClick={() => dialogParams[1](false)}
                      >
                        {t('task history description view close')}
                      </button>
                    </Dialog>
                  </>;
                }}
              </Update>
            </Match>
            <Match when={field === 'id' && props.update.newValue}>
              <p class="m-0 c-tg_hint app-text-caption-regular" style="user-select: text">
                {t('task history update', { key: 'create' })}
              </p>
            </Match>
            <Match when={field === 'isCompleted' && props.update.newValue?.isCompleted}>
              <p class="m-0 app-text-caption-regular" style="user-select: text">
                {t('task history update', { key: 'complete' })}
              </p>
            </Match>
            <Match when={field === 'isCompleted' && !props.update.newValue?.isCompleted}>
              <p class="m-0 app-text-caption-regular" style="user-select: text">
                {t('task history update', { key: 'reopen' })}
              </p>
            </Match>
            <Match when={field === 'completedUsers'}>
              <p class="m-0 app-text-caption-regular" style="user-select: text">
                {t('task history update', { key: hasAuthorCompleted() ? 'completedUsersComplete' : 'completedUsersReopen' })}
              </p>
            </Match>
            <Match when={field === 'project'}>
              <p class="m-0 c-tg_hint app-text-caption-regular" style="user-select: text">
                {t('task history update', { key: 'project' })}
              </p>
              <Update<ClientItem> field={field} resolveValue={v => v?.name ?? defaultProject.name}>
                {name => <span>{name}</span>}
              </Update>
            </Match>
            <Match when={field === 'coassignees'}>
              <p class="m-0 c-tg_hint app-text-caption-regular" style="user-select: text">
                {t('task history update', { key: 'coassignees' })}
              </p>
              <Update<ClientUser[]> single field={field}>
                {(oldValue = [], newValue = []) => {
                  const oldUsers: Record<string, ClientUser> = {};
                  const newUsers: Record<string, ClientUser> = {};
                  const stillUsers: Record<string, ClientUser> = {};

                  for (const user of oldValue) {
                    const id = user.userId ?? user.title;

                    oldUsers[id] = user;
                  }

                  for (const user of newValue) {
                    const id = user.userId ?? user.title;

                    if (id in oldUsers) {
                      stillUsers[id] = user;
                      delete oldUsers[id];
                    } else {
                      newUsers[id] = user;
                    }
                  }

                  return <ul class="reset-list mt-1 ltr:(pl-2 b-l-2 b-l-solid b-l-border-regular) rtl:(pr-2 b-r-2 b-r-solid b-r-border) [&_*]:app-text-subheadline">
                    <For each={Object.values(newUsers)}>
                      {user => <>
                        <li>
                          <span class="c-success opacity-65">+ </span>
                          <AssigneeName user={user} />
                        </li>
                      </>}
                    </For>
                    <For each={Object.values(stillUsers)}>
                      {user => <>
                        <li>
                          <AssigneeName user={user} hint />
                        </li>
                      </>}
                    </For>
                    <For each={Object.values(oldUsers)}>
                      {user => <>
                        <li class="c-tg_text decoration-line-through opacity-50">
                          <AssigneeName user={user} hint />
                        </li>
                      </>}
                    </For>
                  </ul>;

                  function AssigneeName(props: { user: ClientUser; hint?: boolean; }) {
                    return <span classList={{ 'c-tg_hint': props.hint, 'cursor-pointer': isUserClickable(props.user) }}
                      onClick={openUserLink(props.user)}
                    >
                      {props.user.title}
                    </span>;
                  }
                }}
              </Update>
            </Match>
            <Match when={field === 'author'}>
              <p class="m-0 c-tg_hint app-text-caption-regular" style="user-select: text">
                {t('task history update', { key: 'author' })}
              </p>
              <Update<ClientUser> field={field} resolveValue={v => v?.title} />
            </Match>
            <Match when={field === 'planDateNotifications' || field === 'dueDateNotifications'}>
              <p class="m-0 c-tg_hint app-text-caption-regular" style="user-select: text">
                {t('task history update', { key: field })}
              </p>
              <Update<TaskNotification[]>
                field={field}
                resolveValue={v => v.map(n => t('task-editor notification-value', n.value, { unit: n.format })).join(', ')}
              />
            </Match>
            <Match when={field === 'planCron'}>
              <p class="m-0 c-tg_hint app-text-caption-regular" style="user-select: text">
                {t('task history update', { key: 'planCron' })}
              </p>
              <Update<string> field={field}>
                {(value, _, task) => <span>{t(`task plan-cron repeat-${detectRepeats(value)}-short`, {
                  'task plan-cron repetition-short': [detectRepeats(value)],
                  [`task plan-cron ${detectRepeats(value)}`]: [task.planDate],
                  // @ts-expect-error ts doesn't yet see all locale types
                  'task plan-cron time': [task.planDate],
                  'task plan-cron weekday': [task.planDate],
                })}</span>}
              </Update>
            </Match>
            <Match when={['planDate', 'dueDate'].includes(field)}>
              <p class="m-0 c-tg_hint app-text-caption-regular" style="user-select: text">
                {t('task history update', { key: field ?? '' })}
              </p>
              <Update<Date> field={field}>
                {value => <span>{t('task plan-date', { date: value })}</span>}
              </Update>
            </Match>
            <Match when={'files' === field}>
              <p class="m-0 c-tg_hint app-text-caption-regular" style="user-select: text">
                {t('task history update', {
                  key: (props.update.newValue?.files?.length ?? -1) > (props.update.oldValue?.files?.length ?? -1)
                    ? 'attach' : 'detach',
                })}
              </p>
              <Update<ClientTaskFile[]> field={field}>
                {(files, isNew) => <For each={files}>
                  {file => {
                    const { createFilePreview, backup } = useFilePreview(preview, task);
                    const { showPreview, index } = createFilePreview(file);

                    return <div class="inline-flex mt-1 max-w-full" classList={{ '[&_*]:decoration-line-through': !isNew }}>
                      <FilePill file={file} onClick={() => showPreview()} />
                      <Show when={index < 0}>
                        <Portal>
                          <Preview files={[file]}
                            index={backup}
                          />
                        </Portal>
                      </Show>
                    </div>;
                  }}
                </For>}
              </Update>
            </Match>
          </Switch>
          <Show when={index() === fields().length - 1}>
            <div class="end absolute ltr:left--8 rtl:right--8 bottom-0 w-6 z-3" style="height: calc(100% - 14px)" />
          </Show>
        </div>
      }</For>
    </TimelineEvent>
  </>;

  function DescriptionViewer(props: {
    title: string;
    description: string;
    subtasks?: Subtask[];
    textMark: Marker<JSX.Element>;
  }) {
    const [isCopied, setCopied] = createSignal(false);

    createEffect(() => {
      if (isCopied()) {
        setTimeout(() => {
          setCopied(false);
        }, 1000);
      }
    });

    return <div class="relative p-4 mt-2 overflow-hidden">
      <button class="absolute right-4 top-1 px-2 button-tertiary flex items-center gap-1 c-tg_text"
        onClick={() => navigator.clipboard.writeText(props.description).then(() => setCopied(true))}
      >
        <Show when={isCopied()} fallback={<>{t('task history description view copy')} <Document class="fill-tg_hint h-4" /></>}>
          {t('task history description view copied')}
        </Show>
      </button>
      <p class="mt--2 mb-2 app-text-body-regular! b-b-1 b-b-solid b-b-border-regular pb-1">
        {props.title}:
      </p>
      <div class="relative overflow-hidden [&_p]:(m-0 user-select-text)">
        <MultilineRaw lines={props.description}>{line =>
          <p class="m-0 select-text!" style="user-select:text!important">
            {props.textMark.mark(line)}
          </p>
        }</MultilineRaw>

        <Show when={props.subtasks}>
          <Subtasks list={props.subtasks ?? []} />
        </Show>
      </div>
    </div>;
  }

  function Update<T extends FullClientTask[keyof FullClientTask & string]>(_props: {
    field: string;
    children: (oldValue?: T, newValue?: T) => JSX.Element;
    single: true;
  }): JSX.Element;
  function Update<T extends FullClientTask[keyof FullClientTask & string]>(_props: {
    field: string;
    children?: (value: string, isNew: boolean, update: Partial<FullClientTask>) => JSX.Element;
    resolveValue: (v: T) => string;
  }): JSX.Element;
  function Update<T extends FullClientTask[keyof FullClientTask & string]>(_props: {
    field: string;
    children?: (value: T, isNew: boolean, update: Partial<FullClientTask>) => JSX.Element;
  }): JSX.Element;
  function Update<T extends FullClientTask[keyof FullClientTask & string]>(_props: {
    field: string;
    children?: (value: any, value2?: any, value3?: any) => JSX.Element;
    resolveValue?: (v: T) => any;
    single?: true;
  }) {
    const getPropValue = ((task?: Partial<FullClientTask>) => _props.field !== '' ? task?.[_props.field as keyof typeof task] as T : undefined) as {
      (task: Partial<FullClientTask>): T;
      (task?: Partial<FullClientTask>): T | undefined;
    };

    return <Show when={!_props.single}
      fallback={
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        _props.children!(getPropValue(props.update.oldValue), getPropValue(props.update.newValue))
      }
    >
      <Show when={has('newValue') && has('oldValue')}
        fallback={
          <>
            <Show when={has('oldValue')}>
              <p class="m-0 c-tg_hint [&_*]:app-text-subheadline" style="user-select: text">
                <Value value={props.update.oldValue} />
              </p>
            </Show>
            <Show when={has('newValue')}>
              <p class="m-0 c-tg_text opacity-90 [&_*]:app-text-subheadline" style="user-select: text">
                <Show when={_props.field !== 'files'}>
                  <span style="user-select: text" class="c-success opacity-90">+ </span>
                </Show>
                <Value value={props.update.newValue} new />
              </p>
            </Show>
          </>
        }
      >
        <p class="m-0 c-tg_text [&_*]:app-text-subheadline" style="user-select: text">
          <span class="decoration-line-through c-tg_hint" style="user-select: text">
            <Value value={props.update.oldValue} />
          </span>
          <span style="user-select: text" class="opacity-90"> → </span>
          <span style="user-select: text" class="opacity-90">
            <Value value={props.update.newValue} new />
          </span>
        </p>
      </Show>
    </Show>;

    function has(value: 'oldValue' | 'newValue') {
      const field = _props.field as typeof props.update.field;

      if (!field) {
        return false;
      }

      const prop = props.update[value]?.[field];

      switch (typeof prop) {
        case 'object':
          return Array.isArray(prop) ? prop.length > 0 : prop != null;

        default:
          return !!prop;
      }
    }

    function Value(props: { value: Partial<FullClientTask> | undefined; new?: boolean }) {
      return <Show when={props.value} fallback={t('task history update empty')}>
        {displayValue(props.new)}
      </Show>;
    }

    function displayValue(isNew?: boolean) {
      return (value: () => Partial<FullClientTask>) =>{
        const propValue = getPropValue(value());
        const resolvedValue = _props.resolveValue?.(propValue) ?? propValue;
        return <span>{_props.children?.(resolvedValue, isNew, value()) ?? String(resolvedValue ?? '')}</span>;
      };
    }
  }
}

function useFilePreview(preview?: FilePreviewController, task?: () => FullClientTask) {
  const indexOf = (file: ClientTaskFile) => task?.().files.findIndex(f => f.id === file.id) ?? -1;
  const backup = createSignal<number>();

  const showPreview = (index: number) => {
    return index > -1
      ? preview?.show(index)
      : set(backup, 0);
  };

  createEffect(() => {
    if (typeof get(backup) === 'number' && isMobile() && window.scrollY === 0) {
      window?.scrollTo({ behavior: 'smooth', top: 1 });
    }
  });

  return { createFilePreview: (file: ClientTaskFile) => {
    const index = indexOf(file);
    return { showPreview: () => showPreview(index),  index };
  }, backup };
}

function openUserLink(info: ClientUser) {
  return (e: MouseEvent) => {
    if (info.userName) {
      e.stopPropagation();
      WebApp.openTelegramLink(`https://t.me/${info.userName}`);
    }
  };
}

function openCommentLink(link: string | undefined) {
  return link ? () => WebApp.openTelegramLink(link) : undefined;
}

function isUserClickable(info: ClientUser) {
  return !!info.userName;
}

type UpdateTypes = keyof typeof import('f/task/locales/en.json')['task history update']['dictionary'] | '';

const iconPerUpdateType = {
  author: ReporterOutlined,
  coassignees: AssigneeOutlined,
  description: ListIcon,
  title: ListIcon,
  dueDate: FlagFilled,
  planDate: Calendar,
  planDateNotifications: Alarm,
  dueDateNotifications: Alarm,
  planCron: Repeat,
  complete: Checkmark,
  reopen: CheckmarkEmpty,
  completedUsersComplete: Checkmark,

  completedUsersReopen: (_props: ComponentProps<'svg'>) => <></>,
  project: Project,
  create: Plus,
  attach: Attach,
  detach: Attach,
  '': More,
} satisfies {
  [key in UpdateTypes]: typeof History;
};

const viewBoxPerUpdateType = {
  planCron: '0 0 24 24',
} as {
  [key in UpdateTypes]?: string;
};

function UpdateIcon(props: { type: UpdateTypes } & ComponentProps<'svg'>) {
  return <Dynamic component={iconPerUpdateType[props.type]} {...props}
    classList={{
      'fill-success': props.type === 'complete' || props.type === 'completedUsersComplete',
      'fill-urgent': props.type === 'dueDate',
      'ml--1 mt--0.75 scale-90': props.type === '',
      'scale-110! mx-0.5!': props.type === 'planDateNotifications' || props.type === 'dueDateNotifications',
    }}
    viewBox={viewBoxPerUpdateType[props.type]}
  />;
}

function getUpdateType(item: ClientTaskHistoryUpdate, fieldOverride?: string): UpdateTypes {
  const field = fieldOverride ?? item.field;

  if (field === 'id' && item.newValue) {
    return 'create';
  }

  if (field === 'isCompleted' && item.newValue?.isCompleted) {
    return 'complete';
  }

  if (field === 'isCompleted' && !item.newValue?.isCompleted) {
    return 'reopen';
  }

  if (field === 'files' && item.newValue) {
    return 'attach';
  }

  if (field === 'files' && !item.newValue) {
    return 'detach';
  }

  if (field === 'completedUsers' && !item.newValue?.completedUsers?.length) {
    return 'completedUsersReopen';
  }

  if (field === 'completedUsers' && item.newValue?.completedUsers?.length) {
    return 'completedUsersComplete';
  }

  return field as UpdateTypes;
}
