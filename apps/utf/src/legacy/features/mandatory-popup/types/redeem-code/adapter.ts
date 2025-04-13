import { Copy, Immutable, Mapable } from 'data-mapper';

import type { Schema } from 'shared/network';

import { ClientUser } from 'f/project/users.adapter';

@Immutable
export class RedeemCode extends Mapable<Schema.RedeemModel> {
  @Copy
  code!: string;

  @Copy(code => {
    switch (code) {
      case 'HappyBirthday':
        return CodeType.Birthday;
      case 'Gift':
        return CodeType.Gift;

      default:
        return CodeType.Generic;
    }
  })
  type!: CodeType;

  @Copy(type => {
    switch (type) {
      case 'Promocode':
        return CodeActivationType.Promo;

      default:
        return CodeActivationType.Redeem;
    }
  })
  activationType!: CodeActivationType;

  @Copy(x => x ? new ClientUser(x) : x)
  author?: ClientUser;

  @Copy
  priceCode!: string;

  @Copy
  activated!: boolean;
}

export const enum CodeType {
  Generic = 'generic',
  Gift = 'gift',
  Birthday = 'birthday',
}

export const enum CodeActivationType {
  Redeem = 'redeem',
  Promo = 'promocode',
}
