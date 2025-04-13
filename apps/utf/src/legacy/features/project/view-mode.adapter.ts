import { Copy, Immutable, Mapable, Rename, to } from 'data-mapper';

import type { Schema } from 'shared/network';

export const enum ViewMode {
  All = 'all',
  Author = 'author',
  Assignee = 'assignee'
}

const nullViewModes = [
  { code: ViewMode.All, name: ViewMode.All, count: 0 },
  { code: ViewMode.Author, name: ViewMode.Author, count: 0 },
  { code: ViewMode.Assignee, name: ViewMode.Assignee, count: 0 },
];

@Immutable
export class ClientItemViewMode extends Mapable<Schema.TaskCounterModel> {
  @Rename('code')
  id!: ViewMode;

  @Copy
  name!: string;

  @Copy
  count!: number;

  @Copy
  disabled?: boolean;
}

export const toClientItemViewMode = to(ClientItemViewMode);

export const defaultViewModes = (count = 0): ClientItemViewMode[] => (count === 0 ? nullViewModes : [
  { code: ViewMode.All, name: ViewMode.All, count },
  { code: ViewMode.Author, name: ViewMode.Author, count },
  { code: ViewMode.Assignee, name: ViewMode.Assignee, count },
]).map(toClientItemViewMode);

export const defaultViewMode: ClientItemViewMode = new ClientItemViewMode({
  code: ViewMode.All, name: ViewMode.All, count: 0,
});
