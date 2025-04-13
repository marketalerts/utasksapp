import { set } from 'solid-utils/access';
import { Dynamic } from 'solid-js/web';
import { Show, createResource, createSignal, mergeProps } from 'solid-js';
import type { ParentProps, Component, Signal } from 'solid-js';

import './index.css';

export interface SplashProps {
  isLoading: boolean;
  onMainButtonClick: VoidFunction;
  value?: Signal<string>;
}

export default function TrialSplashRoot(_props: ParentProps<{
  active: boolean | undefined;
  onContinue?: () => Promise<unknown>;
  splash?: Component<SplashProps>;
  value?: Signal<string>;
}>) {
  const props = mergeProps({ onContinue: () => Promise.resolve() }, _props);
  const actionResult = createSignal<Promise<unknown>>(Promise.reject());

  const [coninued] = createResource(
    actionResult[0],
    (initiateAction) => initiateAction
      .then(() => true)
      .catch(() => false),
    { initialValue: false },
  );

  return <Show when={props.active && !coninued()} fallback={props.children}>
    <Dynamic component={props.splash}
      isLoading={coninued.loading}
      onMainButtonClick={() => set(actionResult, props.onContinue())}
      value={props.value}
    />
  </Show>;
}
