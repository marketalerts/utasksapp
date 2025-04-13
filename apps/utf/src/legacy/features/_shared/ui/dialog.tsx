import { Portal } from 'solid-js/web';
import { Show } from 'solid-js';
import type { ComponentProps, ParentProps } from 'solid-js';
import { omit } from 'rambda';

import type { useDialog } from './use-dialog';

export default function Dialog(props: ParentProps<{
  dialogParams: ReturnType<typeof useDialog>;
}> & ComponentProps<'dialog'>) {
  const [,,bindDialogToSignal] = props.dialogParams;

  return <>
    <Show when={props.children}>
      <dialog ref={bindDialogToSignal}
        class="fixed max-w-full w-full m-0 p-0 b-0 bg-tg_bg [&[open]]"
        {...omit(['dialogParams', 'type'], props)}
      >
        {props.children}
      </dialog>
    </Show>
  </>;
}
