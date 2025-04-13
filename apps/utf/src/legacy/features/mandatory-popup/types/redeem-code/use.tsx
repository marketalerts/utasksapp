import { lazy, createResource, useContext } from 'solid-js';
import { useNavigate, useSearchParams } from '@solidjs/router';

import { ProfileContext } from 'f/profile/profile.context';
import type { SplashProps } from 'f/mandatory-popup/ui/splash-root';

import { getRedeemCodeInfo, redeem } from './network';
import { SplashContext } from './context';
import { CodeActivationType } from './adapter';

import type { SplashInit } from '../../ui';

export function useRedeemCode() {
  const [params, setParams] = useSearchParams();

  const code = params.redeem;

  const SplashComponent = lazy(() => import('./ui'));

  const [, { refetch: refetchUser }] = useContext(ProfileContext);

  const redeemData = createResource(() => code ? getRedeemCodeInfo(code) : Promise.reject());

  const navigate = useNavigate();

  const onContinue = () => code
    ? () => (
        redeemData[0].latest?.activated ? Promise.resolve() : redeem(code)
      ).then(r => {
        setParams({ ...params, redeem: undefined }, { replace: true });

        const data = redeemData[0].latest;
        if (data && data.activationType === CodeActivationType.Promo) {
          navigate('/subscribe?promo=' + data.code);
        }

        return Promise.resolve(refetchUser()).then(() => r);
      })
    : () => Promise.reject();

  const isSplashActive = () => redeemData[0].loading ? !!params.redeem : (!!params.redeem && !redeemData[0].error);

  const SplashWithContext = (props: SplashProps) => {
    return <SplashContext.Provider value={redeemData}>
      <SplashComponent {...props} />
    </SplashContext.Provider>;
  };

  return {
    isActive: isSplashActive,
    onContinueFactory: onContinue,
    component: () => SplashWithContext,
  } satisfies SplashInit;
}
