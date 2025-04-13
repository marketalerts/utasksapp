import { postTask } from 'f/task/task.network';

import TaskEditor from 'f/task/editor.ui';

export default function CreateTask() {
  return <>
    <TaskEditor setTask={(task, projectId) => {
      return postTask(task, projectId)
        .then(task => { return [() => {/*  */}, task] as const; })
        .catch(() => { return [() => {/*  */}, undefined] as const; });
    }} />
  </>;
}
