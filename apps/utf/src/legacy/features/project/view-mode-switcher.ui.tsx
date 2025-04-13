import WebApp from 'tma-dev-sdk';
import { get, set } from 'solid-utils/access';
import { Transition } from 'solid-transition-group';
import { For, Show, createRenderEffect, createSignal, on, onCleanup, onMount } from 'solid-js';
import type { JSX, Resource, Signal } from 'solid-js';
import { isAndroid } from '@solid-primitives/platform';

import { defaultViewModes } from 'f/project/view-mode.adapter';
import type { ClientItemViewMode } from 'f/project/view-mode.adapter';

import { t } from './locales';

export type DefaultMode = { id: 'default'; };

interface ViewModeProps {
  viewModes: Resource<Array<ClientItemViewMode | undefined>>;
  model: Signal<number>;
  fallback?: JSX.Element;
  small?: boolean;
}

export default function ViewModeSwitcher(props: ViewModeProps) {
  const modes = () => props.viewModes.latest;
  const selectedMode = () => get(props.model);

  createRenderEffect(on(selectedMode, () => {
    WebApp.HapticFeedback.selectionChanged();
  }));

  return <ul role="switch"
    class="flex reset-list mx--4"
  >
    <For each={modes()}
      fallback={
        <For each={defaultViewModes()}>
          {(mode, index) => <ViewModeTab mode={mode} index={index} />}
        </For>
      }
    >
      {(mode, index) => <ViewModeTab mode={mode} index={index} />}
    </For>
  </ul>;

  function ViewModeTab(_props: { index: () => number; mode?: ClientItemViewMode; }): JSX.Element {
    let el!: HTMLLIElement;
    // let originalOffset = 0;
    // const elHeight = createSignal(48);
    const maxHeight = 44;
    const minHeight = 36;

    // function onScroll() {
    //   requestAnimationFrame(() => {
    //     const scrollOffset = window.scrollY - (props.topOffset ?? el.offsetTop) - originalOffset;
    //     const newHeight = Math.max(maxHeight - Math.max(0, scrollOffset), minHeight);
    //     set(elHeight, newHeight);
    //   });
    // }

    // onMount(() => {
    //   originalOffset = props.topOffset ?? (el.getBoundingClientRect().y + window.scrollY);
    //   window.addEventListener('scroll', onScroll);
    // });

    // onCleanup(() => {
    //   window.removeEventListener('scroll', onScroll);
    // });

    return <li class="overflow-hidden h-11"
      ref={el}
      classList={{
        'h-9': !!props.small,
      }}
      style={{
        'max-height': maxHeight + 'px',
        'min-height': minHeight + 'px',
      }}
    >
      <div onClick={() => !_props.mode?.disabled && set(props.model, _props.index())}
        class="px-4 h-full flex items-end"
        classList={{
          'cursor-pointer': !_props.mode?.disabled,
          'opacity-50': !!_props.mode?.disabled,
        }}
        data-id={`filter-${_props.mode?.id ?? _props.index()}`}
      >
        <div class="relative pb-3.5"
          classList={{
            'pb-3!': props.small,
          }}
        >
          <div class="relative flex items-center justify-center whitespace-nowrap gap-1 h-full">
            <Show when={_props.mode ?? defaultViewModes()[_props.index()]} fallback={<span>…&nbsp;…</span>}>
              {mode => <>
                <span class="app-text-body-m/medium c-app-text-tertiary"
                  classList={{
                    'c-app-text-accented!': (
                      selectedMode() === _props.index()
                    ),
                  }}
                >
                  {t('task-counter', { value: mode().id, default: mode().name })}
                </span>
                <Show when={mode().count > 0}>
                  <span class="c-app-text-on-color rounded-full bg-icon-tertiary app-text-body-s/regular min-w-4.5 h-4.5 px-1.25 flex items-center justify-center"
                    classList={{
                      'c-app-secondary!': isAndroid,
                      'bg-app-icon-accented!': (
                        selectedMode() === _props.index()
                      ),
                    }}
                  >
                    {mode().count}
                  </span>
                </Show>
              </>}
            </Show>
          </div>
          <Transition
            enterActiveClass="animate-init-slide-in-up"
            exitActiveClass="animate-init-slide-out-down"
          >
            <Show when={selectedMode() === _props.index()}>
              <div class="absolute bottom-0 w-full h-0.75 bg-app-icon-accented rounded-t-1" />
            </Show>
          </Transition>
        </div>
      </div>
    </li>;
  }
}
