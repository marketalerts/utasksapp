import type { JSX } from 'solid-js';
import { omit } from 'rambda';

import type { ListItemProps } from './item';

import List from '.';

export interface ListLinksProps {
  each: Array<{
    title: () => JSX.Element;
  } & Omit<ListItemProps, 'children' | 'title'>>;
}

export default function ListLinks(props: ListLinksProps) {
  return <>
    <List each={props.each}>
      {(value) => <List.Item {...omit(['title'], value)}>{value.title()}</List.Item>}
    </List>
  </>;
}
