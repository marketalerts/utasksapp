import { createResource } from 'solid-js';

import { fetchTaskHistory } from './network';
import type { HistorySorting, HistoryFilter, ClientTaskHistoryItem } from './adapter';

export const createHistoryResource = (
  taskId: () => string,
  options?: () => {
    sort?: HistorySorting;
    filter?: HistoryFilter;
  },
) => createResource(
  () => [taskId(), options?.()?.filter, options?.()?.sort] as const,
  ([id, filter, sort]) => fetchTaskHistory(id, filter, sort)
    .then(r => {
      if (r.error || r.response.status === 404) {
        throw r.error;
      }

      return r.data ?? [];
    })
    .catch(() => [] as ClientTaskHistoryItem[]),
  {
    initialValue: [],
  },
);
