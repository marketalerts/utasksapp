import { mapFactory } from 'parakeet-mapper';

import type { Schema } from 'shared/network';

import { toClientItem } from './project.adapter';
import type { ClientItem } from './project.adapter';
import { toClientList } from './list.adapter';
import type { ClientList } from './list.adapter';

export interface ClientGroupTree {
  taskGroups: ClientItem[];
  areas: ClientList[];
  projects: ClientItem[];
}

export const toClientGroupTree = mapFactory<Schema.GroupModel, ClientGroupTree>({
  taskGroups: g => g.taskGroups?.map(toClientItem) ?? [],
  areas: g => g.areas?.map(toClientList) ?? [],
  projects: g => g.projects?.map(toClientItem) ?? [],
});
