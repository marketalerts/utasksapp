import { Show } from 'solid-js';
import type { Accessor, ComponentProps, JSX } from 'solid-js';
import { omit } from 'rambda';

import Folders from 'i/Folders.svg';

export default function ProjectSelectButton(props: ComponentProps<'button'> & {
  isSelected: Accessor<boolean>;
  icon?: JSX.Element;
  neutralText?: boolean;
}) {
  return <button {...omit(['isSelected'], props)}
    class="=project-select-toggle flex gap-1 items-center bg-transparent disabled:bg-transparent p-0 overflow-hidden min-w-7"
    tabIndex={5}
    type="button"
  >
    <Show when={props.icon}
      fallback={
      <Folders class="= min-w-6"
        classList={{
          'fill-tg_button': props.isSelected() && !props.disabled,
          'fill-tg_hint': !props.isSelected() || props.disabled,
        }} />
      }
    >
      {props.icon}
    </Show>

    <span class="= app-text-subtitle text-nowrap text-ellipsis max-w-full overflow-hidden ltr:mr-1 rtl:ml-1"
      classList={{
        'c-tg_button': !props.neutralText && props.isSelected() && !props.disabled,
        'c-tg_hint': !props.isSelected() || props.disabled,
        'c-tg_text!': props.neutralText,
      }}
    >
      {props.children}
    </span>
  </button>;
}
