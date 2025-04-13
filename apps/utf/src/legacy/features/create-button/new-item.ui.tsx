import { Portal } from 'solid-js/web';
import { Show } from 'solid-js';
import type { JSX, Signal } from 'solid-js';
import { A } from '@solidjs/router';

import { isIOS } from 'shared/platform';

import { useDialog } from 'shared/ui/use-dialog';

import Star from 'i/Star.svg';


interface NewItemProps {
  id: string;
  title: string;
  description: string;
  type?: Parameters<typeof useDialog>[0];

  icon?: JSX.Element;
  badgeIcon?: JSX.Element;
  disabled?: boolean;
  disabledLink?: string;

  onClick?(dialogState: Signal<boolean>): unknown;

  children?: (dialogState: Signal<boolean>) => JSX.Element;
}

export default function NewItem(props: NewItemProps) {
  const [
    isDialogOpen,
    setIsDialogOpen,
    bindDialogToSignal,
  ] = useDialog(props.type);

  return <li class="=create-button-item-container relative [&:last-child_.ut-create-button-item-text]:b-b-0">
    <button onClick={() => !props.disabled && (props.onClick?.([isDialogOpen, setIsDialogOpen]) ?? setIsDialogOpen(!isDialogOpen()))}
      type="button"
      class="=create-button-item flex items-start w-full bg-transparent! b-0 py-2 px-0"
      disabled={props.disabled}
      data-id={`new-${props.id}`}
    >
      <div class="= mx-4 mt-1" classList={{ 'filter-grayscale': props.disabled }}>
        {props.icon ?? <Star class="= fill-tg_hint min-w-6" />}
      </div>
      <div class="=create-button-item-text
        inline-flex flex-col items-stretch flex-grow
        ltr:text-left rtl:text-right
        ltr:pr-4 rtl:pl-4
        mb--2 pb-2 b-b-1 b-b-solid b-b-tg_bg_secondary
      ">
        <span class="=create-button-item-title inline-flex justify-between c-tg_hint app-text-body-regular items-center"
          classList={{ 'c-tg_text': !props.disabled }}
        >
          {props.title}
          <span class="= mt--0.5">{props.badgeIcon}</span>
        </span>
        <span class="=create-button-item-desc c-tg_hint app-text-subheadline" classList={{ 'opacity-50': props.disabled }}>
          {props.description}
        </span>
      </div>
    </button>

    <Show when={props.disabled}>
      <Show when={props.disabledLink}>
        {disabledLink => <A href={disabledLink()} class="=disabled-item-link absolute ltr:left-0 rtl:right-0 top-0 ltr:right-0 rtl:left-0 bottom-0" />}
      </Show>
    </Show>

    <Show when={props.children}>
      <Portal>
        <dialog ref={bindDialogToSignal}
          class="=create-item-dialog fixed max-w-full w-full m-0 p-0 b-0 bg-tg_bg"
          classList={{
            'border-rounded-t-3 safe-bottom-0!': !isIOS(),
            'border-rounded-b-3 translate-y-0! top-0!': isIOS(),
          }}
        >
          {props.children?.([isDialogOpen, setIsDialogOpen])}
        </dialog>
      </Portal>
    </Show>
  </li>;
}
