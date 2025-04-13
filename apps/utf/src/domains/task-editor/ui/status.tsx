import { get, set } from 'solid-utils/access';
import { Show, useContext  } from 'solid-js';
import type { Signal } from 'solid-js';

import { TaskStatus } from 'shared/network/schema';

import { ProfileContext } from 'f/profile/profile.context';
import { Permissions } from 'f/profile/profile.adapter';

import { t } from 'locales/task';

import { useDialog } from 'shared/ui/use-dialog';
import ProBadge from 'shared/ui/pro-badge';
import List from 'shared/ui/list';
import Dialog from 'shared/ui/dialog';

import Check from 'icons/20/Checkmark.svg';

export default function (props: {
	model: Signal<TaskStatus>;
}) {
  const dialog = useDialog('modal');
  const [profile] = useContext(ProfileContext);

  const options: {
    status: TaskStatus,
    enabled: () => boolean,
  }[] = [
    { status: TaskStatus.New, enabled: () => true },
    { status: TaskStatus.ToDo, enabled: () => profile.latest.canUse(Permissions.Status) },
    { status: TaskStatus.InProgress, enabled: () => profile.latest.canUse(Permissions.Status) },
    { status: TaskStatus.Review, enabled: () => profile.latest.canUse(Permissions.Status) },
    { status: TaskStatus.Closed, enabled: () => true },
  ];

  return <>
    <button class="ui-button-secondary" onClick={() => dialog[1](true)}>
      {t('task-editor status', get(props.model))}
    </button>

    <Dialog dialogParams={dialog}
      class="p-0 b-0 bg-section rounded-3 m-auto fixed"
    >
      <List refactor each={options}>{opt =>
        <List.Item simple
          disabled={!opt.enabled()}
          classList={{
            '**:c-text-accented': get(props.model) === opt.status,
          }}
          right={
            <div class="flex items-center ltr:ml-10 rtl:mr-10">
              <Show when={opt.enabled()} fallback={<>
                <Check class="ui-icon-accented" classList={{ 'opacity-0': get(props.model) !== opt.status }} />
                <ProBadge />
              </>}>
                <Check class="ui-icon-accented" classList={{ 'opacity-0': get(props.model) !== opt.status }} />
              </Show>
            </div>
          }
          onClick={() => {
            dialog[1](false);
            set(props.model, opt.status);
          }}
        >
          {t('task-editor status', opt.status)}
        </List.Item>
      }</List>
    </Dialog>
  </>;
}