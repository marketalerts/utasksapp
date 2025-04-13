import type { Schema } from 'shared/network';

export const enum FilterType {
  All = 'All',
  NotCompleted = 'NotCompleted',
  Completed = 'Completed',
}

export const toServerFilterType = (filter?: FilterType): Schema.TaskFilterType => {
  switch (filter) {
    case FilterType.All:
      return 'All' as Schema.TaskFilterType.All;

    case FilterType.Completed:
      return 'IsCompleted' as Schema.TaskFilterType.IsCompleted;

    default:
    case FilterType.NotCompleted:
      return 'IsNotCompleted' as Schema.TaskFilterType.IsNotCompleted;
  }
};
