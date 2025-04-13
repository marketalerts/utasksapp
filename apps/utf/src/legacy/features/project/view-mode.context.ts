import { persistResource } from 'solid-utils/persist-resource';
import { get } from 'solid-utils/access';
import { createContext, createEffect, createResource, createRoot, createSignal, on } from 'solid-js';
import type { Accessor, InitializedResource, InitializedResourceReturn, Signal } from 'solid-js';

import { createTaskListResource } from 'f/task/list.context';
import { FilterType } from 'f/task/list.adapter';

import { fetchViewModes } from './view-mode.network';
import { defaultViewModes } from './view-mode.adapter';
import type { ClientItemViewMode } from './view-mode.adapter';
import { defaultProject } from './project.context';
import { ProjectType } from './project.adapter';
import type { ClientItem } from './project.adapter';

type NullableModes = Array<ClientItemViewMode | undefined>;

export const ViewModesContext = createContext<InitializedResourceReturn<NullableModes>>();
export const SelectedModeContext = createContext<Signal<number>>(createRoot(() => createSignal(0)));

export const persistViewModes = (
  projectId: () => string,
  filter: FilterType = FilterType.NotCompleted,
) => persistResource<NullableModes>({
  key: () => `${projectId()}-modes-${filter}`,
  defaultValue: defaultViewModes(),
});

type ModesResource = InitializedResource<NullableModes>;

export function getTasksForMode(selectedMode: Signal<number>, options: {
  project: Accessor<ClientItem>;
  filter?: FilterType | null;
  preload?: boolean;
  processViewModes?: (
    modes: ModesResource
  ) => { latest: NullableModes, state: ModesResource['state'] }
}) {
  const {
    project,
    filter = FilterType.NotCompleted,
  } = options;

  if (filter === null) {
    const [viewModes] = createResource(
      () => Promise.resolve([] as ClientItemViewMode[]),
      { initialValue: defaultViewModes(project().count) },
    );

    const tasks = createTaskListResource(project, viewModes);

    return [
      tasks,
      viewModes,
      {
        refetch: () => {/* no body */},
        dirtyModes: {} as Record<number, boolean>,
        isModeOpen: {} as Record<number, Signal<boolean>>,
      },
    ] as const;
  }

  const [getInitial, setInitial] = persistViewModes(() => project().id, filter);

  const isSpecialProject = ['g_compl', defaultProject.id].includes(project().id);

  const [viewModes, { refetch }] = createResource(
    () => (
      (['g_compl'].includes(project().id) && filter === FilterType.NotCompleted)
      || (!isSpecialProject && project().type === ProjectType.Dynamic && filter === FilterType.Completed)
      || (project().type === ProjectType.Private && filter === FilterType.NotCompleted && project().id !== defaultProject.id)
    )
        ? Promise.resolve([undefined] as (ClientItemViewMode | undefined)[])
        : fetchViewModes(project().id, filter)
            .then(r => setInitial(r.data))
            .catch(() => defaultViewModes(project().count)),
    { initialValue: getInitial() },
  );

  const isModeOpen: Record<number, Signal<boolean>> = {};
  // Non-reactive by-design - no need to refetch immediately when a tab gets dirty, only on reopen
  const dirtyModes: Record<number, boolean> = {};

  const tasks = createTaskListResource(
    project,
    options.processViewModes?.(viewModes) ?? viewModes,
    filter,
    () => !options.preload ? () => {
      const stateChanged = dirtyModes[get(selectedMode)];
      const isListOpen = get(isModeOpen[get(selectedMode)]);

      if (stateChanged && isListOpen) {
        dirtyModes[get(selectedMode)] = false;

        // Refetch specific view mode
        return get(selectedMode);
      }

      // Simply load from cache
      return undefined;
    } : undefined,
  );

  defaultViewModes(project().count).forEach((_, index) => {
    isModeOpen[index] ??= createSignal(false);
    if (options.preload) {
      dirtyModes[index] = false;
    }
  });

  createEffect(on(() => viewModes.state, (state) => {
    if (state === 'ready') {
      options.preload = false;
      return;
    }

    defaultViewModes(project().count).forEach((_, index) => {
      dirtyModes[index] = true;
    });
  }));

  return [
    tasks,
    viewModes,
    {
      refetch,
      dirtyModes,
      isModeOpen,
    },
  ] as const;
}
