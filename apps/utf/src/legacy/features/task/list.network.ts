import { map } from 'rambda';
import { to } from 'data-mapper';

import { fetchUtasks, convertResponse } from 'shared/network';

import { ClientTask } from './task.adapter';
import { toServerFilterType } from './list.adapter';
import type { FilterType } from './list.adapter';

export const fetchTasks = (
  id: string,
  viewMode?: string,
  groupBy?: string,
  filterBy?: FilterType,
) => (
  fetchUtasks
    .get('/api/projects/{id}/tasks', { params: {
      path: { id },
      query: { taskGroup: viewMode, groupBy, filterBy: toServerFilterType(filterBy) },
    } })
    .then(convertResponse(map(to(ClientTask))))
);
