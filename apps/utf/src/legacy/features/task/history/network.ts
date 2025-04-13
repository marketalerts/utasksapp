import { convertResponse, fetchUtasks } from 'shared/network';

import { toClientTaskHistory } from './adapter';
import type { HistoryFilter, HistorySorting } from './adapter';

export const fetchTaskHistory = (taskId: string, filter?: HistoryFilter, sort?: HistorySorting) => (
  fetchUtasks
    .get('/api/tasks/{id}/history', {
      params: { path: { id: taskId }, query: { filter: filter ?? undefined, sort: sort ?? undefined } },
    })
    .then(convertResponse(toClientTaskHistory))
);
