import { For, Suspense } from 'solid-js';
import type { Accessor, JSX, Signal } from 'solid-js';

import type { ClientTask } from 'f/task/task.adapter';

import TaskRow from './list-row.ui';

export interface TaskListProps {
  tasks: ClientTask[];
  fallback?: JSX.Element;
  deletePendingId: Signal<string>;
  privateTaskList?: boolean;
  showTomorrowTime?: boolean;
  onTaskCompleted?: (task: ClientTask, index: number) => Promise<unknown>;
  onTaskDeleted?: (task: ClientTask, index: number) => void;
  showProject?: boolean;
  isUserAdmin: boolean;
}

export default function TaskList(props: TaskListProps) {
  const onTaskCompleted = (index: Accessor<number>) => (
    async (task: ClientTask) => {
      props.tasks.splice(props.tasks.indexOf(task), 1);
      return await props.onTaskCompleted?.(task, index());
    }
  );
  const onTaskDeleted = (index: Accessor<number>) => (
    (task: ClientTask): void | undefined => {
      props.tasks.splice(props.tasks.indexOf(task), 1);
      props.onTaskDeleted?.(task, index());
    }
  );

  return <ul class="=task-list reset-list [&>li]:box-content overflow-hidden rounded-2">
    <Suspense fallback={<></>}>
      <For each={props.tasks} fallback={<div class="= p-3">{props.fallback}</div>}>
        {(task, index) => <TaskRow deletePendingId={props.deletePendingId}
          task={task}
          onCompleted={onTaskCompleted(index)}
          onDeleted={onTaskDeleted(index)}
          privateTask={props.privateTaskList}
          showTomorrowTime={props.showTomorrowTime}
          showProject={props.showProject}
          isUserAdmin={props.isUserAdmin}
        />}
      </For>
    </Suspense>
  </ul>;
}
