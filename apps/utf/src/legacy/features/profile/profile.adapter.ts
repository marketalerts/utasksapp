import WebApp from 'tma-dev-sdk';
import { map } from 'rambda';
import { Copy, Immutable, Rename, Map, to, Mapable } from 'data-mapper';

import { resolvedBackendUrl } from 'shared/network/base-client';
import type { Schema } from 'shared/network';

import { PaymentOptions } from 'f/subscribe/plans.adapter';

export const enum Permissions {
  PrivateProjectTaskCount = 'PRIVATE.TASK.COUNT',
  PublicProjectTaskCount = 'PUBLIC.TASK.COUNT',
  PublicProjectLimit = 'PUBLIC.COUNT',
  PrivateProjectLimit = 'PRIVATE.COUNT',
  AreaLimit = 'AREA.VIEW',
  TaskAssigneeLimit = 'TASK.ASSIGN.COUNT',
  FileSize = 'TASK.FILE.SIZE',
  FilesAmount = 'TASK.FILE.COUNT',
  Status = 'TASK.STATUS',
  Priority = 'TASK.PRIORITY',
  DueDate = 'DUEDATE',
}

@Immutable
export class ClientPermission extends Mapable<Schema.UserRolePermissionModel> {
  @Rename('name')
  name!: string;

  @Rename('value')
  limit?: number;

  @Copy(used => used == null ? 0 : used)
  used!: number;

  canUse(currentUses?: number | undefined): boolean {
    return this.limit === 0 ? false : (this.limit ?? Infinity) > (currentUses ?? this.used);
  }
}

export const toClientPermission = (p: Schema.UserRolePermissionModel) => new ClientPermission(p);

export const toNullableDate = (date?: string | null) => date == null ? undefined : new Date(date);

@Immutable
export class ClientProfile extends Mapable<Schema.ProfileModel> {
  @Copy
  id!: string;

  @Copy(toNullableDate)
  payDate?: Date;

  @Copy(() => PaymentOptions.XTR)
  defaultPaymentType!: PaymentOptions;

  @Copy
  isStarted!: boolean;

  @Copy
  role!: string;

  @Copy(map(to(ClientPermission)))
  permissions!: ClientPermission[];

  @Rename('version')
  backendVersion!: string;

  @Rename('userName', username => username || WebApp.initDataUnsafe.user?.username || '')
  username!: string;

  @Rename('smallFileId', (
    fileId => fileId
    ? `${resolvedBackendUrl}/api/files/${fileId}`
    : WebApp.initDataUnsafe.user?.photo_url
  ))
  avatar?: string;

  @Rename('roleDate', toNullableDate)
  roleExpires?: Date;

  @Rename('subscription')
  isSubscribed!: boolean;

  @Copy(title => title ?? '')
  roleTitle!: string;

  @Copy
  currency?: string;

  @Copy
  rolePrice!: number;

  @Copy
  rolePriceCode!: 'M' | 'Y';

  @Map(user => ['FREE', '', undefined].includes(user.role))
  isFree!: boolean;

  @Map(user => ['PRO'].includes(user.role!))
  isPro!: boolean;

  firstName = WebApp.initDataUnsafe.user?.first_name;
  lastName = WebApp.initDataUnsafe.user?.last_name;
  language = WebApp.initDataUnsafe.user?.language_code;

  canUseAll(...rules: [permission: Permissions, availableIfNotFound?: boolean, currentUses?: number][]) {
    return rules.every(r => this.canUse(...r));
  }

  canUseAny(...rules: [permission: Permissions, availableIfNotFound?: boolean, currentUses?: number][]) {
    return rules.some(r => this.canUse(...r));
  }

  canUse(permission: Permissions, availableIfNotFound?: boolean, currentUses?: number) {
    return this.getPermission(permission, availableIfNotFound).canUse(currentUses);
  }

  getPermission(permission: Permissions, availableIfNotFound?: boolean) {
    return this.permissions.find(p => p.name.includes(permission)) ?? new ClientPermission({
      name: permission,
      value: availableIfNotFound ? undefined : 0,
    });
  }

  ofRole(role: 'FREE' | 'PRO' | 'TRIAL') {
    return this.role === role;
  }
}

export const toClientProfile = (p: Schema.ProfileModel) => new ClientProfile(p);
