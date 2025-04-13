import WebApp from 'tma-dev-sdk';
import { get, set } from 'solid-utils/access';
import { Show, Suspense, createMemo, createRenderEffect, on, useContext } from 'solid-js';
import type { Accessor } from 'solid-js';
import { once } from 'rambda';
import { useNavigate, useParams } from '@solidjs/router';

import { isIOS } from 'shared/platform';
import { getConfigArray, getConfigString } from 'shared/firebase';

import { ProfileContext } from 'f/profile/profile.context';
import { Permissions } from 'f/profile/profile.adapter';
import type { ClientPermission } from 'f/profile/profile.adapter';
import { GroupTreeContext } from 'f/group/list.context';

import { t } from './locales';

import { useDialog } from 'shared/ui/use-dialog';

import NewProject from 'f/project/project-form.ui';
import NewArea from 'f/group/area-form.ui';

import NewItem from './new-item.ui';

import Projects from 'icons/list/Projects.svg';
import PeoplePlus from 'icons/list/PeoplePlus.svg';
import Create from 'icons/list/Create.svg';
import Areas from 'icons/list/Areas.svg';
import Pro from 'icons/Pro.svg';
import Plus from 'i/Plus.svg';


export interface CreateButtonProps {
  newTaskOnly?: boolean;
  onCreate?: () => void;
  onPrivateProjectClick?: () => void;
  onAreaClick?: () => void;
  hidden?: boolean;
}

// TODO: optimize - do not load the button for each page, include in a "layout"
export default (props: CreateButtonProps) => {
  const [isDialogOpen, setIsDialogOpen, bindDialogToSignal] = useDialog();

  const navigate = useNavigate();
  const params = useParams();

  const getProjectId = () => params.projectId ?? '';

  const onButtonClick = () => {
    if (props.newTaskOnly) {
      navigate('create-task');
    } else {
      setIsDialogOpen(!isDialogOpen());
    }

    WebApp.HapticFeedback.impactOccurred('soft');
  };

  const [profile, { refetch }] = useContext(ProfileContext);

  const publicCount = createMemo(() => profile.latest.getPermission(Permissions.PublicProjectLimit));
  const privateCount = createMemo(() => profile.latest.getPermission(Permissions.PrivateProjectLimit));
  const areaCount = createMemo(() => profile.latest.getPermission(Permissions.AreaLimit));

  return <>
    <button onClick={onButtonClick}
      type="button"
      id="create-button"
      class="=create-button
        bg-tg_button!
        fixed rounded-4.5 flex items-center justify-center
        p-0 b-0 w-12 h-12 z-100 right-4
        app-transition-bottom
      "
      classList={{
        'safe-bottom': !props.hidden,
        'bottom--40!': props.hidden,
      }}
    >
      <Plus classList={{ 'rotate--45': isDialogOpen() }}
        class="= fill-white app-transition-transform w-6 h-6"
      />
    </button>

    {/* This is needed due to the need to show the button alongside the dialog window */}
    <div id="artificial-backdrop" onClick={() => setIsDialogOpen(false)}
      class="=artificial-backdrop fixed top-0 ltr:left-0 rtl:right-0 p-4 w-app h-app z-99 bg-overlay"
      classList={{ 'hidden': !isDialogOpen() }}
    >
    </div>

    <Show when={!props.newTaskOnly}>
      <dialog ref={bindDialogToSignal}
        class="fixed b-0 p-0 bg-tg_bg z-100"
        classList={{
          'max-w-full w-full m-0 bottom-0 overflow-hidden': props.newTaskOnly,
          'w-auto mx-4 my-0 safe-bottom-82! rounded-3': !props.newTaskOnly,
          'border-rounded-t-3': props.newTaskOnly && !isIOS(),
          'border-rounded-b-3': props.newTaskOnly && isIOS(),
        }}
        style={props.newTaskOnly ? isIOS() ? {
          top: 0,
        } : {
          top: 'unset',
          bottom: 0,
        } : {}}
      >
        <Suspense>
          <ul class="reset-list py-2">
            <NewItem id="task" title={t('new-task title')}
              description={t('new-task desc')}
              type="modal"
              icon={<Create/>}
              onClick={() => navigate(getProjectId() + '/create-task')}
            />

            <CreatePublicProject publicCount={publicCount} />

            <NewItem id="private-project" title={t('new-project title')}
              description={t('new-project desc')}
              type="modal"
              icon={<Projects/>}
              disabled={!privateCount()?.canUse()}
              disabledLink="/subscribe"
              badgeIcon={
                <Show when={privateCount()?.canUse()}
                  fallback={<span class="= app-text-footnote"><Pro class="= h-4 w-4" /> Pro</span>}
                >
                  <Show when={privateCount().limit}>
                    <span class="= c-tg_hint app-text-footnote">
                      {privateCount().used}/{privateCount().limit}
                    </span>
                  </Show>
                </Show>
              }

              onClick={() => props.onPrivateProjectClick?.() && setIsDialogOpen(false)}
            >
              { dialogSignal => {
                createRenderEffect(on(() => get(dialogSignal), () => {
                  if (get(dialogSignal)) {
                    setIsDialogOpen(false);
                  } else {
                    // setIsDialogOpen(true);
                  }
                }, { defer: true }));

                return <NewProject isContainerOpen={get(dialogSignal)}
                  setContainerState={isOpen => set(dialogSignal, isOpen)}
                  onDone={() => (refetch(), props.onCreate?.())}
                />;
              }}
            </NewItem>

            <NewItem id="area" title={t('new-area title')}
              description={t('new-area desc')}
              type="modal"
              icon={<Areas/>}
              badgeIcon={
                <Show when={!areaCount()?.canUse()}>
                  <span class="= app-text-footnote"><Pro class="= h-4 w-4" /> Pro</span>
                </Show>
              }
              disabled={!areaCount()?.canUse()}
              disabledLink="/subscribe"

              onClick={() => props.onAreaClick?.() && setIsDialogOpen(false)}
            >
              { dialogSignal => {
                createRenderEffect(on(() => get(dialogSignal), () => {
                  if (get(dialogSignal)) {
                    setIsDialogOpen(false);
                  } else {
                    // setIsDialogOpen(true);
                  }
                }, { defer: true }));

                return <NewArea isContainerOpen={get(dialogSignal)}
                  setContainerState={isOpen => set(dialogSignal, isOpen)}
                  onDone={() => (refetch(), props.onCreate?.())}
                />;
              }}
            </NewItem>
          </ul>
        </Suspense>
      </dialog>
    </Show>
  </>;
};

export function CreatePublicProject(props: { publicCount?: ClientPermission | Accessor<ClientPermission> }) {
  const [, groupTree] = useContext(GroupTreeContext) ?? [];

  function refreshOnBodyInteraction() {
    const update = once(() => {
      setTimeout(() => {
        groupTree?.refetch();
      }, 1000);

      document.body.removeEventListener('scroll', update);
      document.body.removeEventListener('click', update);
      document.body.removeEventListener('focusin', update);
      document.body.removeEventListener('keydown', update);
      document.body.removeEventListener('mousemove', update);
    });

    if (groupTree) {
      document.body.addEventListener('scroll', update);
      document.body.addEventListener('click', update);
      document.body.addEventListener('focusin', update);
      document.body.addEventListener('keydown', update);
      document.body.addEventListener('mousemove', update);
    }
  }

  const createPublicProject = () => {
    // const projectId = sessionStorage.getItem(startParamKey);

    Promise.all([
      getConfigArray<string>('platformwarning').catch(() => [] as string[]),
      getConfigString('boturl').catch(() => 'https://t.me/UTasksBot'),
    ])
      .then(([unsupported, botLink]) => {
        if (unsupported?.includes(WebApp.platform)) {
          try {
            WebApp.openTelegramLink(`${botLink || 'https://t.me/UTasksBot'}?startgroup=1`);
            WebApp.showAlert(t('platform warning'));
          } catch (error) {
            alert(t('platform warning'));
          }
        } else {
          try {
            WebApp.openTelegramLink(`${botLink || 'https://t.me/UTasksBot'}?startgroup=1`);
            refreshOnBodyInteraction();
          } catch (e) {
            WebApp.showPopup({
              title: t('new-project-public error-title'),
              message: String(e).slice(0, 240).concat('…'),
            });
          }
        }
      })
      .catch(() => {
        try {
          WebApp.openTelegramLink(`${'https://t.me/UTasksBot'}?startgroup=1`);
          refreshOnBodyInteraction();
        } catch (e) {
          WebApp.showPopup({
            title: t('new-project-public error-title'),
            message: String(e).slice(0, 240).concat('…'),
          });
        }
      });
  };

  const publicCount = typeof props.publicCount === 'function'
    ? props.publicCount
    : createMemo(() => props.publicCount as ClientPermission | undefined);

  return <NewItem id="public-project" title={t('new-project-public title')}
    description={t('new-project-public desc')}
    type="modal"
    icon={<PeoplePlus />}
    onClick={createPublicProject}
    disabled={isDisabled()}
    disabledLink="/subscribe"
    badgeIcon={<Show when={!isDisabled()}
      fallback={<span class="= app-text-footnote"><Pro class="= h-4 w-4" /> Pro</span>}
    >
      <Show when={publicCount()?.limit}>
        <span class="= c-tg_hint app-text-footnote">
          {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
          {publicCount()!.used}/{publicCount()!.limit}
        </span>
      </Show>
    </Show>} />;

  function isDisabled(): boolean | undefined {
    const count = publicCount();

    return count && !count.canUse(count.used === 0 ? -1 : undefined);
  }
}
