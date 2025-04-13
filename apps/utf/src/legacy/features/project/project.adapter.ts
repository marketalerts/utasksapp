import { Copy, Immutable, Map, Mapable, Rename, from, to } from 'data-mapper';

import { ProjectType } from 'shared/network/schema';
import { resolvedBackendUrl } from 'shared/network/base-client';
import { getLocalToken } from 'shared/network/auth';
import type { Schema } from 'shared/network';

export { ProjectType };

export interface ClientItem {
  id: string;
  name: string;
  type: Schema.ProjectType; // TODO: make non-nullable
  description?: string;
  href?: string;
  urgent?: number;
  count?: number;
  bold?: boolean;
  used?: boolean;
  position?: number;
  chatId?: number;

  icon?: string;
  userCount?: number;
}

export const toProjectHref = (project: { id: string; name: string; type?: ProjectType; }) => (
  `/${project.id}` + (project.type !== ProjectType.Dynamic ? `?${new URLSearchParams({ name: project.name, type: String(project.type) })}` : '')
);

@Immutable
export class ProjectItem extends Mapable<Schema.ProjectModel> implements ClientItem {
  @Copy
  id!: string;

  @Copy
  name!: string;

  @Copy
  description?: string;

  @Map(input => toProjectHref({
    id: '',
    name: input.id ?? '',
    ...input,
    type: input.type as ProjectType | undefined,
  }))
  href!: string;

  @Copy
  type!: ProjectType;

  @Copy
  position!: number;

  @Rename('openTaskCount')
  count!: number;

  @Copy
  used!: boolean;

  @Copy(x => x)
  userCount?: number;

  @Copy
  chatId?: number;

  @Map(project => project.smallFileId
    ? `${resolvedBackendUrl}/api/${isArea({ id: project.id ?? '' }) ? 'areas' : 'projects'}/${project.id}/logo/${project.smallFileId}?token=${getLocalToken()}`
    : isArea({ id: project.id ?? '' }) ? undefined : project.id)
  icon?: string;

  bold = false;
}

export const projectToClientItem = to(ProjectItem);

export const clientItemToProject = from(ProjectItem);

export function isArea(project: { id: string; }) {
  return project.id.startsWith('a_') && project.id.length > 15;
}

export function isGroup(project: { id: string; }) {
  return project.id.startsWith('g_') && project.id.length < 15;
}
