import type { JSX, Signal } from 'solid-js';

import type { TaskStatus, TaskPriority } from 'shared/network/schema';

import List from 'shared/ui/list';
import Popup from 'shared/ui/floater';

import Status from '#/task-editor/ui/status';
import Priority from '#/task-editor/ui/priority';

import More from 'icons/24/More Horizontal Outlined.svg';

export default function StatusBar(props: {
	status: Signal<TaskStatus>;
	priority: Signal<TaskPriority>;
  contextMenu?: JSX.Element;
}) {
  return <>
    <div
      class="flex items-center justify-between p-1 ltr:pl-4 rtl:pr-4"
    >
      <div class="flex-grow">
        <Status model={props.status} />
      </div>
      <div class="flex items-center gap-1">
        <Priority model={props.priority} />

        <Popup placement="top-end"
          enterClass="animate-init-fade-in-right"
          exitClass="animate-init-fade-out-right"
        >{{
          opener: (attrs, open) => (
            <button data-id="task-editor-context-menu"
              class="ui-button-tertiary p-1.5"
              onClick={open}
              disabled={!props.contextMenu}
              {...attrs}
            >
              <More class="ui-icon-tertiary" />
            </button>
          ),

          floater: (attrs) => (
            <div class="bg-section rounded-3 min-w-40 shadow-2xl z-1001" {...attrs}>
              <List refactor>
                {props.contextMenu}
              </List>
            </div>
          ),
        }}</Popup>
      </div>
    </div>
  </>;
}