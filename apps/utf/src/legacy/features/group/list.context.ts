import { createContext, createResource, createSignal } from 'solid-js';
import type { InitializedResourceReturn, Signal } from 'solid-js';

import { defaultProject, persistProject } from 'f/project/project.context';

import type { ClientItem } from './project.adapter';
import { fetchGroupTree } from './group-tree.network';
import { groupTreeKey, lastGroupTree } from './group-tree.context';
import { toClientGroupTree } from './group-tree.adapter';
import type { ClientGroupTree } from './group-tree.adapter';
import { fetchAreas, fetchStrandedProjects } from './area.network';

const projectPersisters: Record<string, (p: ClientItem | ((prev?: ClientItem) => ClientItem)) => unknown> = {};

export const GroupTreeContext = createContext<InitializedResourceReturn<ClientGroupTree>>();

export const initialValue: ClientGroupTree = lastGroupTree ? JSON.parse(lastGroupTree) : toClientGroupTree({
  'taskGroups': [
    {
      'code': 'g_all',
      'name': 'All',
      'urgent': 0,
      'count': 0,
    },
    {
      'code': 'g_inc',
      'name': 'Inbox',
      'urgent': 0,
      'count': 0,
    },
    {
      'code': 'g_tod',
      'name': 'Today',
      'count': 0,
      'urgent': 0,
    },
    {
      'code': 'g_tom',
      'name': 'Tomorrow',
      'urgent': 0,
      'count': 0,
    },
    {
      'code': 'g_next7',
      'name': 'Next 7 days',
      'urgent': 0,
      'count': 0,
    },
    {
      'code': 'g_compl',
      'name': 'Completed',
      'urgent': 0,
      'count': 0,
    },
  ],
});

export const createGroupTreeResource = () => createResource(async () => {
  const r = await fetchGroupTree();
  const result = r.data ?? { taskGroups: [], projects: [], areas: [] };

  localStorage.setItem(groupTreeKey, JSON.stringify(result));

  // Save project data to preventively fix broken links
  setTimeout(() => {
    result.projects.map(saveProjectData);
    result.taskGroups.map(saveProjectData);
    result.areas.map(a => a.items.map(saveProjectData));
  });

  return result;
}, {
  initialValue: initialValue,
});

const emptyGroupTree = { areas: [], projects: [], taskGroups: [] } satisfies ClientGroupTree;

export const createLocalGroupTreeResource = (dummy: Signal<boolean> = createSignal(false)) => createResource(
  () => dummy,
  ([createDummyResource]) => createDummyResource() ? emptyGroupTree : (
    Promise.all([
      fetchAreas().then(r => r.data ?? []),
      fetchStrandedProjects().then(r => r.data ?? []),
    ])
      .then(([areas, projects]) => ({
        taskGroups: [defaultProject],
        areas,
        projects,
      } as ClientGroupTree))
  ),
  { initialValue: emptyGroupTree },
);

function saveProjectData(p: ClientItem) {
  return (projectPersisters[p.id] ??= persistProject(p.id)[1])(oldP => ({ ...oldP, ...p }));
}
