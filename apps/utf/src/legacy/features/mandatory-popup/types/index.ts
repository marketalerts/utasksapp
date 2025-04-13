import { useRedeemCode } from './redeem-code/use';

export function useSplash() {
  const redeemProps = useRedeemCode();

  return redeemProps;
}
