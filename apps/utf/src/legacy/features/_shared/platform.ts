import WebApp from 'tma-dev-sdk';
import { onCleanup, onMount } from 'solid-js';
import tinycolor from '@ctrl/tinycolor';

/**
 * Apple sucks
 */
export const isIOS = () => /iPhone|iPad|iPod/.test(window.navigator.userAgent);
export const isAndroid = () => /Android/.test(window.navigator.userAgent);
export const isMac = () => /MacOS/.test(window.navigator.userAgent);
export const isMobile = () => isAndroid() || isIOS();

export const isInElement = (el: HTMLElement | null, host: HTMLElement | null) => {
  return (function traverse(subEl: HTMLElement | null) {
    if (subEl?.tagName.toLowerCase() === 'dialog') {
      return true;
    }

    if (subEl === null || host === null) {
      return false;
    }

    if (subEl === document.documentElement && host !== document.documentElement) {
      return false;
    }

    if (subEl === host) {
      return true;
    }

    return traverse(subEl?.parentElement ?? null);
  })(el);
};

export const runLater = <T>(cb: () => T, delay?: number): Promise<Awaited<T>> => (
  new Promise((res, rej) => (
    setTimeout(async () => {
      try {
        res(await cb());
      } catch (error) {
        rej(error);
      }
    }, delay)
  ))
);

export const applyAndroidScrollFix = () => {
  const isInput = (el: Element | null): el is HTMLInputElement | HTMLTextAreaElement => (
    el?.tagName.toLowerCase() == 'input'
    || el?.tagName.toLowerCase() == 'textarea'
  );

  function inputScrollFix() {
    const activeElement = document.activeElement;

    if (isInput(activeElement)) {
      runLater(() => {
        if ('scrollIntoViewIfNeeded' in activeElement && typeof activeElement.scrollIntoViewIfNeeded === 'function') {
          activeElement.scrollIntoViewIfNeeded();
        } else {
          activeElement.scrollIntoView();
        }
      });
    }
  }

  onMount(() => {
    try {
      if (isAndroid()) {
        window.addEventListener('resize', inputScrollFix);
      }
    } catch {/*  */}
  });

  onCleanup(() => {
    window.removeEventListener('resize', inputScrollFix);
  });
};

interface LinkOptions {
  chatId: number;
  messageId: number;
  thread?: number;
}

const checkOptions = (parse: (options: LinkOptions) => string | undefined) => (
  (options: Partial<LinkOptions>) => {
    return isNonPartial(options) ? parse(options) : undefined;
  }
);

export const tmePublicLink = checkOptions(
  options => `https://t.me/${options.chatId}${optionalThread(options, '/')}/${options.messageId}`,
);

export const tmePrivateLink = checkOptions(
  options => `https://t.me/c/${options.chatId}${optionalThread(options, '/')}/${options.messageId}`,
);

export const tgPublicLink = checkOptions(
  options => `tg://resolve?domain=${options.chatId}&post=${options.messageId}${optionalThread(options, '&thread=')}`,
);

export const tgPrivateLink = checkOptions(
  options => `tg://privatepost?channel=${options.chatId}&comment=${options.messageId}${optionalThread(options, '&thread=')}`,
);

function isNonPartial(options: Partial<LinkOptions>): options is LinkOptions {
  return !!options.chatId && !!options.messageId;
}

function optionalThread(options: { thread?: number | undefined; }, prefix: string) {
  return options.thread ? prefix + options.thread : '';
}

// In order to properly generate message links,
// we need to know the original id before the mask application,
// and check which type of id it is.
// To do this, we should employ the same tactics as the tdesktop app: bitshifts
//
// See link below for details:
// https://github.com/telegramdesktop/tdesktop/blob/3ba1941808924dc2af1fe7b031a9a3c26eeb2910/Telegram/SourceFiles/data/data_peer_id.cpp#L48


export const getMessageLink = checkOptions(options => {
  // But for now here's a simple workaround:
  const serialzied = String(options.chatId);

  // Bitmasking of private chat ids
  // usually results in them starting with something like -100
  // in signed int64 form.
  // While the masking is modifying the id's numerical representation,
  // the masking bit itself is far enough from the number data
  // to assume (for now at least) that the id number itself remains the same after the transformation
  if (serialzied.startsWith('-') && serialzied.length >= 14) {
    return tmePrivateLink({
      ...options,
      chatId: Number(serialzied.replace(/^-1?0?0?([0-9]+)/, '$1')),
    });
  }

  // Bitmasking of legacy chat ids
  // usually results in them starting with a minus (-)
  // in signed int64 form.
  // Since legacy chats are the only ones that can't have links,
  // all others should theoretically work
  if (!serialzied.startsWith('-')) {
    return tmePrivateLink(options);
  }

  return undefined;
});
// TODO: figure out how to properly do unsigned 64-bit shifts in signed 32-bit JS... WASM? BigInt?


export const reservedUrls = [
  /^\/?utf$/,
  /tapps_\w+/,
];

export const checkIfNotReserved = (url: string) => reservedUrls.every(reg => !reg.test(url));

export function isInline() {
  return (typeof WebApp.initDataUnsafe.query_id === 'undefined')
    && (typeof WebApp.initDataUnsafe.chat_instance === 'undefined')
    && JSON.stringify(WebApp.initDataUnsafe) !== '{}';
}

export function parseParms(hash: string) {
  return hash.replace(/^#/, '').split('&').reduce((data, param) => {
    const [key, val] = param.split('=');

    return {
      ...data,
      [decodeURIComponent(key)]: decodeURIComponent(val),
    };
  }, {} as Record<string, string>);
}

export function setFrameColor(...args: Parameters<typeof WebApp.setHeaderColor>) {
  WebApp.setHeaderColor(...args);
  WebApp.setBottomBarColor(...args);
}

export function setFrameColorToTopElementBg() {
  runLater(() => requestAnimationFrame(() => {
    // set header color from the top element
    setColorFromCoords(WebApp.setHeaderColor, [0, 0]);

    // set bottom bar color from the bottom element
    setColorFromCoords(WebApp.setBottomBarColor, [0, document.documentElement.clientHeight - 1]);
  }));
}

function setColorFromCoords<S extends string>(setter: (color: S) => void, coords: [x: number, y: number]) {
  const color = getColorAtCoords(...coords);

  if (color) {
    setter(tinycolor(color).toHexString() as S);
  }
}

function getColorAtCoords(x: number, y: number) {
  const topmostElements = document.elementsFromPoint(x, y);

  if (topmostElements.length <= 0) return undefined;

  const color = getBackgroundOfElementStack(topmostElements);

  return color;
}

function getBackgroundOfElementStack(topmostElements: Element[]) {
  for (let i = 0; i < topmostElements.length; i++) {
    const el = topmostElements[i];
    const color = tinycolor(getComputedStyle(el).backgroundColor);

    // exit if we found a valid non-transparent color
    if (color.a > 0) {
      return color.toHex8String();
    }
  }
}
