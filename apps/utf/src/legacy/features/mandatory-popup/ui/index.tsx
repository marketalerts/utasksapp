import { Show, useContext } from 'solid-js';
import type { Component, ParentProps, Signal } from 'solid-js';

import { ProfileContext } from 'f/profile/profile.context';

import SplashRoot from './splash-root';
import type { SplashProps } from './splash-root';

export interface SplashInit {
  isActive: () => boolean;
  onContinueFactory: () => (() => Promise<unknown>) | undefined;
  component: () => Component<SplashProps> | undefined;
  value?: Signal<string>;
}

export default function Splash(props: ParentProps<SplashInit>) {
  const [profile] = useContext(ProfileContext);

  return <Show when={!profile.loading} fallback={<></>}>
    <SplashRoot active={props.isActive()}
      splash={props.component()}
      onContinue={props.onContinueFactory()}
      value={props.value}
    >
      {props.children}
    </SplashRoot>
  </Show>;
}
