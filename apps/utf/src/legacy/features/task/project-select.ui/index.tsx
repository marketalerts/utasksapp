
import type { HistorySignal } from 'solid-utils/history';
import { get } from 'solid-utils/access';
import { Show, children } from 'solid-js';
import type { JSX, Accessor } from 'solid-js';

import { isGroup } from 'f/project/project.adapter';
import type { ClientItem } from 'f/project/project.adapter';

import { t as tGroup } from 'locales/group';

import { useProjectSelectDialog } from './dialog.ui';
import ProjectSelectButton from './button.ui';


export function ProjectSelect(props: {
  project: HistorySignal<ClientItem>;
  highlight?: boolean;
  disabled?: boolean;
  icon?: JSX.Element;
  neutralText?: boolean;
  children?: (onClick: VoidFunction, isSelected: Accessor<boolean>, text: string) => JSX.Element;
}) {
  const [setIsDialogOpen, ProjectSelectDialog] = useProjectSelectDialog(props.project);

  const resolvedChildren = children(() => props.children?.(
    () => setIsDialogOpen(true),
    () => props.project.canUndo() || !!props.highlight,
    getProjectName(),
  ));

  return <>
    <Show when={!props.children} fallback={resolvedChildren()}>
      <ProjectSelectButton icon={props.icon} neutralText={props.neutralText && props.project.canUndo()}
        onClick={() => props.disabled || setIsDialogOpen(true)}
        isSelected={() => props.project.canUndo() || !!props.highlight}
        disabled={props.disabled}
      >
        {getProjectName()}
      </ProjectSelectButton>
    </Show>

    <ProjectSelectDialog />
  </>;

  function getProjectName() {
    return isGroup(get(props.project))
      ? tGroup('group-name', { key: get(props.project)?.id, fallback: get(props.project)?.name })
      : get(props.project).name;
  }
}
