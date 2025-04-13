import { mapFactory, mapTypes } from 'parakeet-mapper';

import type { Schema } from 'shared/network';

export enum PaymentOptions {
  MIR = 'MIR',
  MasterCard = 'MC',
  TGWallet = 'Wallet',
  XTR = 'XTR'
}

export const defaultPaymentOptionsArray: PaymentOptions[] = [
  PaymentOptions.MIR,
  PaymentOptions.MasterCard,
  PaymentOptions.TGWallet,
  PaymentOptions.XTR,
];

export interface Plan {
  code: string;
  title: string;
  currency?: string;
  decimals?: number;
  kinds: PlanKind[];
  default?: boolean;
}

export interface PlanKind {
  code: string;
  label: string;
  yearlyPrice: number;
  monthlyPrice: number;
  oldYearlyPrice?: number;
  enabled?: boolean;
  payPrice: number;
  discount?: number;
  discountPercent?: number;
  default?: boolean;
}

export const toClientPlan = (defaultPlan?: boolean) => mapFactory<Schema.UserRoleModel, Plan>({
  code: true,
  title: true,
  currency: true,
  decimals: true,
  default: (p) => defaultPlan && p.prices.every(p => p.enabled !== false),
  kinds: {
    prices: prices => prices.map(
      toClientPrice(
        defaultPlan,
      ),
    ),
  },
});

const toClientPrice = (
  isDefault?: boolean,
) => (price: Schema.UserRoleLabeledPriceModel) => (
  mapTypes<Schema.UserRoleLabeledPriceModel, PlanKind>(price, {
    code: true,
    label: true,
    enabled: true,
    payPrice: 'amount',
    monthlyPrice: 'amountM',
    yearlyPrice: 'amountY',
    oldYearlyPrice: 'oldAmount',

    default: (p) => isDefault && p.enabled !== false,
    discount: (price) => (
      price.oldAmount ? price.oldAmount - price.amountY : 0
    ),
    discountPercent: (price) => (
      price.oldAmount
      ? calculateDiscount(price.amountY, price.oldAmount)
      : 0
    ),
  })
);

function calculateDiscount(amount: number, oldAmount: number) {
  return Math.round(((oldAmount - amount) / oldAmount) * 100);
}

export const FreePlan: Plan = {
  code: 'FREE',
  title: 'Free',
  default: false,
  currency: 'RUB',
  kinds: [{
    code: 'F',
    label: '',
    monthlyPrice: 0,
    payPrice: 0,
    yearlyPrice: 0,
  }],
};
