import { on, createSignal, createEffect, Show, createContext, children } from 'solid-js';
import type { JSX, ParentProps, Signal } from 'solid-js';

import Plus from 'i/Plus.svg';

export interface PopupControllerInterface {
  show(hideAfterMilis?: number): void;
  hide: VoidFunction;
  setText: (v: string) => void;
  setChildren: (el: JSX.Element) => void;
}

export const PopupController = createContext<PopupControllerInterface>();

export default function Popup(props: ParentProps<{
  show: Signal<boolean>;
  text: () => string;
  id?: string;
}>) {
  const isShown = () => props.show[0]();
  const setShown = (v: boolean) => props.show[1](v);

  const showDelay = 1000;
  const [lateShown, setLateShown] = createSignal(true);

  createEffect(on(isShown, (override) => {
    if (!override) {
      setTimeout(() => setLateShown(false), showDelay);
    }
  }, { defer: true }));

  return <Show when={lateShown()}>
    <div class="=root-popup
        fixed flex justify-between items-center bottom--20 left-4 right-4
        bg-tg_bg rounded-3 py-2 p-3
        z-110 app-transition-bottom shadow-xl shadow-black
      "
      classList={{ 'bottom-5': isShown() }}
      id={props.id ?? 'popup'}
    >
      <div class="= flex items-center gap-2">
        <Plus class="=root-popup-close fill-tg_hint rotate--45 app-transition-transform w-4 h-4 cursor-pointer"
          role="button"
          onClick={() => setShown(false)}
        />
        <span>{props.text()}</span>
      </div>

      {props.children}
    </div>
  </Show>;
}

export const usePopup = () => {
  const showPopup = createSignal(false);
  const [popupText, setPopupText] = createSignal('');
  const childrenOverride = createSignal<JSX.Element>();

  const popupController = {
    setText: setPopupText,
    hide: () => showPopup[1](false),
    show: (hideTimeout) => {
      showPopup[1](true);
      if (typeof hideTimeout === 'number') {
        setTimeout(() => showPopup[1](false), hideTimeout);
      }
    },
    setChildren(el) {
      childrenOverride[1](el);
    },
  } satisfies PopupControllerInterface;

  return {
    PopupProvider: (props: ParentProps) => <PopupController.Provider value={popupController}>
      {props.children}
    </PopupController.Provider>,
    Popup: (props: ParentProps) => {
      const popupChildren = children(() => childrenOverride[0]() ?? props.children);

      return <Popup show={showPopup} text={popupText}>
        {popupChildren()}
      </Popup>;
    },
  } as const;
};