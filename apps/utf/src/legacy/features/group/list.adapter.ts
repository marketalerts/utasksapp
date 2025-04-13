import { mapFactory } from 'parakeet-mapper';

import { resolvedBackendUrl } from 'shared/network/base-client';
import { getLocalToken } from 'shared/network/auth';
import type { Schema } from 'shared/network';

import { isArea } from 'f/project/project.adapter';

import { ItemType, projectToClientItem } from './project.adapter';
import type { ClientItem } from './project.adapter';

export interface ClientList extends ClientItem {
  id: string;
  name: string;
  icon?: string;
  items: ClientItem[];
}

export const toClientList = mapFactory<Schema.AreaModel, ClientList>({
  id: [id => isArea({ id }) ? id : 'a_' + id],
  name: true,
  icon: area => area.smallFileId
    ? `${resolvedBackendUrl}/api/areas/${area.id}/logo/${area.smallFileId}?token=${getLocalToken()}`
    : undefined,
  items: area => area.projects?.map(projectToClientItem) ?? [],
  type: () => ItemType.Dynamic,
});
