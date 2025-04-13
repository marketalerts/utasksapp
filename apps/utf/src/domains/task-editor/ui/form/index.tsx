import { Show } from 'solid-js';
import type { ParentProps } from 'solid-js';

import { isIOS } from 'shared/platform';

import { defaultProject } from 'f/project/project.context';

import TopCard from './top-card';
import TaskHeader from './task-header';

import { useElementWaterfall, waterfall } from 'ui/composables/use-waterfall';

import Files from '#/task-editor/files/ui';

export default function TaskEditorForm(props: ParentProps) {
  useElementWaterfall('animate-init-fade-in-200', waterfall);

  return <div role="form" class="flex flex-col min-h-100vh">
    <TaskHeader
      projectName={defaultProject.name}
    />

    <div class="p-4 pt-2 flex flex-col gap-4">
      <TopCard />

      <Files />

      {props.children}
    </div>

    <Show when={isIOS()}>
      <div class="flex-grow min-h-20vh" />
    </Show>
  </div>;
}