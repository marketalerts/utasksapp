import type { ParentProps } from 'solid-js';

import { SubscribePage } from 'f/subscribe/subscribe.ui';

export default function Subscription(props: ParentProps) {
  return <>
    {/* <Title>{t('subscribe title')}</Title> */}
    <SubscribePage />

    {props.children}
  </>;
}
