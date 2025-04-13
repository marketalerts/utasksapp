import WebApp from 'tma-dev-sdk';
import { get, set } from 'solid-utils/access';
import { Show, children, createEffect, on, useContext } from 'solid-js';
import type { JSX, Signal } from 'solid-js';

import { UsersContext, createUsersResource } from 'f/project/users.context';
import type { ClientUser } from 'f/project/users.adapter';
import { ProjectContext } from 'f/project/project.context';
import { isArea } from 'f/project/project.adapter';

import { t } from 'f/create-button/locales';

import { useDialog } from 'shared/ui/use-dialog';
import { InitialsAvatar, InitialsAvatars } from 'shared/ui/initials-avatar';

import Contacts from 'f/task/contacts.ui';

import Add from 'i/Add.svg';


export function UserSelect(props: {
  title?: string;
  users: Signal<ClientUser[]>;
  limit?: number;
  projectId?: string;
  projectIcon?: JSX.Element;
  disabled?: boolean;
  gray?: boolean;
  disallowEmpty?: boolean;
  icon?: JSX.Element;
  buttonText?: string;
  hideName?: boolean;

  children?: (onClick: VoidFunction) => JSX.Element;
}) {
  const [
    isContactsDialogOpen, setIsContactsDialogOpen, dialogRef,
  ] = useDialog('modal');

  const resolvedChildren = children(() => props.children?.(() => setIsContactsDialogOpen(true)));

  const [source] = useContext(ProjectContext);
  const usersContext = initUsersContext();

  const [users, { refetch }] = usersContext;

  if (usersContext) {
    createEffect(on(() => props.projectId, (projectId, old) => {
      old !== projectId && refetch(projectId);
    }, { defer: true }));
  }

  return <>
    <Show when={!props.children} fallback={resolvedChildren()}>
      <button onClick={() => setIsContactsDialogOpen(true)}
        class="=user-select-button
          bg-transparent disabled:(bg-transparent c-tg_hint cursor-not-allowed)
          app-text-subtitle contents gap-2 p-0
          min-w-6.5
        "
        tabIndex={3}
        type="button"
        disabled={props.disabled}
        classList={{ 'filter-grayscale': props.gray }}
      >
        <Show when={get(props.users)?.[0]}
          fallback={
            <>
              <Show when={props.icon} fallback={<Add />}>
                {props.icon}
              </Show>
              <span class="= c-tg_hint">
                {props.buttonText ?? t('new-task input-add-assignee')}
              </span>
            </>
          }
        >
          <Show when={!props.hideName}
            fallback={<InitialsAvatars users={get(props.users)} small />}
          >
            <InitialsAvatar user={get(props.users)?.[0]} small />
            <span class={props.disabled ? 'c-tg_hint' : 'c-tg_button'}>
              {get(props.users)?.[0]?.title}
            </span>
          </Show>
        </Show>
      </button>
    </Show>

    <>
      <Show when={isContactsDialogOpen()}>
        <Contacts disallowEmpty={props.disallowEmpty}
          limit={props.limit}
          currentUsers={get(props.users)}
          projectId={props.projectId}
          users={users}
          refetchUsers={refetch}
          title={props.title}
          onItemClick={(items) => {
            set(props.users, items);

            WebApp.HapticFeedback.selectionChanged();
          }}
          close={() => setIsContactsDialogOpen(false)}
          leftCorner={props.projectIcon}
        />
      </Show>
    </>
  </>;

  function initUsersContext() {
    const initialContext = isArea(source.latest) ? undefined : useContext(UsersContext);

    return initialContext ?? createUsersResource(
      () => props.projectId,
    );
  }
}
