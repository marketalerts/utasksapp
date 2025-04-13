import type { Resource } from 'solid-js';

import type { FullClientTask } from 'f/task/task.adapter';

import TaskHistory from '../history/ui';

import TaskEditorForm from './form';

export default function TaskEditor(props: {
  task?: Resource<FullClientTask>;
}) {
  return <>
    <section data-id="task-editor">
      <TaskEditorForm>
        <TaskHistory />
      </TaskEditorForm>
    </section>
  </>;
}