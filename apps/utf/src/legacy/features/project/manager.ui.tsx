import WebApp from 'tma-dev-sdk';
import { set, get } from 'solid-utils/access';
import { For, Show, Suspense, Switch, Match, createEffect, createMemo, createRenderEffect, createSignal, on, onMount, useContext } from 'solid-js';
import { A } from '@solidjs/router';

import { isMobile, setFrameColor } from 'shared/platform';
import { UserStatus } from 'shared/network/schema';

import type { ClientTask } from 'f/task/task.adapter';
import { FilterType } from 'f/task/list.adapter';
import { ProfileContext } from 'f/profile/profile.context';
import { Permissions } from 'f/profile/profile.adapter';
import { getCurrentProjectGear } from 'f/dynamic-settings/profile-settings/client-only';

import { SelectedModeContext, getTasksForMode } from './view-mode.context';
import { defaultViewModes } from './view-mode.adapter';
import { UsersContext } from './users.context';
import { ProjectContext, defaultProject, getProjectDataFromHref } from './project.context';
import { isArea, isGroup, ProjectType } from './project.adapter';

import { t as tTask } from 'locales/task';
import { t } from 'locales/project';
import { t as tGroup } from 'locales/group';

import { Loader } from 'shared/ui/loader.ui';
import Accordeon from 'shared/ui/accordeon';

import TaskList from 'f/task/list.ui';
import AddBotBar from 'f/profile/add-bot-bar.ui';
import CreateTask from 'f/home/create-task.ui';
import List from 'f/group/explorer-list.ui';
import { ItemIcon } from 'f/group/explorer-item.ui';
import CreateButton from 'f/create-button/create-button.ui';

import ViewModeSwitcher from './view-mode-switcher.ui';
import ProjectHeader from './ui/header';
import EmptyListCard from './ui/empty-card';

import Gear from 'icons/GearW.svg';
import AreaIcon from 'icons/30/Areas.svg';

export default function Project() {
  onMount(() => {
    //setFrameColor('bg_color');
  });

  const selectedMode = useContext(SelectedModeContext);
  const deletePendingId = createSignal('');
  const hrefProject = createMemo(getProjectDataFromHref());

  const [profile, { refetch: updateProfile }] = useContext(ProfileContext);
  const [project, { refetch: updateProjectInfo }] = useContext(ProjectContext);

  const [tasks, viewModes, { refetch, isModeOpen }] = getTasksForMode(selectedMode, {
    project: () => project.loading ? hrefProject() ?? project.latest : project.latest,
    preload: true,
    filter: hrefProject().id === 'g_compl'
      ? FilterType.Completed
      : FilterType.NotCompleted,
  });

  createEffect(on(() => get(selectedMode), (mode) => {
    defaultViewModes().forEach((_, dmode) => {
      set(isModeOpen[dmode], dmode === mode);
    });
  }));

  const [completed, completedViewModes, {
    refetch: refetchCompleted,
    dirtyModes: dirtyCompletedModes,
    isModeOpen: isModeCompletedOpen,
  }] = getTasksForMode(selectedMode, {
    project: hrefProject,
    filter: hrefProject().id !== defaultProject.id && isGroup(project.latest)
      ? null
      : FilterType.Completed,

    processViewModes(modes) {
      return hrefProject().id !== defaultProject.id && isGroup(project.latest) ? {
        latest: [undefined],
        state: 'ready',
      } : modes;
    },
  });

  const canUsePublicProjects = createMemo(() => profile.latest.canUse(Permissions.PublicProjectLimit, true));

  const subtitle = () => {
    return isProjectPublic() && project.latest.userCount
      ? t('subtitle public', { members: [project.latest.userCount] })
      : undefined;
  };

  const isQuickCreateOpen = createSignal(false);

  const onTaskCreate = () => {
    refetch();

    if (profile.latest.isFree) {
      updateProjectInfo();
      updateProfile();
    }
  };

  return <>
    <ProjectHeader href={(project.latest.type ?? ProjectType.Dynamic) === ProjectType.Dynamic ? undefined : 'details'}
      id={project.latest.id}
      title={tGroup('group-name', project.latest.name) || project.latest.name || <span class="= c-tg_hint">{t('list loading')}</span>}
      subtitle={subtitle()}

      icon={<Show when={project.latest.icon || !isArea(project.latest)} fallback={<AreaIcon />}>
        <ItemIcon name={project.latest.id}
          url={project.latest.icon}
          type={project.latest.type}
          fallback={project.latest.name}
          id={project.latest.id}
        />
      </Show>}

      rightFallback={
        <Switch fallback={<div class="= min-w-8"/>}>
          <Match when={isLoadingHeader() || isLoadingTasks() || isLoadingCompleted()}>
            <Loader class="= z-2 app-transition-opacity" />
          </Match>
          <Match when={project.latest.type !== ProjectType.Dynamic || isArea(project.latest)}>
            <A href={getCurrentProjectGear() && isProjectPublic() && profile.latest.isPro ? 'details/settings' : 'details'}
              class="relative z-1 rounded-full bg-tg_bg_tertiary min-w-9 h-9 flex items-center justify-center mx--0.5 app-transition-opacity"
            >
              <Gear class="= fill-tg_text" />
            </A>
          </Match>
          <Match when={project.latest.id === defaultProject.id}>
            <A href="details/settings"
              class="relative z-1 rounded-full bg-tg_bg_tertiary min-w-9 h-9 flex items-center justify-center mx--0.5 app-transition-opacity"
            >
              <Gear class="= fill-tg_text" />
            </A>
          </Match>
        </Switch>
      }
    >
      <Show when={hrefProject().id !== defaultProject.id && !isProjectPrivate()}
        fallback={(WebApp.HapticFeedback.selectionChanged(), null)}
      >
        <ViewModeSwitcher viewModes={viewModes} model={selectedMode} small />
      </Show>
    </ProjectHeader>

    <Show when={project.latest.id !== 'g_compl'}>
      <div class="= flex flex-col p-4 gap-4 pb-0">
        <AddBotBar />

        <Show when={canUserCreateTasks() || hrefProject().id === defaultProject.id}
          fallback={
            <Show when={!isArea(project.latest) && project.latest.type !== ProjectType.Dynamic && !isLoadingHeader()}>
              <List each={[{
                id: t('limit-exceeded title'),
                name: t('limit-exceeded title'),
                description: t('limit-exceeded desc'),
                href: '/subscribe',
                bold: true,
                icon: 'premium-star',
                type: ProjectType.Dynamic,
                used: false,
                position: 0,
                userCount: 0,
              }]} />
            </Show>
          }
        >
          <CreateTask onCreate={onTaskCreate} isOpen={isQuickCreateOpen} showLimitHint />
        </Show>
      </div>
    </Show>

    <main class="= flex flex-col p-4 gap-4 pb-20.5 app-transition-filter grayscale-0"
      classList={{ 'grayscale-40': isLoadingHeader() || isLoadingTasks() }}
    >
      <For each={tasks[0].latest} fallback={<Loading />}>
        {(taskGroups, mode) => <TaskListViewMode taskList={taskGroups} taskMode={/* @once */mode()} />}
      </For>
    </main>

    <Show when={project.latest.id !== 'g_compl' && canUserCreateTasks()}>
      <CreateButton newTaskOnly
        onCreate={onTaskCreate}
        hidden={isMobile() && get(isQuickCreateOpen)}
      />
    </Show>
  </>;

  function canUserCreateTasks(): boolean | null | undefined {
    const canCreateTasks = taskLimit().canUse(project.latest.count);

    return (
      isProjectPrivate()
        ? canCreateTasks
        : canCreateTasks && (canUsePublicProjects() || project.latest.used)
    );
  }

  function taskLimit() {
    return isProjectPrivate()
      ? profile.latest.getPermission(Permissions.PrivateProjectTaskCount, true)
      : profile.latest.getPermission(Permissions.PublicProjectTaskCount, true);
  }

  function TaskListViewMode(_props: { taskMode: number, taskList?: [string, ClientTask[]][] }) {
    return <Show when={_props.taskMode === get(selectedMode)}>
      <For each={_props.taskList}
        fallback={
          <Show when={!isLoadingTasks() && !isLoadingHeader()} fallback={<Loading />}>
            <Show when={project.latest.id !== 'g_compl'}>
              <div class="= rounded-2 bg-tg_bg py-1">
                <Suspense fallback={<EmptyListCard />}>
                  <EmptyListCard group={project.latest.type === ProjectType.Public} />
                </Suspense>
              </div>
            </Show>
          </Show>
        }
      >
        {([groupName, taskGroup]) => <ConditionalTaskListGroup groupName={groupName} taskGroup={taskGroup} />}
      </For>

      <Show when={completedViewModes.latest?.[_props.taskMode]?.count}>
        <Accordeon
          title={/*@once*/tGroup('group-name', { value: 'g_compl' })}
          amount={completedViewModes.latest?.[_props.taskMode]?.count}
          isOpen={false}
        >
          {(isOpen) => {
            createRenderEffect(() => {
              set(isModeCompletedOpen[_props.taskMode], isOpen());
            });

            return <Show when={isOpen()}>
              <Show when={!dirtyCompletedModes[_props.taskMode] || completed[0].state === 'ready'}
                fallback={<Loading />}
              >
                <TaskListView taskGroup={completed[0].latest?.[_props.taskMode]?.[0]?.[1] ?? []} />
              </Show>
            </Show>;
          }}
        </Accordeon>
      </Show>
    </Show>;
  }

  function ConditionalTaskListGroup(_props: { groupName: string, taskGroup: ClientTask[] }) {
    return <Show when={_props.groupName}
      fallback={<div class="= rounded-2 bg-tg_bg overflow-hidden"
      >
        <TaskListView taskGroup={_props.taskGroup} />
      </div>}
    >
      <Accordeon
        id={/*@once*/_props.groupName.replace(/[^a-z0-9-_]/gi, '_')}
        title={/*@once*/tTask('task group-name', { key: _props.groupName.replace('\n', ''), fallback: _props.groupName })}
        amount={/*@once*/_props.taskGroup.length}
      >
        {() => <TaskListView taskGroup={_props.taskGroup} />}
      </Accordeon>
    </Show>;
  }

  function TaskListView(_props: { taskGroup: ClientTask[] }) {
    const [users] = useContext(UsersContext) ?? [];

    const isAdmin = () => !!(
      users?.latest.some(u => (
        [UserStatus.Administrator, UserStatus.Creator].includes(u.status ?? UserStatus.None)
        && u.userId === WebApp.initDataUnsafe.user?.id
      ))
    );

    return <TaskList
      isUserAdmin={isAdmin()}
      fallback={<Loading />}
      tasks={_props.taskGroup}
      onTaskCompleted={async () => (await refetch(), await refetchCompleted())}
      onTaskDeleted={async () => (await refetch(), await refetchCompleted())}
      deletePendingId={deletePendingId}
      privateTaskList={project.latest.type === ProjectType.Private}
      showProject={isGroup(project.latest) && ['g_all', 'g_next7', 'g_compl'].includes(project.latest.id)}
    />;
  }

  function isProjectPublic() {
    return (hrefProject()?.type ?? project.latest.type) === ProjectType.Public;
  }

  function isProjectPrivate() {
    return (hrefProject()?.type ?? project.latest.type) === ProjectType.Private;
  }

  function isLoadingHeader() {
    return viewModes.loading || project.loading || profile.loading;
  }

  function isLoadingTasks() {
    return tasks[0].loading;
  }

  function isLoadingCompleted() {
    return completed[0].loading;
  }
}

function Loading() {
  return <Suspense><span>{t('list loading')}…</span></Suspense>;
}
