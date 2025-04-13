import WebApp from 'tma-dev-sdk';
import { get, set } from 'solid-utils/access';
import { onMount, createSignal, Show, ErrorBoundary, useContext, Switch, Match, lazy } from 'solid-js';
import type { ComponentProps } from 'solid-js';

import { isMobile, setFrameColor } from 'shared/platform';

import EmptyListCard from 'f/project/ui/empty-card';
import { postProject } from 'f/project/project.network';
import { ProjectType } from 'f/project/project.adapter';
import { ProfileContext } from 'f/profile/profile.context';
import { Permissions } from 'f/profile/profile.adapter';
import type { ClientProfile } from 'f/profile/profile.adapter';
import { GroupTreeContext, createGroupTreeResource } from 'f/group/list.context';
import { postArea } from 'f/group/area.network';
import { displayNews } from 'f/dynamic-settings/profile-settings/client-only';

import { t } from './locales';

import { ProLink } from 'shared/ui/pro-link';

import AddBotBar from 'f/profile/add-bot-bar.ui';
import GroupsExplorer from 'f/group/explorer.ui';
import CreateButton, { CreatePublicProject } from 'f/create-button/create-button.ui';

import ProfileLink from './profile-link.ui';
import CreateTask from './create-task.ui';
import CreateGeneric from './create-generic.ui';

import Stack from 'icons/Stack.svg';
import ProjectsFilled from 'icons/ProjectsFilled.svg';

// import Search from './search.ui';

const News = lazy(() => import('./news.ui'));

const enum CreateMode {
  Task,
  Project,
  Area
}

export default function Home(props: {
  onReorderProject(id: string, index: number, areaId?: string): void;
  onReorderArea(id: string, index: number): void;
}) {
  // const [ref, Overscroll] = useOverscroll();

  const [user, { refetch: updateUser }] = useContext(ProfileContext);

  onMount(() => {
    //setFrameColor('secondary_bg_color');
  });

  const quickCreateMode = createSignal(CreateMode.Task);

  const [, { refetch }] = useContext(GroupTreeContext) ?? createGroupTreeResource();

  const isCreateTaskOpen = createSignal(false);

  return <main class="= h-full p-4 flex flex-col items-stretch gap-4 pb-20.5">
    <ProfileLink profile={user.latest} />

    <Show when={!user.loading && (!user.latest.isPro || get(displayNews))}>
      <News />
    </Show>

    <ProButton profile={user.latest} loading={user.loading} />

    <Switch>
      <Match when={CreateMode.Task === get(quickCreateMode)}>
        <CreateTask isOpen={isCreateTaskOpen} showLimitHint />
      </Match>
      <Match when={CreateMode.Project === get(quickCreateMode)}>
        <CreateGeneric placeholder={t('new-project-quick input-title')}
          icon={<ProjectsFilled class="= fill-tg_hint overflow-initial" />}
          onCreate={name => postProject({ name, type: ProjectType.Private }).then(() => (refetch(), updateUser()))}
          onClose={() => set(quickCreateMode, CreateMode.Task)}
        />
      </Match>
      <Match when={CreateMode.Area === get(quickCreateMode)}>
        <CreateGeneric placeholder={t('new-area-quick input-title')}
          icon={<Stack class="= fill-tg_hint mx-1 overflow-initial" />}
          onCreate={name => postArea({ name }).then(() => (refetch(), updateUser()))}
          onClose={() => set(quickCreateMode, CreateMode.Task)}
        />
      </Match>
    </Switch>

    <AddBotBar />

    <ErrorBoundary fallback={<>{/* TODO */}</>}>
      <GroupsExplorer
        onReorderProject={props.onReorderProject}
        onReorderArea={props.onReorderArea}
      >
      </GroupsExplorer>
    </ErrorBoundary>

    <EmptyListCard hide />

    {/* <Overscroll /> */}

    <CreateButton onCreate={refetch}
      onPrivateProjectClick={() => set(quickCreateMode, CreateMode.Project)}
      onAreaClick={() => set(quickCreateMode, CreateMode.Area)}
      hidden={isMobile() && get(isCreateTaskOpen)}
    />
  </main>;

  function ProButton(props: { profile?: ClientProfile, loading?: boolean }) {
    const Pro = <ProLink title={t('subscribe title')} description={t('subscribe desc')} />;

    return <Show when={props.profile} fallback={
      <PublicProjectLink publicCount={props.profile?.getPermission(Permissions.PublicProjectLimit)}/>
    }>
      {profile =>
        <Show when={!props.loading && !profile().isPro}>
          <Show when={profile().canUse(Permissions.PublicProjectLimit, true)} fallback={Pro}>
            <PublicProjectLink publicCount={profile().getPermission(Permissions.PublicProjectLimit)}/>
          </Show>
        </Show>
      }
    </Show>;

    function PublicProjectLink(_props: ComponentProps<typeof CreatePublicProject>) {
      return <ul class="= reset-list bg-tg_bg rounded-3" id="create-public-project-ad">
        <CreatePublicProject {..._props} />
      </ul>;
    }
  }
}

const useOverscroll = () => {
  const [overscrollHeight, setOverscroll] = createSignal(0);

  const gap = 16;
  const isOverscrollPossible = (additionalHeight = 0) => (
    (document.body.clientHeight - window.innerHeight) > (gap + additionalHeight)
  );

  const scollToGroups = (subscriptionRef: HTMLUListElement) => {
    onMount(() => {
      const top = setOverscroll(subscriptionRef.clientHeight) + gap;

      if (isOverscrollPossible(subscriptionRef.clientHeight)) {
        window.scrollTo({ top });
      }
    });
  };

  WebApp.onEvent('viewportChanged', ({ isStateStable }) => {
    if (isStateStable && WebApp.isExpanded) {
      setOverscroll(0);
    }
  });

  return [
    scollToGroups,
    () => <Show when={isOverscrollPossible() && overscrollHeight() > 0}>
      <div style={{ height: overscrollHeight() + 'px' }}></div>
    </Show>,
  ] as const;
};
