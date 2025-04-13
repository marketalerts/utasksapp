import WebApp from 'tma-dev-sdk';
import { get, set } from 'solid-utils/access';
import { Transition } from 'solid-transition-group';
import { children, createEffect, createSignal, Match, on, Show, Switch } from 'solid-js';
import type { ComponentProps, JSX, Ref, Signal } from 'solid-js';

import { isIOS, isMac } from 'shared/platform';
import { currentTextDirection } from 'shared/l10n';

import type { Subtask, SubtaskItemController } from '#/task-editor/subtasks/definitions';

import { t } from 'locales/task';

import TextArea from 'ui/elements/text-area';
import { useLinkMarker } from 'shared/ui/markers/link';

import PlusOutlined from 'icons/20/Plus Outlined.svg';
import Check from 'icons/20/Checkmark Circle Outlined.svg';
import CheckFilled from 'icons/20/Checkmark Circle Filled.svg';

export const getSubtaskId = (index: number) => `subtask-list-item-${index}`;

export default function (props: {
  index: () => number;
  value: () => Subtask;
  readonly?: boolean;
  children?: (text: string) => JSX.Element;
  ref: Ref<HTMLTextAreaElement>;
  controller: SubtaskItemController;
}) {
  let input!: HTMLTextAreaElement;
  let markedForRemoval = true;

  const ref = (el: HTMLTextAreaElement) => typeof props.ref === 'function' ? props.ref(input = el) : (props.ref = input = el);
  const realValue = createSignal(props.value().title);
  const checked = createSignal(props.value().done);

  createEffect(on(checked[0], () => {
    props.controller.updateState(get(checked));
  }, { defer: true }));

  createEffect(on(props.value, (val) => {
    set(realValue, val.title);
  }, { defer: true }));

  const formatted = children(() => props.children?.(get(realValue)) ?? get(realValue));

  const isFocused = createSignal(false);

  return <>
    <div
      data-id={getSubtaskId(props.index()) + '-container'}
      class="
        relative
        flex items-top ltr:pl-0.5 rtl:pr-0.5 py-2 gap-4.5
        b-b-solid b-b b-b-border-regular last:b-b-transparent! app-transition-border
        overflow-hidden
      "
    >
      {/* TODO: replace this ad-hoc checkbox with a proper one */}
      <button data-id={getCheckboxId()} tabindex={-1}
        onClick={() => {
          if (props.readonly) return;

          WebApp.HapticFeedback.selectionChanged();

          if (get(isFocused)) {
            set(isFocused, false);

            if (!get(realValue)) {
              input?.focus();
              return;
            }

            props.controller.add(true);
            props.controller.select(+1);
            return;
          }

          if (props.value().title === '') {
            input?.focus();
            return;
          }

          set(checked, old => !old);
        }}
        class="relative cursor-pointer w-8 h-8 m--1.5 p-1.5 flex items-center"
        role="checkbox"
      >
        <Show when={(isIOS() || isMac()) && get(isFocused)}>
          <input type="text" data-id={getCheckboxId()}
            class="opacity-0 cursor-pointer absolute w-full h-full left-0 top-0 z-2"
            onFocusIn={() => {
              if (!get(realValue)) {
                input.focus();
                return;
              }

              props.controller.add(true);
              props.controller.select(+1);
            }}
          />
        </Show>
        <Transition
          enterActiveClass="animate-init-fade-in-50"
          exitActiveClass="animate-init-fade-out-50"
        >
          <Switch fallback={<PlusOutlined class="absolute ui-icon-tertiary" />}>
            <Match when={get(realValue) && !get(checked) && !get(isFocused)}>
              <Check class="absolute ui-icon-tertiary" />
            </Match>
            <Match when={get(realValue) && get(checked) && !get(isFocused)}>
              <CheckFilled class="absolute ui-icon-tertiary" />
            </Match>
          </Switch>
        </Transition>
        <PlusOutlined class="fill-transparent" />
      </button>

      <ItemInput />
    </div>
  </>;

  function getCheckboxId() {
    return getSubtaskId(props.index()) + '-checkbox';
  }

  function ItemInput(): JSX.Element {
    const linkText = useLinkMarker({
      dependencies: () => get(isFocused),
    });

    const model = [
      () => get(realValue).replace('\n', ''),
      (v: string) => {
        const value = set(realValue, v.replace('\n', ''));

        props.controller.updateText(value);

        return value;
      },
    ] as Signal<string>;

    return <div class="relative flex-grow **:app-text-body-l/regular-long overflow-hidden my--2.5 py-2">
      <TextArea ref={ref}
        enterkeyhint="next"
        placeholder={t('task-editor checklist-placeholder')}
        class="w-full"
        classList={{
          'animate-init-slide-in-down-200': !isIOS(),
        }}
        data-id={getSubtaskId(props.index())}
        disabled={props.readonly}
        model={model}
        focused={isFocused}
        onBlur={(e) => {
          // Clicked on the + button
          if (e.relatedTarget instanceof HTMLElement && e.relatedTarget.getAttribute('data-id') === getCheckboxId()) {
            set(isFocused, true);
            e.preventDefault();
            return;
          }

          set(isFocused, false);

          if (props.value().title === '' && markedForRemoval) {
            props.controller.remove();
          }
        }}
        onKeyUp={e => {
          const newValue = e.currentTarget.value;

          switch (e.key) {
            case 'Enter': {
              e.preventDefault();

              props.controller.add(true);
              props.controller.select(+1);
            } break;

            case 'Backspace': {
              // Already empty - delete item and select previous
              if (markedForRemoval) {
                // Defocus with empty text triggers removal passively
                props.controller.select(-1);
                return;
              }
            } break;
          }

          // Will be empty - mark for removal on next Backspace press
          if (newValue === '' && !markedForRemoval) {
            markedForRemoval = true;
          } else {
            markedForRemoval = false;
          }
        }}
        more={MoreButton}
      >{text => linkText.mark(text)}</TextArea>
    </div>;
  }
}

function MoreButton(props: {
  onClick: ComponentProps<'button'>['onClick'];
}) {
  return <button
    class="absolute app-text-body-m/regular
      ltr:right-0 rtl:left-0 bottom-0 z-10
      c-text-link
      pt-3 ltr:pl-5 rtl:pr-5
      rounded-0
    "
    onClick={props.onClick}
    style={{
      background: currentTextDirection() === 'rtl'
        ? 'radial-gradient(ellipse at bottom left, var(--tg-theme-section-bg-color) 50%, transparent 70%)'
        : 'radial-gradient(ellipse at bottom right, var(--tg-theme-section-bg-color) 50%, transparent 70%)',
    }}
  >
    <span>
      {t('task-editor description-more')}
    </span>
  </button>;
}