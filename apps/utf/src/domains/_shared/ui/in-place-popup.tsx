import { Portal } from 'solid-js/web';
import { children, createSignal, mergeProps, Show, createUniqueId, createEffect, createMemo, ErrorBoundary, onMount } from 'solid-js';
import type { ComponentProps, JSX, Setter, Signal } from 'solid-js';
import { useFloating } from 'solid-floating-ui';
import { once } from 'rambda';
import { autoPlacement, autoUpdate, flip } from '@floating-ui/dom';
import type { Middleware, Placement, Strategy } from '@floating-ui/dom';

export default function Popup(_props: Omit<ComponentProps<'div'>, 'children'> & {
  enterActiveClass?: string;
  exitActiveClass?: string;
  opener: ((ref: Setter<any>, open: VoidFunction) => JSX.Element);
  children: ((ref: Setter<any>, props: (className?: string) => Pick<ComponentProps<'div'>, 'class' | 'style'>, close: VoidFunction) => JSX.Element);
  isOpen?: Signal<boolean | undefined>;
  placement?: Placement | 'auto';
  strategy?: Strategy;
  middleware?: Middleware[];
}) {
  const props = mergeProps({
    isOpen: createSignal<boolean>(),
    enterActiveClass: 'animate-init-fade-in-right',
    exitActiveClass: 'animate-init-fade-out-right',
  }, _props);

  const id = createUniqueId();

  const [opener, setOpener] = createSignal<HTMLElement>();
  const [popup, setPopup] = createSignal<HTMLElement>();

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
        return autoUpdate(reference, floating, update);
      },
      middleware: [flip(), ...props.placement === 'auto' ? [autoPlacement()] : [], ...(props.middleware ?? [])],
    },
  );

  const isOpen = () => props.isOpen[0]();

  const open = () => {
    if (!isOpen())
      props.isOpen[1](true);
    else close();
  };

  const close = () => requestAnimationFrame(() => props.isOpen[1](false));

  let mounted = false;

  onMount(() => {
    mounted = true;
  });

  let closingClass = 'opacity-0 pointer-events-none';
  const actualClosingClass = () => `${props.exitActiveClass} pointer-events-none`;

  const floatingClass = (className?: string) => [
    className ?? '',
    mounted
     ? isOpen() ? props.enterActiveClass : closingClass
     : 'hidden',
  ].join(' ');

  const openerElement = children(() => props.opener(setOpener, open));
  const floatingElement = children(() => props.children(setPopup, (className) => ({
    class: floatingClass(className),
    style: {
      position: position.strategy,
      top: `${position.y ?? 0}px`,
      left: `${position.x ?? 0}px`,
      width: 'max-content',
      height: 'max-content',
    },
  }), close));

  const setClosingClass = once(() => {
    closingClass = actualClosingClass();
  });

  createEffect(() => {
    if (isOpen()) {
      setClosingClass();
      document.body.addEventListener('click', close);
    } else {
      document.body.removeEventListener('click', close);
    }
  });

  return <div
    classList={{ [String(props.class)]: !!props.class, ...props.classList }}
    style={props.style}
  >
    {openerElement()}

    <Portal>
      {floatingElement()}
    </Portal>
  </div>;
}