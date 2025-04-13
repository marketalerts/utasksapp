import WebApp from 'tma-dev-sdk';
import { get, set } from 'solid-utils/access';
import { children, Match, Show, Switch, useContext } from 'solid-js';
import type { ComponentProps, Signal } from 'solid-js';

import { TaskPriority } from 'shared/network/schema';

import { ProfileContext } from 'f/profile/profile.context';
import { Permissions } from 'f/profile/profile.adapter';

import { t } from 'locales/task';

import ProBadge from 'shared/ui/pro-badge';
import List from 'shared/ui/list';
import Popup from 'shared/ui/floater';

import Undefined from 'icons/24/Priority/Not set.svg';
import Medium from 'icons/24/Priority/Medium.svg';
import Lowest from 'icons/24/Priority/Lowest.svg';
import Low from 'icons/24/Priority/Low.svg';
import Highest from 'icons/24/Priority/Highest.svg';
import High from 'icons/24/Priority/High.svg';
import Check from 'icons/20/Checkmark.svg';
import Pro from 'icons/12/Pro MultiColor.svg';

export const priorityOptions: TaskPriority[] = [
  // TaskPriority.Highest,
  TaskPriority.High,
  TaskPriority.Medium,
  TaskPriority.Low,
  // TaskPriority.Lowest,
  TaskPriority.None,
];

export default function Priority(props: Pick<ComponentProps<'div'>, 'classList' | 'class'> & {
  model: Signal<TaskPriority>;
  disabled?: boolean;
}) {
  const priority = () => get(props.model);
  const [profile] = useContext(ProfileContext);

  const canUse = () => profile.latest.canUse(Permissions.Priority);

  const isDisabled = () => (props.disabled || !canUse()) && priority() === TaskPriority.None;

  return <Popup placement="top-end"
    enterClass="animate-init-fade-in-right"
    exitClass="animate-init-fade-out-right"
  >{{
    opener: (attrs, open) => (
      <button class="ui-button-secondary p-1.5 relative" {...attrs}
        onClick={open}
        type="button"
        classList={{
          ...props.classList,
          [String(props.class)]: !!props.class,
        }}
      >
        <PriorityIcon value={priority()} />

        <Show when={isDisabled()}>
          <Pro class="absolute right-1" />
        </Show>
      </button>
    ),

    floater: (attrs) => (
      <div class="bg-section rounded-3 min-w-40 shadow-2xl z-1001" {...attrs}>
        <List refactor each={priorityOptions}>{opt =>
          <PriorityItem value={opt} />
        }</List>
      </div>
    ),
  }}</Popup>;

  function PriorityItem(_props: { value: TaskPriority }) {
    const isDisabled = () => !canUse() && _props.value !== TaskPriority.None;
    return <List.Item class="cursor-pointer" role="button"
      disabled={isDisabled()}
      right={<Show when={!isDisabled()} fallback={<>
        <ProBadge />
        <Check class="ui-icon-accented" classList={{ 'opacity-0': get(props.model) !== _props.value }} />
      </>}>
        <Check class="ui-icon-accented" classList={{ 'opacity-0': get(props.model) !== _props.value }} />
      </Show>}
      onClick={() => {
        set(props.model, _props.value);
        WebApp.HapticFeedback.selectionChanged();
      }}
    >
      <div class="flex items-center gap-3"
        classList={{
          'opacity-50': isDisabled(),
        }}
      >
        <PriorityIcon value={_props.value} />
        {t('task-editor priority', _props.value)}
      </div>
    </List.Item>;
  }
}

export function PriorityIcon(props: { value: TaskPriority }) {
  return <Switch fallback={<Undefined class="ui-icon-tertiary!" />}>
    <Match when={props.value === TaskPriority.Highest}>
      <Highest />
    </Match>
    <Match when={props.value === TaskPriority.High}>
      <High />
    </Match>
    <Match when={props.value === TaskPriority.Medium}>
      <Medium />
    </Match>
    <Match when={props.value === TaskPriority.Low}>
      <Low />
    </Match>
    <Match when={props.value === TaskPriority.Lowest}>
      <Lowest />
    </Match>
  </Switch>;
}

export function getPriorityColor(value?: TaskPriority) {
  if (!value) return undefined;

  const icon = children(() => <PriorityIcon value={value} />)() as SVGElement;

  const path = icon.querySelector('[fill]');

  return path?.getAttribute('fill');
}