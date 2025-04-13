
import { createMemo, For, Show } from 'solid-js';
import type { Component, ComponentProps } from 'solid-js';

import Priority from 'icons/list/Priority.svg';
import Task from 'icons/list/Create.svg';
import Command from 'icons/list/Command.svg';
import Business from 'icons/list/Business.svg';
import Avatar from 'icons/list/Avatar.svg';
import Arrow from 'icons/ArrowRight.svg';
import PurpleStack from 'i/IconPurpleStack.svg';
import People from 'i/IconPeople.svg';
import Folder from 'i/IconFolder.svg';
import Files from 'i/IconFiles.svg';
import Clock from 'i/IconClock.svg';

const benefitIcons = {
  PurpleStack,
  People,
  Folder,
  Files,
  Clock,
  Task,
  Business,
  Avatar,
  Command,
  Priority,
};

export interface Benefit {
  text: string;
  link: string;
}

export function createBenefitGenerator(
  getText: (key: string) => string | undefined,
  getLink: (key: string) => string,
) {
  return function* (): Generator<Benefit> {
    const EOF = getText('-1');
    let text: string | undefined = undefined;
    for (let i = 0; true; i++) {
      text = getText(String(i));

      if ([undefined, '', 'undefined', EOF].includes(text)) {
        return;
      }

      const link = getLink(String(i));

      yield {
        text: text as string,
        link,
      };
    }
  };
}

export default function Benefits(props: {
  class?: string;
  getBenefits: () => Generator<Benefit>;
}) {
  const benefits = createMemo(() => {
    const _benefits: {
      icon: Component<ComponentProps<'svg'>>;
      href: string;
      title: string;
      subtitle: string;
      badge?: string
    }[] = [];

    for (const { text, link } of props.getBenefits()) {
      if (['', 'undefined'].includes(text)) {
        break;
      }

      const [_icon, title, subtitle] = text.split(': ');
      const [icon, badge] = _icon.split('!');

      try {
        _benefits.push({
          icon: benefitIcons[icon as keyof typeof benefitIcons],
          href: link,
          title,
          subtitle,
          badge,
        });
      } catch (error) {
        console.log('Probably missing icon');
        console.error(error);
      }
    }

    return _benefits;
  });

  return <>
    <ul class="=pro-benefits-list reset-list bg-tg_bg rounded-3"
      classList={{
        [String(props.class)]: !!props.class,
      }}
    >
      <For each={benefits()}>
        {benefit => (
          <li class="=pro-benefit [&:last-child_.divider]:h-0">
            <a href={benefit.href}
              classList={{ 'pointer-events-none': !benefit.href }}
              class="=pro-benefit-link w-full h-full flex items-center px-4 py-2 gap-4"
            >
              <benefit.icon class="= min-w-7.5" />
              <div class="= relative flex items-center flex-grow">
                <div class="= flex flex-col flex-grow">
                  <h3 class="= app-text-new-base m-0">
                    {benefit.title}
                    <Show when={benefit.badge}>
                      <span class="= px-1 py-0 rounded-1.5 app-text-badge c-tg_button_text bg-urgent ltr:ml-2 rtl:mr-2">
                        {benefit.badge}
                      </span>
                    </Show>
                  </h3>
                  <p class="= app-text-footnote c-tg_hint m-0">{benefit.subtitle}</p>
                </div>
                <Show when={benefit.href}>
                  <Arrow class="= fill-tg_hint min-w-6 ltr:mr--2 rtl:ml--2 ltr:right-0 rtl:left-0" />
                </Show>

                <div class="= divider absolute bottom--2 bg-tg_bg_secondary h-[1px] w-full" style={{ 'width': 'calc(100% + 1rem)' }} />
              </div>
            </a>
          </li>
        )}
      </For>
    </ul>
  </>;
}
