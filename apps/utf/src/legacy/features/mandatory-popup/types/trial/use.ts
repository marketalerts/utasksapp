import { createSignal, lazy, useContext } from 'solid-js';
import { makePersisted } from '@solid-primitives/storage';

import { ProfileContext } from 'f/profile/profile.context';

import { markTrialStart, markTrialEnd } from './network';

import { CloudStorage } from 'shared/ui/telegram';

import type { SplashInit } from '../../ui';


export function useTrial(isActive: () => boolean) {
  const TrialStart = lazy(() => import('./ui/start'));
  const TrialFinish = lazy(() => import('./ui/end'));

  const [profile, { refetch }] = useContext(ProfileContext);

  const [hasTrialStarted, setTrialStarted] = makePersisted(createSignal(false), {
    name: 'trial-started',
    storage: CloudStorage,
  });

  const [hasTrialEnded, setTrialEnded] = makePersisted(createSignal(false), {
    name: 'trial-ended',
    storage: CloudStorage,
  });

  const isSplashActive = (() => !!(isActive() !== false && profile.loading ? !hasTrialEnded() && (
    profile.latest.showStartPage || profile.latest.showFinishPage
  ) : (profile.latest.showStartPage || profile.latest.showFinishPage)));

  const isStartSplashActive = (() => profile.latest.showStartPage);
  const isFinishSplashActive = (() => profile.latest.showFinishPage);
  const selectedType = createSignal('PRO');

  const startTrial = () => markTrialStart().then(() => (setTrialStarted(true), setTrialEnded(false), refetch()));
  const endTrial = () => markTrialEnd(selectedType[0]()).then(() => (setTrialStarted(true), setTrialEnded(true), refetch()));

  const onContinue = (() => {
    return isStartSplashActive() ? startTrial
      : isFinishSplashActive() ? endTrial
      : undefined;
  });

  return {
    isActive: isSplashActive,
    onContinueFactory: onContinue,
    value: selectedType,
    component: () => isStartSplashActive() ? TrialStart : isFinishSplashActive() ? TrialFinish : undefined,
  } satisfies SplashInit;
}