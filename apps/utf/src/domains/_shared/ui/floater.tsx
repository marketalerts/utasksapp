import { useSemanticProps } from 'solid-utils/semantic-props';
import type { Semantic } from 'solid-utils/semantic-props';
import { Portal } from 'solid-js/web';
import { createSignal, mergeProps, createEffect, on } from 'solid-js';
import type { ComponentProps, Setter, Signal } from 'solid-js';
import { useFloating } from 'solid-floating-ui';
import { autoPlacement, autoUpdate, flip } from '@floating-ui/dom';
import type { Middleware, Placement, Strategy } from '@floating-ui/dom';

export default function Popup(_props: Semantic<{
  props: {
    enterClass?: string;
    exitClass?: string;
    isOpen?: Signal<boolean | undefined>;
    placement?: Placement | 'auto';
    strategy?: Strategy;
    middleware?: Middleware[];
  };
  slots: {
    opener: [attrs: { ref: Setter<any> }, open: VoidFunction];
    floater: [attrs: { ref: Setter<any> } & Pick<ComponentProps<'div'>, 'classList' | 'style'>, close: VoidFunction];
  };
  events: {
    open(): void;
    close(lolek: string): number;
  };
}>) {
  const { props, emit, useSlots } = useSemanticProps(_props, {
    isOpen: createSignal<boolean>(),
    enterClass: 'animate-init-fade-in-right',
    exitClass: 'animate-init-fade-out-right',
  });

  const [opener, setOpener] = createSignal<HTMLElement>();
  const [popup, setPopup] = createSignal<HTMLElement>();

  const isOpen = () => props.isOpen[0]();

  const open = () => {
    if (!isOpen()) props.isOpen[1](true);
    else close();
  };

  const close = () => requestAnimationFrame(() => props.isOpen[1](false));
  const bodyClose = () => {
    close();
    document.documentElement.removeEventListener('click', bodyClose);
  };

  let closingClass = 'opacity-0';

  createEffect(on(isOpen, () => {
    if (isOpen()) {
      emit('open');
      closingClass = props.exitClass;
      document.documentElement.addEventListener('click', bodyClose);
    } else {
      emit('close', 'asd');
      document.documentElement.removeEventListener('click', bodyClose);
    }
  }, { defer: true }));

  const position = useFloating(
    opener,
    popup,
    {
      get placement() {
        return props.placement === 'auto' ? undefined : props.placement;
      },
      get strategy() {
        return props.strategy ?? 'fixed';
      },
      whileElementsMounted: (reference, floating, update) => {
        if (!reference || !floating) return;

        return autoUpdate(reference, floating, update);
      },
      middleware: props.middleware ?? [flip(), ...props.placement === 'auto' ? [autoPlacement()] : []],
    },
  );

  const slots = useSlots((slot, attrs) => ({
    opener: slot.opener({ ref: setOpener }, open),

    floater: slot.floater(attrs(() => ({
      ref: setPopup,
      classList: {
        'pointer-events-none': !isOpen(),
        [closingClass]: !isOpen(),
        [props.enterClass]: isOpen(),
      },
      style: {
        position: position.strategy,
        top: `${position.y ?? 0}px`,
        left: `${position.x ?? 0}px`,
        width: 'max-content',
        height: 'max-content',
      },
    })), close),
  }));

  return <>
    {slots.opener}

    <Portal>
      {slots.floater}
    </Portal>
  </>;
}
