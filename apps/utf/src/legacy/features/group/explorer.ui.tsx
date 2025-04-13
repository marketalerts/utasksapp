import { Suspense, mergeProps, useContext } from 'solid-js';
import type { ParentProps, Signal, VoidProps } from 'solid-js';

import { defaultProject } from 'f/project/project.context';
import type { ClientItem } from 'f/project/project.adapter';
import { ProfileContext } from 'f/profile/profile.context';
import { getHomeGroupsFilter } from 'f/dynamic-settings/profile-settings/client-only/home-filter';

import { GroupTreeContext, createGroupTreeResource, createLocalGroupTreeResource } from './list.context';
import { SelectedProject } from './explorer.context';
import { GroupsExplorerMode } from './explorer-mode';
import type { ModeOptions } from './explorer-mode';

import List from './explorer-list.ui';
import Areas from './explorer-accordeon.ui';

const defaultProps: GroupsExplorerProps = {
  mode: GroupsExplorerMode.Links,
  onItemClick: (item: ClientItem) => { return; },
};

export type GroupsExplorerProps = VoidProps & Partial<ModeOptions> & {
  selected?: Signal<ClientItem>;
  onReorderProject?: (id: string, index: number, areaId?: string) => void;
  onReorderArea?: (id: string, index: number) => void;
};

export default function GroupsExplorer(_props: ParentProps<GroupsExplorerProps>) {
  const props = mergeProps(defaultProps as Required<GroupsExplorerProps>, _props);
  const [profile] = useContext(ProfileContext);

  const [groups] = useContext(GroupTreeContext) ?? (
    console.warn('[Group Explorer]: redundant resource creation'),
    props.mode === GroupsExplorerMode.Links
      ? createGroupTreeResource()
      : createLocalGroupTreeResource()
  );

  const taskGroups = () => {
    const taskGroupsList = groups?.latest?.taskGroups ?? [];

    if (taskGroupsList.length > 1 && GroupsExplorerMode.Options === props.mode) {
      return taskGroupsList.filter(x => x.id === defaultProject.id);
    }

    if (profile.latest.isPro || profile.loading) {
      const homeFilter = getHomeGroupsFilter();
      return taskGroupsList.filter(x => homeFilter[x.id] || x.id === defaultProject.id);
    }

    return taskGroupsList;
  };

  const areas = () => groups?.latest?.areas ?? [];
  const projects = () => groups?.latest?.projects ?? [];

  return <Suspense fallback={<span>Loading...</span>}>
    <SelectedProject.Provider value={props.selected?.[0]}>
      <List areaId="dynamic" each={taskGroups()}
        mode={props.mode}
        onItemClick={props.onItemClick}
        // onReorder={props.onReorderProject}
      />

      {props.children}

      <Areas each={areas()}
        mode={props.mode}
        onItemClick={props.onItemClick}
        onReorderProject={props.onReorderProject}
        onReorderArea={props.onReorderArea}
      />

      <List areaId="static" each={projects()}
        mode={props.mode}
        onItemClick={props.onItemClick}
        onReorder={props.onReorderProject}
        sparse
      />

    </SelectedProject.Provider>
  </Suspense>;
}

export { GroupsExplorerMode };
