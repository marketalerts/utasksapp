import { model, useDirectives } from 'solid-utils/model';
import { get, set } from 'solid-utils/access';
import { createEffect, createRenderEffect, createSignal } from 'solid-js';
import type { JSX } from 'solid-js';

import { runLater } from 'shared/platform';

import Dismiss from 'icons/Dismiss.svg';
import ArrowRight from 'icons/ArrowRight.svg';

export default function CreateGeneric(props: {
  onCreate?(title: string): Promise<unknown>;
  onClose?(): void;
  placeholder?: string;
  icon: JSX.Element;
}) {
  useDirectives(model);

  const title = createSignal('');
  const isRequestInProgress = createSignal(false);
  const isRequestSuccessful = createSignal(false);
  const isFormDisabled = createSignal(false);

  createRenderEffect(() => {
    set(isFormDisabled, get(title).length === 0);
  });

  let mainInput!: HTMLInputElement;

  createEffect(() => {
    setTimeout(() => requestAnimationFrame(() => {
      mainInput.focus();
      runLater(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 300);
    }));
  });

  return <>
    <form class="=
        animate-head-shake
        b b-solid b-button
        relative bg-tg_bg rounded-3 h-11 min-h-11
        overflow-hidden shadow-none
      "
      id="create-generic"
      onSubmit={e => (e.preventDefault(), !get(isFormDisabled) && create())}
    >
      <div class="= flex items-center px-4 h-11 w-full gap-4">
        {props.icon}
        <input class="= flex-grow p-0 py-2.5 placeholder:c-tg_hint app-text-subheadline"
          id="create-generic-input"
          placeholder={props.placeholder}
          use:model={title}
          enterkeyhint="send"
          inputmode="text"
          type="text"
          autofocus
          disabled={get(isRequestInProgress)}
          ref={el => (el.focus(), mainInput = el)}
        />
        <div role="button" class="= flex items-center cursor-pointer"
          onClick={props.onClose}
          id="create-generic-dismiss"
        >
          <Dismiss class="= fill-tg_hint" />
        </div>
        <button class="= bg-tg_button rounded-full flex items-center p-0.5 cursor-pointer"
          disabled={get(isFormDisabled)}
          id="create-generic-submit"
        >
          <ArrowRight class="= fill-tg_text rtl:rotate-180" />
        </button>
      </div>
    </form>
  </>;

  function create() {
    set(isRequestInProgress, true);

    return props.onCreate?.(get(title))
      .then(() => {

        set(isRequestSuccessful, true);
        props.onClose?.();
      })
      .catch(() => {
        set(isRequestSuccessful, false);
      });
  }
}
