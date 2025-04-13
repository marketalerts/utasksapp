import { Copy, Immutable, Map, Mapable, Rename, from, to } from 'data-mapper';

import { Schema } from 'shared/network';

import { projectToClientItem, ProjectType, toProjectHref } from 'f/project/project.adapter';
import type { ClientItem } from 'f/project/project.adapter';

import { t } from './locales';

/**
 * @deprecated
 */
export const toGroupHref = (group: Partial<Schema.TaskGroupModel>) => (
  toProjectHref({
    id: group.code ?? '',
    name: group.name ?? '',
    type: ProjectType.Dynamic,
  })
);

/**
 * @deprecated
 */
@Immutable
export class GroupItem extends Mapable<Schema.TaskGroupModel> implements ClientItem {
  @Rename('code')
  id!: string;

  get name(): string {
    return this.id ? t('group-name', { key: this.id, fallback: GroupItem.original(this).name }) : GroupItem.original(this).name;
  }

  @Rename('code')
  icon!: string;

  @Map(toGroupHref)
  href!: string;

  @Copy
  count!: number;

  @Copy(x => x ?? 0)
  urgent!: number;

  bold = true;
  used = false;
  position = 0;
  userCount = 0;

  type = Schema.ProjectType.Dynamic;

  description?: string;
}

/**
 * @deprecated
 */
export const taskGroupToClientItem = to(GroupItem);

export const isProject = (v: Schema.ProjectModel | Schema.TaskGroupModel): v is Schema.ProjectModel => (
  'id' in v && typeof v.id === 'string'
);

export const toClientItem = <S extends Schema.ProjectModel | Schema.TaskGroupModel | undefined>(
  serverItem: S,
) => (serverItem ? (
  isProject(serverItem)
    ? projectToClientItem(serverItem)
    : taskGroupToClientItem(serverItem)
) : undefined) as S extends undefined ? undefined : ClientItem;

export const toServerGroup = from(GroupItem);

export { projectToClientItem, ClientItem, ProjectType as ItemType };
