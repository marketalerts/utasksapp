import WebApp from 'tma-dev-sdk';
import { model, useDirectives } from 'solid-utils/model';
import { get, set } from 'solid-utils/access';
import { Show, Suspense, createSelector, createSignal, onMount, onCleanup, useContext, createMemo } from 'solid-js';
import type { JSX, Resource } from 'solid-js';
import { F, ifElse, includes, isNil, keys, pipe, reject, toLower } from 'rambda';

import { setFrameColor } from 'shared/platform';

import { requestUsersUpdate } from 'f/project/users.network';
import { ClientUser } from 'f/project/users.adapter';
import { defaultProject } from 'f/project/project.context';
import { ProfileContext } from 'f/profile/profile.context';
import { Permissions } from 'f/profile/profile.adapter';

import { t as tTask } from 'locales/task';
import { t as tProject } from 'locales/project';
import { t } from 'locales/create-button';

import { BackButton, MainButton } from 'shared/ui/telegram';
import { ProLink } from 'shared/ui/pro-link';
import { Loader } from 'shared/ui/loader.ui';
import List from 'shared/ui/list';
import { InitialsAvatar } from 'shared/ui/initials-avatar';

import { ItemIcon } from 'f/group/explorer-item.ui';

import Dismiss from 'icons/Dismiss.svg';
import Checkmark from 'icons/Checkmark.svg';
import ArrowClockwise from 'icons/ArrowClockwise.svg';
import Magnifier from 'i/Magnifier.svg';


interface ContactsProps {
  title?: string;
  projectId?: string;
  currentUsers?: ClientUser[];
  limit?: number;
  users: Resource<ClientUser[]>;
  refetchUsers: VoidFunction;
  onItemClick: (items?: ClientUser[]) => void;
  disallowEmpty?: boolean;
  leftCorner?: JSX.Element;
  close?(): void;
}

export default function Contacts(props: ContactsProps) {
  const headerColor = WebApp.headerColor;

  onMount(() => setFrameColor('secondary_bg_color'));
  onCleanup(() => setFrameColor(headerColor ?? 'bg_color'));

  useDirectives(model);

  const [profile] = useContext(ProfileContext);

  const users = props.users;

  const selectedUsers = createSignal(props.currentUsers ?? []);

  const nullUser = ClientUser.fromRaw({
    title: t('new-task contacts-remove-assignee-title'),
    userName: 'X',
  });

  const filterText = createSignal('');

  const byText = (user: ClientUser): boolean => (
    keys(user)
      .some(pipe(
        key => user[key],
        ifElse(isNil, F, pipe(
          String,
          toLower,
          includes(get(filterText).replace('@', '').toLowerCase()),
        )),
      ))
  );

  const filteredUsers = () => users.latest?.filter(byText) ?? [];

  const buttonColor = getComputedStyle(document.documentElement).getPropertyValue('--tg-theme-button-color');

  const areUsersEqual = (u1: ClientUser) => (u2: ClientUser): boolean => (u1.userName === u2.userName && u1.userId === u2.userId);

  const isSelected = createSelector(
    () => get(selectedUsers),
    (user: ClientUser, users) => users.some(areUsersEqual(user)),
  );

  const overflow = document.body.style.overflow;

  const onBackClick = () => props.close?.();

  onMount(() => {
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      document.getElementById('create-task-input')?.blur();
    }, 100);
  });

  onCleanup(() => {
    document.body.style.overflow = overflow;

    document.getElementById('create-task-input')?.focus();
  });

  const clearUsers = (e?: MouseEvent) => {
    e?.stopPropagation();

    set(selectedUsers, []);

    if (e) {
      props.onItemClick([]);
    }
  };

  const shouldDisableApply = () => props.disallowEmpty && get(selectedUsers).length === 0;

  const applyChanges = () => {
    if (shouldDisableApply()) {
      return;
    }

    props.onItemClick(get(selectedUsers));
    props.close?.();
  };

  const canAssignManyUsers = createMemo(() => {
    const hasPermission = profile.latest.canUse(Permissions.TaskAssigneeLimit, true, 1);

    const hasMultipleLimit = (props.limit ?? Infinity) > 1;

    return hasPermission && hasMultipleLimit;
  });


  const [usersUpdating, setUsersUpdating] = createSignal(false);

  const updateUsers = () => {
    if (!props.projectId) {
      return;
    }

    setUsersUpdating(true);

    requestUsersUpdate(props.projectId)
      .then(() => props.refetchUsers())
      .finally(() => setUsersUpdating(false));
  };

  return <>
    <BackButton
      onClick={onBackClick}
    />
    <MainButton text={t('new-task contacts-save')} disabled={shouldDisableApply()}
      onClick={applyChanges}
    />
    <div class="= fixed top-0 ltr:left-0 rtl:right-0 ltr:right-0 rtl:left-0 bottom-0 overflow-auto z-1000 bg-tg_bg_secondary">
      <div class="= fixed top--200 ltr:left-0 rtl:right-0 ltr:right-0 rtl:left-0 bottom--200 z--1 bg-tg_bg_secondary"></div>
      <div class="= h-11 flex items-center justify-between px-4 py-2">
        <Show when={props.leftCorner}
          fallback={<ItemIcon {...defaultProject} fallback={defaultProject.name} />}
        >
          {props.leftCorner}
        </Show>
        <Suspense fallback={<>Loading...</>}>
          <div class="= flex-grow text-center overflow-hidden px-2">
            <p class="= app-text-body-emphasized my-revert mx-auto text-nowrap text-ellipsis max-w-full overflow-hidden">
              {tProject('subtitle public', { members: [users.latest?.length ?? 0] })}
            </p>
          </div>
        </Suspense>
        <div class="= min-w-8">

          <Show when={!usersUpdating() && !users.loading}
            fallback={<button class="= bg-transparent py-1.35"><Loader class="= h-6! w-6!" /></button>}
          >
            <button class="= bg-transparent" onClick={updateUsers}>
              <ArrowClockwise class="= fill-tg_hint" />
            </button>
          </Show>
        </div>
      </div>
      <div class="p-4 flex flex-col items-stretch gap-4">
        <div class="overflow-hidden flex gap-2 ltr:pl-3 rtl:pr-3 ltr:pr-4 rtl:pl-4 items-center bg-tg_bg_tertiary rounded-3">
          <Magnifier class="= fill-tg_hint" />
          <input type="search" onFocus={e => e.stopPropagation()} onClick={e => e.stopPropagation()}
            class="py-2 w-full flex-grow"
            use:model={filterText}
            placeholder={t('new-task contacts-search-placeholder')}
          />
        </div>

        <ProButton />

        <Suspense fallback="Loading contacts...">
          <List each={filteredUsers()}
            title={
              <div class="= flex justify-between items-center px-3 py-2">
                <p class="= m-0 c-tg_hint uppercase app-text-footnote">{props.title}</p>

                <Show when={canAssignManyUsers()}>
                  <div role="button" class="= c-tg_link app-text-subheadline flex items-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();

                      WebApp.HapticFeedback.selectionChanged();
                      set(selectedUsers, allSelected() ? [] : filteredUsers());
                    }}
                  >
                    <Show when={!allSelected()}
                      fallback={tTask('task-editor contacts-deselect-all')}
                    >
                      {tTask('task-editor contacts-select-all')}
                    </Show>
                  </div>
                </Show>
              </div>
            }
          >
            {(user) => <Show when={user !== nullUser}
              fallback={
                <List.Item onClick={clearUsers}
                  left={
                    <InitialsAvatar
                      user={ClientUser.fromRaw({ title: nullUser.userName!, userName: nullUser.userName })}
                      color={buttonColor} />
                  }
                  right={<Dismiss class="= fill-tg_hint" />}
                >
                  <div class="= flex flex-col">
                    <span class="= app-text-body-regular">{user.title}</span>
                  </div>
                </List.Item>
              }
            >
              <List.Item onClick={onUserClick(user)}
                left={<InitialsAvatar user={user} />}
                right={
                  <>
                    <Show when={typeof props.limit === 'number' && props.limit > 1 && isSelected(user)}>
                      <Show when={get(selectedUsers).length > 0}>
                        <span class="= c-tg_hint app-text-footnote">
                          {get(selectedUsers).indexOf(user) + 1}/{props.limit}
                        </span>
                      </Show>
                    </Show>
                    <Checkmark class="= fill-tg_button app-transition-width,opacity"
                      classList={{
                        'opacity-0 w-0': !isSelected(user),
                      }}
                    />
                  </>
                }
                rightHint={
                  <Show when={!isSelected(user)}>
                    <span class="= c-tg_hint app-text-footnote text-ellipsis whitespace-nowrap overflow-hidden">
                      {tProject('members status', user.status)}
                    </span>
                  </Show>
                }
              >
                <div class="= flex flex-col">
                  <span class="= app-text-body-regular">{user.title}</span>
                  <span class="= app-text-subheadline c-tg_hint">@{user.userName}</span>
                </div>
              </List.Item>
            </Show>}
          </List>
        </Suspense>
        <Show when={WebApp.platform === 'unknown'}>
          <div role="button" onClick={onBackClick}>close</div>
          <div role="button" onClick={applyChanges}>apply</div>
        </Show>
      </div>
    </div>
  </>;

  function allSelected() {
    return get(selectedUsers).length === (props.users.latest?.length ?? -1);
  }

  function onUserClick(user: ClientUser): JSX.EventHandlerUnion<HTMLLIElement, MouseEvent> | undefined {
    return (e) => {
      e.stopPropagation();
      if (isSelected(user)) {
        set(selectedUsers, reject(areUsersEqual(user), get(selectedUsers)));
      } else {
        if (props.limit && ((selectedUsers.length + 1) >= props.limit)) {
          set(selectedUsers, [...get(selectedUsers).slice(0, props.limit - 1), user]);
        } else {
          set(selectedUsers, [...get(selectedUsers), user]);
        }
      }

      WebApp.HapticFeedback.selectionChanged();
    };
  }
}

function ProButton() {
  const [profile] = useContext(ProfileContext);

  const canAssignUsers = createMemo(() => profile.latest.canUse(Permissions.TaskAssigneeLimit, true, 1));

  return <Show when={profile.latest?.isFree && !canAssignUsers()}>
    <ProLink title={t('multiassignee benefit-title')} description={t('multiassignee benefit-desc')} />
  </Show>;
}
