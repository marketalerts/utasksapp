import { Copy, Immutable, Mapable, Rename } from 'data-mapper';

import { resolvedBackendUrl } from 'shared/network/base-client';
import type { Schema } from 'shared/network';

export { UserStatus as ClientUserStatus } from 'shared/network/schema';

@Immutable
export class ClientUser extends Mapable<Schema.UserModel> {
  @Copy
  userId?: number;

  @Copy(title => title ?? '')
  title!: string;

  @Copy
  userName?: string;

  @Rename('smallFileId', fileId => fileId
    ? `${resolvedBackendUrl}/api/files/${fileId}`
    : undefined)
  avatar?: string;

  @Copy
  status?: Schema.UserStatus;
}
