import { get, set } from 'solid-utils/access';
import { Portal } from 'solid-js/web';
import { children, createSignal, mergeProps } from 'solid-js';
import type { Component, JSX, Setter } from 'solid-js';

import { isIOS } from 'shared/platform';

import { useDialog } from 'shared/ui/use-dialog';

import GroupMenu from 'i/CircledArrowDown.svg';

type VerticalPosition = 'top' | 'bottom';
type HorizontalPosition = 'left' | 'right';

export type ContextDialogPosition = `${VerticalPosition}-${HorizontalPosition}`;

export interface ContextProps {
  disabled?: boolean;
  position?: ContextDialogPosition;
  children: JSX.Element | ((setDialogOpen: Setter<boolean>) => JSX.Element);
  trigger?: Component<{ onClick: () => void; ref: (ref: Element) => void; }>
}

const nullElement = document.createElement('dialog');

export default function PageContextMenu(_props: ContextProps) {
  const props = mergeProps({ position: 'bottom-left' as ContextDialogPosition }, _props);

  const [isDialogOpen, setIsDialogOpen, bindDialogToSignal, dialog] = useDialog('modal');

  type Coords = { left: `${number}px`; top: `${number}px`; };

  const dialogCoords = createSignal<Coords>({ top: '0px', left: '0px' });

  const menuButtonRef = createSignal<Element>();

  const onGroupMenuRender = (ref: Element) => {
    set(menuButtonRef, ref);
  };

  const toggleDialog = () => {
    const shouldOpen = !isDialogOpen() && !props.disabled;
    setIsDialogOpen(shouldOpen);

    setTimeout(() => {
      handleResize();
    }, 10);
  };

  const resolvedChildren = children(() => (
    typeof props.children === 'function'
    ? props.children(setIsDialogOpen)
    : props.children
  ));

  const Trigger = children(() => (
    props.trigger
      ? <props.trigger
          onClick={toggleDialog}
          ref={onGroupMenuRender}
        />
      : <GroupMenu class="= min-w-7"
          classList={{ 'cursor-pointer': !props.disabled, 'cursor-not-allowed': props.disabled }}
          onClick={toggleDialog}
          ref={onGroupMenuRender}
        />
  ));

  return <>
    {Trigger()}

    <>
      <dialog ref={bindDialogToSignal}
        class="=context-dialog fixed rounded-2 bg-tg_bg border-0 m-0 p-0"
        classList={{ 'w-50%': isIOS() }}
        style={get(dialogCoords)}
        onClick={handleResize}
      >
        {resolvedChildren()}
      </dialog>
    </>
  </>;

  function handleResize() {
    const [targetY, targetX] = props.position.split('-') as [VerticalPosition, HorizontalPosition];

    const rect = (get(menuButtonRef) ?? nullElement).getBoundingClientRect();
    const dialogRef = get(dialog) ?? nullElement;
    const dialogRect = dialogRef.getBoundingClientRect();

    set(dialogCoords, {
      left: `${rect.left + (targetX === 'left' ? -(dialogRect.width - rect.width) : (rect.width - dialogRect.width))}px`,
      top: `${rect.top + (targetY === 'top' ? -dialogRect.height : rect.height)}px`,
    });
  }
}
