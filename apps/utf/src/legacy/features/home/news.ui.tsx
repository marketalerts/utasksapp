import WebApp from 'tma-dev-sdk';
import { get, set } from 'solid-utils/access';
import { For, Show, createMemo, createSignal } from 'solid-js';
import { A } from '@solidjs/router';
import { makePersisted } from '@solid-primitives/storage';
import { TinyColor } from '@ctrl/tinycolor';

import { isMobile } from 'shared/platform';

import { t } from './locales';

import List from 'shared/ui/list';

import Telegram from 'icons/list/Telegram.png';
import Chevron from 'icons/ChevronRightSM.svg';

function getHue(i: number): number {
  return ((i * Math.PI) + 4) * 50;
}

export default function News(props: { alwaysOpen?: boolean; }) {
  const expanded = makePersisted(createSignal(true), {
    name: 'newsFeedOpen',
  });

  const news = createMemo(() => [...getNews()]);

  return <List type="div" each={[{
    hintOpen: t('telegram channel-hide'),
    hintClosed: t('telegram channel-show'),
    name: t('telegram channel name'),
    icon: Telegram,
  }]}
  >
    {(li) => <>
      <List.Item semantic={false}
        class="= max-h-11 overflow-hidden app-transition-max-height"
        classList={{
          'max-h-36': props.alwaysOpen || get(expanded),
          'cursor-initial!': props.alwaysOpen,
        }}
        left={<img src={li.icon} class="= rounded-full mx-[-1px] min-w-[32px] h-[32px]" />}
        onClick={() => props.alwaysOpen || set(expanded, !get(expanded))}
        right={
          <Show when={!props.alwaysOpen}>
            <span class="= c-tg_hint app-text-subheadline! ltr:text-right rtl:text-left text-ellipsis text-nowrap overflow-hidden ltr:mr-1 rtl:ml-1">
              {get(expanded) ? li.hintOpen : li.hintClosed}
            </span>
          </Show>
        }
        bottom={
          <div class="=news-list flex p-4 pt-1 gap-2 overflow-y-hidden overflow-x-visible cursor-initial!"
            onClick={e => e.stopPropagation()}
          >
            <For each={news()}>
              {(pill, index) => <NewsItem {...pill} index={index()} fill={news().length === 1} />}
            </For>
          </div>
        }
      >
        <span class="= c-tg_hint app-text-footnote!">
          {li.name}
        </span>
      </List.Item>
    </>}
  </List>;

  function NewsItem(props: NewsPill & { index: number; fill?: boolean; }) {
    const image = createMemo(() => props.image.replace(/:[0-9]+$/, ''));
    const bg = () => Number(props.image.replace(/^.*?:/, ''));

    const color = createMemo(() => {
      const _bg = bg();
      const tColor = new TinyColor({
        h: _bg || getHue(props.index),
        l: 0.80,
        s: _bg === 9 ? 0 : 0.95,
        a: 0.20,
      });

      return tColor.toHslString();
    });

    let card!: HTMLDivElement;
    let isScrolling = false;

    const [onGrabStart, onGrabMove, onGrabEnd, isGrabbing] = useGrab(
      function scrollBy(direction: number) {
        isScrolling = true;
        card.parentElement?.scrollTo({
          behavior: 'smooth',
          left: card.offsetWidth * (direction + props.index),
          top: 0,
        });

        // This is stupid, but works for now
        setTimeout(() => isScrolling = false, 300);
      },
    );

    let nativeOpenNotWorking = false;

    return <div class="= rounded-2 flex gap-2 min-w-[290px] overflow-hidden cursor-grab"
      style={{ 'background-color': color() }}
      classList={{ 'cursor-grabbing!': get(isGrabbing), 'min-w-[100%]!': props.fill }}
      ref={card}
      onClick={e => {
        e.stopPropagation();

        if (isScrolling) {
          return;
        }

        card.parentElement?.scrollTo({
          behavior: 'smooth',
          left: card.offsetLeft - 32,
          top: 0,
        });
      }}
      onMouseDown={onGrabStart}
      onMouseUp={onGrabEnd}
      onMouseOut={onGrabEnd}
      onMouseMove={onGrabMove}
    >
      <div class="= flex flex-col flex-grow justify-center ltr:pl-4 rtl:pr-4 gap-0.5">
        <p class="= m-0 font-590! text-[0.9rem]!">
          {props.title}
        </p>
        <Show when={props.link.includes('://')}
          fallback={
            <A class="app-text-footnote! m-0 c-tg_link inline-flex items-center gap-1" href={`/${props.link}`}>
              {props.linkText}
              <Chevron class="= fill-tg_link mb--0.5" />
            </A>
          }
        >
          <a class="app-text-footnote! m-0 c-tg_link inline-flex items-center gap-1" href={props.link}
            target="_blank"
            onClick={(e) => {
              if (nativeOpenNotWorking) {
                return;
              }

              e.preventDefault();
              e.stopPropagation();

              try {
                WebApp.openTelegramLink(props.link);
              } catch {
                nativeOpenNotWorking = true;
                (e.target as HTMLAnchorElement).click();
              }
            }}
          >
            {props.linkText}
            <Chevron class="= fill-tg_link mb--0.5" />
          </a>
        </Show>
      </div>
      <img src={import.meta.env.BASE_URL + import.meta.env.APP_BASE + image()}
        class="= aspect-ratio-1/1 cursor-initial h-20 w-20"
        onMouseDown={e => e.stopPropagation()}
      />
    </div>;
  }
}

function *getNews(): Generator<NewsPill> {
  const key = (i: number) => ({ key: String(i), fallback: '' });

  for (
    let i = 0, title = t('telegram channel feed title', key(i));
    title && i < 15;
    title = t('telegram channel feed title', key(++i))
  ) {
    try {
      yield {
        title,
        link: t('telegram channel feed link', key(i)),
        linkText: t('telegram channel feed link-text', key(i)),
        image: t('telegram channel feed image', key(i)),
      };
    } catch {
      return;
    }
  }
}

interface NewsPill {
  title: string;
  link: string;
  linkText: string;
  image: string;
}

function useGrab(scrollBy: (direction: number) => void, limit = 15) {
  let grabLength = 0;
  const isGrabbing = createSignal(false);

  function onGrabStart() {
    if (isMobile() || get(isGrabbing)) {
      return;
    }

    set(isGrabbing, true);
    grabLength = 0;
  }

  function onGrabEnd() {
    if (isMobile() || !get(isGrabbing)) {
      return;
    }

    set(isGrabbing, false);
    grabLength = 0;
  }

  function onGrabMove(e: MouseEvent) {
    if (isMobile() || !get(isGrabbing)) {
      return;
    }

    // Using e.movementX is fine
    // because we don't care about the actual value
    // only its sign
    grabLength += e.movementX;

    if (Math.abs(grabLength) < limit) {
      return;
    }

    set(isGrabbing, false);

    const direction = grabLength < 0 ? 1 : -1;

    scrollBy(direction);
  }

  return [onGrabStart, onGrabMove, onGrabEnd, isGrabbing] as const;
}
