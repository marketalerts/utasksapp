import { fetchUtasks } from 'shared/network';

import { RedeemCode } from './adapter';

export const redeem = (code: string) => (
  fetchUtasks
    .post('/api/price/redeem/{code}', { params: { path: { code } } })
);

export const getRedeemCodeInfo = (code: string) => (
  fetchUtasks
    .get('/api/price/redeem/{code}', { params: { path: { code } } })
    .then(r => {
      if (r.data) {
        return new RedeemCode(r.data);
      }

      throw new Error('Code invalid');
    })
);
