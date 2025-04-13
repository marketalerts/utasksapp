import { map } from 'rambda';

import { fetchUtasks, convertResponse } from 'shared/network';

import { toServerFilterType  } from 'f/task/list.adapter';
import type { FilterType } from 'f/task/list.adapter';

import { toClientItemViewMode } from './view-mode.adapter';

export const fetchViewModes = (id: string, filterBy?: FilterType) => (
  fetchUtasks
    .get('/api/projects/{id}/taskcounters', { params: { path: { id }, query: { filterBy: toServerFilterType(filterBy) } } })
    .then(convertResponse(map(toClientItemViewMode)))
);
