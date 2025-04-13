import WebApp from 'tma-dev-sdk';
import { model, useDirectives } from 'solid-utils/model';
import { get, set } from 'solid-utils/access';
import { mergeProps, createUniqueId, createRenderEffect, on, createSignal, Show } from 'solid-js';
import type { JSX, Signal } from 'solid-js';
import { omit } from 'rambda';

import type { TaskPriority } from 'shared/network/schema';

import Circle from 'icons/CircleOutlined.svg';
import Checkmark from 'icons/CheckmarkCircleFilled.svg';
import { getPriorityColor } from '#/task-editor/ui/priority';

export const enum CheckboxStyle {
  Brand,
  Telegram,
}

export interface CheckboxProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  type?: 'checkbox' | 'radio';
  model?: Signal<boolean>;
  rotateHue?: number;
  checkClass?: string;
  labelClass?: string;
  isGray?: boolean;
  disableFeedback?: boolean;
  iconStyle?: CheckboxStyle;
  children?: JSX.Element;
  priority?: TaskPriority;
}

export default function Checkbox(_props: CheckboxProps) {
  const props = mergeProps({
    id: createUniqueId() + '-checkbox',
    model: createSignal(!!_props.checked),
    type: 'checkbox' as const,
  }, _props);

  createRenderEffect(on(() => props.checked, (checked) => {
    if (checked == null) return;

    set(props.model, checked);
  }));

  useDirectives(model);

  createRenderEffect(on(() => get(props.model), () => {
    if (props.disableFeedback) {
      return;
    }

    WebApp.HapticFeedback.selectionChanged();
  }, { defer: true }));

  return <div role={props.type}
    class="=checkbox-container relative cursor-pointer [&:hover]:filter-saturate-150"
    classList={{ [props.class ?? '']: !!props.class }}
  >
    <input
      class="checkbox-input
        absolute w-full h-full opacity-0 cursor-pointer
        [&:checked+label>div>div]:scale-100 [&:checked+label>div]:saturate
        [&:disabled+label>div,&:disabled+label>div>div]:(b-app-icon-tertiary opacity-50)
        [&:disabled+label>div>div]:(bg-app-icon-tertiary opacity-50)
        pointer-events-none
      "
      classList={{ [props.checkClass ?? '']: !!props.checkClass }}
      use:model={props.model}
      {...omit(['model', 'label', 'class', 'rotateHue', 'labelClass', 'children'], props)}
    />
    <Show when={props.iconStyle === CheckboxStyle.Telegram}
      fallback={
        <label for={props.id}
          class="=checkbox-label h-full flex items-center justify-center overflow-hidden cursor-pointer"
          classList={{ [props.checkClass ?? '']: !!props.checkClass }}
          style={{
            'filter': `hue-rotate(${props.rotateHue ?? 0}deg)` }}
        >
          <div
            class="table w-5 h-5 p-[3px] b-2 b-solid b-app-icon-tertiary b-rounded-1.5 app-transition-border-width"
            classList={{ 'b-app-icon-tertiary!': props.isGray, 'b-tg_button!': !props.disabled && get(props.model) }}
            style={{
              'border-color': getPriorityColor(props.priority),
            }}
            id={`${props.id}-box`}
          >
            <div
              class="=check table-cell w-2 h-2 bg-app-icon-tertiary scale-0 app-transition-transform rounded-0.5"
              classList={{ 'bg-app-icon-tertiary!': props.isGray, 'bg-tg_button!': !props.disabled && get(props.model) }}
              style={{
                'background-color': getPriorityColor(props.priority),
              }}
            />
          </div>
        </label>
      }
    >
      <div class="=check-container w-6 h-6 flex items-center rounded-full relative"
        onClick={() => set(props.model, !get(props.model))}
      >
        <Show when={get(props.model)} fallback={<Circle class="= ui-icon-tertiary min-w-full min-h-full" />}>
          <Checkmark class="=check-icon fill-tg_button min-w-full min-h-full" />
          <div class="=check-outline-tg absolute w-90% h-90% rounded-full ltr:left-5% rtl:right-5% top-5% z--1"
            classList={{ 'bg-tg_button_text': get(props.model) }}
          ></div>
        </Show>
      </div>
    </Show>

    <Show when={props.children}>
      <label for={props.id}
        classList={{ [String(props.labelClass)]: !!props.labelClass }}
        class="= cursor-pointer"
      >
        {props.children}
      </label>
    </Show>
  </div>;
}
