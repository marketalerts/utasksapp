import WebApp from 'tma-dev-sdk';
import { set } from 'solid-utils/access';
import type { Signal } from 'solid-js';

import type { ClientItem } from 'f/project/project.adapter';
import { GroupsExplorerMode } from 'f/group/explorer-mode';

import { useDialog } from 'shared/ui/use-dialog';

import GroupsExplorer from 'f/group/explorer.ui';

export const useProjectSelectDialog = (project: Signal<ClientItem>) => {
  const [, setIsDialogOpen, bindDialogToSignal] = useDialog('modal');

  return [
    setIsDialogOpen,
    ProjectSelectDialog,
  ] as const;

  function ProjectSelectDialog() {
    return <>
      <dialog ref={bindDialogToSignal}
        class="=project-select-dialog fixed b-0 my-15 h-[70vh] bg-tg_bg rounded-2"
      >
        <GroupsExplorer
          selected={project}
          mode={GroupsExplorerMode.Options}
          onItemClick={(item) => {
            set(project, item);

            WebApp.HapticFeedback.selectionChanged();

            setIsDialogOpen(false);
          }} />
      </dialog>
    </>;
  }
};
