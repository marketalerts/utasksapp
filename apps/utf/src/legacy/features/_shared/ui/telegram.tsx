import WebApp from 'tma-dev-sdk';
import { Show, createRenderEffect, mergeProps, onCleanup, onMount } from 'solid-js';
import type { AsyncStorage } from '@solid-primitives/storage';
import tinycolor from '@ctrl/tinycolor';

import { isInline, setFrameColorToTopElementBg } from 'shared/platform';


export interface BackButtonProps {
  isVisible?: boolean;
  onClick?: () => void;
}

const backButtonStack: BackButtonProps[] = [];

function onClickBack() {
  backButtonStack[backButtonStack.length - 1].onClick?.();
}

WebApp.BackButton.onClick(onClickBack);

export function BackButton(_props: BackButtonProps) {
  const props = mergeProps({
    isVisible: !isInline(),
    onClick: () => history.back(),
  }, _props);

  createRenderEffect(() => {
    if (props.isVisible !== false && !isInline()) {
      WebApp.BackButton.show();
    } else {
      WebApp.BackButton.hide();
    }
  });

  onMount(() => {
    backButtonStack.push(props);

    setTimeout(() => {
      if (props.isVisible !== false && !isInline()) {
        WebApp.BackButton.show();
      } else {
        WebApp.BackButton.hide();
      }
    }, 10);


    setFrameColorToTopElementBg();
  });

  onCleanup(() => {
    backButtonStack.pop();

    setFrameColorToTopElementBg();

    setTimeout(() => {
      if (backButtonStack.length === 0) {
        WebApp.BackButton.hide();
      } else {
        const isVisible = backButtonStack.at(-1)?.isVisible;

        if (isVisible !== false && !isInline()) {
          WebApp.BackButton.show();
        } else {
          WebApp.BackButton.hide();
        }
      }
    }, 10);
  });

  return <>
    <Show when={props.isVisible && import.meta.env.APP_ENV !== 'prod' && WebApp.platform === 'unknown'}>
      <button class="= fixed bg-tg_button c-tg_button_text z-100000" onClick={onClickBack}>
        {'< Back'} /{backButtonStack.length}
      </button>
    </Show>
  </>;
}

export interface MainButtonProps {
  isVisible?: boolean,
  disabled?: boolean,
  showProgress?: boolean,
  backgroundColor?: string,
  textColor?: string,
  text?: string,
  onClick?: () => void;
}

const mainButton = WebApp.MainButton;

const secondaryButton = WebApp.SecondaryButton;

export const getCssVariable = (name: string, defaultName: string) => {
  const style = getComputedStyle(document.documentElement);
  const value = style.getPropertyValue(name);

  return (
    !value
      ? style.getPropertyValue(defaultName)
      : value
  );
};
export const getCssColorVariable = (name: string, defaultName: string) => {
  return tinycolor(
    getCssVariable(name, defaultName),
  );
};

export function resetMainButtonColor() {
  const defaultButtonColor = getCssColorVariable(
    '--tg-theme-button-color',
    '--default-tg-theme-button-color',
  );

  mainButton.setParams({ color: defaultButtonColor.toHexString() });

  return defaultButtonColor;
}

const mainButtonStack: MainButtonProps[] = [];

function onClickMain() {
  mainButtonStack[mainButtonStack.length - 1].onClick?.();
}

mainButton.onClick(onClickMain);

export function MainButton(props: MainButtonProps) {

  const hintColor = () => getCssColorVariable(
    '--tg-theme-hint-color',
    '--default-tg-theme-hint-color',
  );

  createRenderEffect(() => {
    mainButton.setParams({
      is_visible: props.isVisible !== false,
      color: props.backgroundColor,
      text_color: props.textColor,
      text: props.text,
    });
  });

  let color = mainButton.color;

  createRenderEffect(() => {
    if (props.disabled) {
      color = mainButton.color;
      mainButton.disable();
      mainButton.setParams({ color: hintColor().toHexString() });
    } else {
      mainButton.enable();
      if (!props.backgroundColor) {
        resetMainButtonColor();
      } else {
        mainButton.setParams({ color: props.backgroundColor ?? color });
      }
    }
  });

  createRenderEffect(() => {
    if (props.showProgress) {
      mainButton.showProgress();
    } else {
      mainButton.hideProgress();
    }
  });

  onMount(() => {
    console.count('mount main');
    mainButtonStack.push(props);

    setTimeout(() => {
      if (props.isVisible !== false) {
        mainButton.show();
      } else {
        mainButton.hide();
      }
    }, 10);

    setFrameColorToTopElementBg();
  });

  onCleanup(() => {
    console.count('cleanup main');
    mainButtonStack.pop();

    setFrameColorToTopElementBg();

    setTimeout(() => {
      if (mainButtonStack.length === 0) {
        mainButton.hide();
      } else {
        const _props = mainButtonStack.at(-1);

        if (_props) {
          mainButton.setParams({
            is_visible: _props.isVisible !== false,
            color: _props.backgroundColor,
            text_color: _props.textColor,
            text: _props.text,
            is_active: !_props.disabled,
          });

          if (_props.disabled) {
            color = mainButton.color;
            mainButton.disable();
            mainButton.setParams({ color: hintColor().toHexString() });
          } else {
            mainButton.enable();
            if (!_props.backgroundColor) {
              resetMainButtonColor();
            } else {
              mainButton.setParams({ color: _props.backgroundColor ?? color });
            }
          }
        }
      }
    }, 10);
  });

  return <>
    <Show when={props.isVisible !== false && import.meta.env.APP_ENV !== 'prod' && WebApp.platform === 'unknown'}>
      <button class="fixed bottom--1 w-full mt-2 rounded-2 p-3 c-tg_button_text z-999999999 bg-tg_button"
        onClick={e => {
          e.stopPropagation();
          onClickMain();
        }}
      >
        {props.text} /{mainButtonStack.length}
      </button>
    </Show>
  </>;
}

const secondaryButtonStack: MainButtonProps[] = [];

function onClickSecondary() {
  secondaryButtonStack[secondaryButtonStack.length - 1].onClick?.();
}

secondaryButton.onClick(onClickSecondary);

export function SecondaryButton(props: MainButtonProps) {
  const hintColor = () => getCssColorVariable(
    '--tg-theme-hint-color',
    '--default-tg-theme-hint-color',
  );

  createRenderEffect(() => {
    secondaryButton.setParams({
      is_visible: props.isVisible !== false,
      color: props.backgroundColor,
      text_color: props.textColor,
      text: props.text,
    });
  });

  let color = secondaryButton.color;

  createRenderEffect(() => {
    if (props.disabled) {
      color = secondaryButton.color;
      secondaryButton.disable();
      secondaryButton.setParams({ color: hintColor().toHexString() });
    } else {
      secondaryButton.enable();
      if (!props.backgroundColor) {
      } else {
        secondaryButton.setParams({ color: props.backgroundColor ?? color });
      }
    }
  });

  createRenderEffect(() => {
    if (props.showProgress) {
      secondaryButton.showProgress();
    } else {
      secondaryButton.hideProgress();
    }
  });

  onMount(() => {
    console.count('mount secondary');
    secondaryButtonStack.push(props);

    setTimeout(() => {
      if (props.isVisible !== false) {
        secondaryButton.show();
      } else {
        secondaryButton.hide();
      }
    }, 10);

    setFrameColorToTopElementBg();
  });

  onCleanup(() => {
    console.count('cleanup secondary');
    secondaryButtonStack.pop();

    setFrameColorToTopElementBg();

    setTimeout(() => {
      if (secondaryButtonStack.length === 0) {
        secondaryButton.hide();
      } else {
        const _props = secondaryButtonStack.at(-1);

        if (_props) {
          secondaryButton.setParams({
            is_visible: _props.isVisible !== false,
            color: _props.backgroundColor,
            text_color: _props.textColor,
            text: _props.text,
            is_active: !_props.disabled,
          });

          if (_props.disabled) {
            color = secondaryButton.color;
            secondaryButton.disable();
            secondaryButton.setParams({ color: hintColor().toHexString() });
          } else {
            secondaryButton.enable();
            if (!_props.backgroundColor) {
            } else {
              secondaryButton.setParams({ color: _props.backgroundColor ?? color });
            }
          }
        }
      }
    }, 10);
  });

  return <>
    <Show when={props.isVisible !== false && import.meta.env.APP_ENV !== 'prod' && WebApp.platform === 'unknown'}>
      <button class="= fixed bottom--1 w-full mt-2 rounded-2 p-3 c-tg_text z-999999999 bg-transparent"
        onClick={e => (e.stopPropagation(), onClickSecondary())}
      >
        {props.text}
      </button>
    </Show>
  </>;
}

export const CloudStorage = {
  setItem(key, value) {
    if (value === undefined) {
      return this.removeItem(key);
    }

    localStorage.setItem(key, value);
    return new Promise((res, rej) => (
      WebApp.CloudStorage.setItem(key, value, (err, result) => err || !result ? rej(err) : res())
    ));
  },
  getItem(key) {
    return new Promise((res, rej) => {
      const timeout = setTimeout(() => res(localStorage.getItem(key) ?? null), 1000);

      WebApp.CloudStorage.getItem(key, (err, result) => {
        clearTimeout(timeout);
        if (err && !localStorage.getItem(key))
          return rej(err);

        return res(
          result != null
          ? (localStorage.setItem(key, result), result)
          : (localStorage.getItem(key) ?? null),
        );
      });
    });
  },
  removeItem(key) {
    localStorage.removeItem(key);
    return new Promise((res, rej) => (
      WebApp.CloudStorage.removeItem(key, (err, result) => err || !result ? rej(err) : res())
    ));
  },
  clear() {
    const keys = new Promise<string[] | undefined>((res, rej) => (
      WebApp.CloudStorage.getKeys((err, keys) => err ? rej(err) : res(keys))
    ));

    localStorage.clear();

    return new Promise((res, rej) => keys.then(keys => keys && (
      WebApp.CloudStorage.removeItems(keys, (err, result) => err || !result ? rej(err) : res())
    )));
  },
  key(index) {
    const keys = new Promise<string[] | undefined>((res, rej) => (
      WebApp.CloudStorage.getKeys((err, keys) => err ? rej(err) : res(keys))
    ));

    return keys.then(keys => keys?.[index] ?? null);
  },
  get length() {
    return new Promise<number>((res, rej) => (
      WebApp.CloudStorage.getKeys((err, keys) => err || !keys ? rej(err) : res(keys.length))
    ));
  },
  getAll() {
    const keys = new Promise<string[] | undefined>((res, rej) => (
      WebApp.CloudStorage.getKeys((err, keys) => err ? rej(err) : res(keys))
    ));

    return keys.then(keys => keys && WebApp.CloudStorage.getItems(keys));
  },
} satisfies AsyncStorage;
