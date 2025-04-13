import { Show, Suspense, createSignal, children } from 'solid-js';
import type { JSX, Accessor, Setter, Signal } from 'solid-js';
import { omit } from 'rambda';
import { makePersisted } from '@solid-primitives/storage';

import { CloudStorage } from './telegram';
import ListArrow from './list-arrow';

import Star from 'i/Star.svg';

export interface AccordeonProps extends Omit<JSX.DetailsHtmlAttributes<HTMLDetailsElement>, 'children'> {
  title?: string;
  description?: string;
  hasIcon?: boolean;
  hasBackground?: boolean;
  amount?: number;
  isOpen?: boolean | Signal<boolean>;
  children: ((isAccordeonOpen: Accessor<boolean>) => JSX.Element);
  summary?: ((isAccordeonOpen: Accessor<boolean>) => JSX.Element);
}

export default function Accordeon(props: AccordeonProps) {
  const open = Array.isArray(props.isOpen)
    ? props.isOpen
    : createSignal(props.isOpen ?? (localStorage.getItem(`utasks-accordeon-${props.id}`) === 'true'));
  const [isOpen, setOpen] = props.id
    ? makePersisted(open as [Accessor<boolean>, Setter<boolean>], {
        name: `utasks-accordeon-${props.id}`,
        // TODO: contribute to @solid-primitives/storage to fix this
        deserialize: ((str: string) => str === 'true') as any,
        storage: CloudStorage,
      })
    : open;

  const onDetailsRender = (ref: HTMLDetailsElement) => {
    if (isOpen()) {
      ref.setAttribute('open', '');
    }
  };

  const resolvedChildren = children(() => props.children(isOpen));
  const resolvedSummary = children(() => props.summary?.(isOpen));

  return <Suspense>
    <details role="group" ref={onDetailsRender}
      id={`accordeon-${props.id}`}
      class="=accordeon rounded-2 [&[open]>summary]:mb-5 min-h-10 overflow-hidden bg-tg_bg"
      classList={{ 'bg-transparent': props.hasBackground === false, [props.class ?? '']: !!props.class }}

      onToggle={(e) => setOpen(e.currentTarget.hasAttribute('open'))}
      {...omit(['title', 'id', 'summary', 'class'], props)}
    >
      <summary class="=accordeon-summary app-transition-margin">
        <Show when={!props.summary} fallback={resolvedSummary()}>
          <div class="=fallback-summary w-full h-full flex! items-center p-2 gap-2 cursor-pointer bg-tg_bg [&_*]:opacity-75 relative z-3">
            <Show when={props.hasIcon}>
              <Star class="= fill-white" />
            </Show>

            <span role="heading" class="= app-text-subheadline-emphasized c-tg_hint flex-grow ltr:ml-1 rtl:mr-1">{props.title}</span>

            <Show when={typeof props.amount === 'number'}>
              <span class="= app-text-subheadline c-tg_hint">{props.amount}</span>
            </Show>

            <ListArrow isOpen={isOpen} />
          </div>
        </Show>
      </summary>
      <div class="=accordeon-body mt--5">
        {resolvedChildren()}
      </div>
    </details>
  </Suspense>;
}
