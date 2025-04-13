import type { ComponentProps } from 'solid-js';

import { Marker } from 'shared/memoize';

export const linkRegexp = /(?:https?:\/\/)?(?:[\w\-%]+\.)+(?:[^0-9/\s][\w\-%]+)(?:(?:(?:\/[\w\-%+]*)+(?:\.[\w\-%+]+)*)+(?:\?(?:[\w\-%:+]+?(?:=[\w\-%:]+)?&?)+)?(?:#(?:[\w\-%:+]+?(?:=[\w\-%:+]+)?&?)+)?)?/gmi;

export const LinkMatch = (props: { link: string, class?: string }) => {
  const [left, right] = props.link.split(linkRegexp);
  const link = props.link.trim();
  const normalizedLink = /^https?:\/\//.test(link) ? link : ('https://' + link);

  return <>
    {left}
    <a href={normalizedLink} class="c-tg_link underline pointer-events-auto!" target="_blank"
      classList={{ [String(props.class)]: !!props.class }}
    >
      {link}
    </a>
    {right}
  </>;
};

export function useLinkMarker(options?: {
  dependencies?: () => void;
  props?: Partial<ComponentProps<typeof LinkMatch>>
}) {
  return new Marker(match => <LinkMatch link={match()} {...options?.props} />, { pattern: linkRegexp, dependencies: options?.dependencies });
}
