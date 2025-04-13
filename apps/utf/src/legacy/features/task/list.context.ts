import { persistResource } from 'solid-utils/persist-resource';
import { createContext, createResource, createSignal } from 'solid-js';
import type { Accessor, InitializedResource, InitializedResourceReturn } from 'solid-js';
import { pipe, groupBy } from 'rambda';
import { revert, to } from 'data-mapper';

import type { Schema } from 'shared/network';

import { defaultViewModes } from 'f/project/view-mode.adapter';
import type { ClientItemViewMode } from 'f/project/view-mode.adapter';
import { ProjectType } from 'f/project/project.adapter';
import type { ClientItem } from 'f/project/project.adapter';

import { ClientTask } from './task.adapter';
import { fetchTasks } from './list.network';
import { FilterType } from './list.adapter';


export type TaskGroup<TaskType = ClientTask> = [string, TaskType[]];

export type TaskGroupsPerMode<TaskType = ClientTask> = TaskGroup<TaskType>[][];

export const TaskListContext = createContext<InitializedResourceReturn<TaskGroupsPerMode, TaskGroupsPerMode>>();
export const FilterContext = createContext(createSignal(FilterType.NotCompleted));

export function createTaskListResource(
  project: () => ClientItem,
  viewModes: { state: InitializedResource<any>['state'], latest: (ClientItemViewMode | undefined)[] },
  filter?: FilterType,
  createModeGetter?: () => Accessor<number | undefined> | undefined,
) {
  const key = () => `${project().id}-tasks-${filter ?? FilterType.NotCompleted}`;

  const [getInitial, setInitial, getPromise] = persistResource<TaskGroupsPerMode>({
    key,
    defaultValue: defaultViewModes(project().count).map(() => []),
    serialize: v => v.map(gs => gs.map(g => [g[0], g[1].map(m => revert(m))])),
    deserialize: v => (v as TaskGroupsPerMode<Schema.ListTaskModel>)
      ?.map(gs => gs.map(g => [g[0], g[1].map(to(ClientTask))])),
  });

  const resource = createResource<
    TaskGroupsPerMode,
    [InitializedResource<any>['state'], number | undefined, Accessor<number | undefined> | undefined],
    TaskGroupsPerMode
  >(
    () => {
      const getMode = createModeGetter?.();

      return [viewModes.state, getMode?.(), getMode];
    },
    async ([state, selectedModeIndex, getModeIndex], info) => {
      const _initial = info.value ?? getInitial();
      const cache = (_initial.some(arr => arr.length > 0) ? _initial : await getPromise()) ?? _initial;

      if (state !== 'ready') {
        return cache;
      }

      const modes = project().type === ProjectType.Private
        ? [viewModes.latest[0]]
        : viewModes.latest;

      // refetch all if it's impossible to get selected mode
      if (typeof getModeIndex !== 'function') {
        return await Promise.all(modes.map(fetchAndGroupTasks)).then(setInitial);
      }

      // if a selector is avaiable
      return await Promise.all(
        modes.map((viewMode, modeIndex) => {
          // refetch only selected mode
          if (modeIndex === selectedModeIndex) {
            return fetchAndGroupTasks(viewMode);
          }

          // otherwise, get from cache
          const groups = cache[modeIndex] ?? [];
          return Promise.resolve(groups);
        }),
      )
      .then<TaskGroupsPerMode>(setInitial)
      .catch(() => cache);
    },
    { initialValue: getInitial() },
  );

  function fetchAndGroupTasks(mode: ClientItemViewMode | undefined): Promise<TaskGroup[]> {
    return fetchTasks(project().id, mode?.id, undefined, filter)
      .then(r => r.data ?? [])
      .then(pipe(
        groupBy<ClientTask>((x) => x.groupBy?.trim() === '' ? '' : ((x.groupBy ?? '') + '\n')),
        x => Object.entries(x),
      ));
  }

  return resource;
}
