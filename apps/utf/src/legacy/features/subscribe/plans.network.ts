import { convertResponse, dedupe, fetchUtasks } from 'shared/network';

import { toClientPlan } from './plans.adapter';
import type { PaymentOptions } from './plans.adapter';

export const fetchPlans = dedupe((signal, paymentOption: PaymentOptions, redeemable: boolean, subscriptionsAmount: number) => (
  fetchUtasks
    .get('/api/price', { params: { query: { paymentOption, count: subscriptionsAmount, isRedeem: redeemable } }, signal })
    .then(convertResponse(plans => plans.map((plan, index) => toClientPlan(index === 0)(plan))))
));

export const fetchInvoice = (planCode: string, priceCode: string, agreeTerms: boolean, paymentOption: PaymentOptions, redeemable: boolean, subscriptionsAmount: number) => (
  fetchUtasks
    .get('/api/price/invoice/{roleCode}/{priceCode}', { params: {
      path: { roleCode: planCode, priceCode },
      query: { agreeTerms, paymentOption, count: subscriptionsAmount, isRedeem: redeemable },
    } })
    .then(r => {
      if (r.data) {
        return r.data;
      }

      throw new Error('No invoice generated');
    })
);

export const applyPromocode = (promocode: string) => (
  fetchUtasks
    .post('/api/price/promo/{promocode}', { params: { path: { promocode } } })
    .then(r => {
      if (r.response.status >= 400 || r.error) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        throw { status: r.response.status, ...r.error };
      }

      return r.data;
    })
);

export const unsubscribe = (userId: string) => (
  fetchUtasks
    .post('/api/profile/{id}/unsubscribe', { params: { path: { id: userId } } })
);
