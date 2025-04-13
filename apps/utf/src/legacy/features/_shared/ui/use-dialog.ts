import { get, set } from 'solid-utils/access';
import { createRenderEffect, createSignal, on } from 'solid-js';

import { supportsDialog } from './supports-dialog';

let cssImported = false;

function enforceDialog(dialog?: HTMLDialogElement) {
  if (!dialog) return;

  if (!supportsDialog()) {
    import('dialog-polyfill').then((polyfill) => polyfill.default.registerDialog(dialog));

    if (cssImported) {
      return;
    }

    import('dialog-polyfill/dialog-polyfill.css').then(() => (cssImported = true, import('ui/css')));
  }
}

export const useDialog = (type: 'dialog' | 'modal' = 'dialog', suppressOverflow?: boolean) => {
  const [isDialogOpen, setIsDialogOpen] = createSignal(false);

  const dialog = createSignal<HTMLDialogElement>();

  createRenderEffect(on(isDialogOpen, (isOpen) => {
    if (!isOpen) {
      suppressOverflow && document.body.classList.remove('overflow-hidden');

      return get(dialog)?.close();
    }

    suppressOverflow && document.body.classList.add('overflow-hidden');

    if (type === 'dialog') {
      return get(dialog)?.show();
    }

    get(dialog)?.showModal();
  }, { defer: true }));

  return [
    isDialogOpen,
    setIsDialogOpen,
    (dialogRef: HTMLDialogElement) => {
      enforceDialog(set(dialog, dialogRef));

      dialogRef.addEventListener('click', (e: MouseEvent) => {
        const rect = dialogRef.getBoundingClientRect();

        const isInDialog = (
          rect.top <= e.clientY && e.clientY <= rect.top + rect.height
          && rect.left <= e.clientX && e.clientX <= rect.left + rect.width
        );

        if (!isInDialog && e.target === dialogRef) {
          e.stopPropagation();
          setIsDialogOpen(false);
        }
      });
    },
    dialog,
  ] as const;
};
