import { createResource, useContext } from 'solid-js';
import { Navigate } from '@solidjs/router';

import { fetchTask, updateTask } from 'f/task/task.network';
import { getTaskDataFromHref } from 'f/task/task.adapter';
import { FullClientTask } from 'f/task/task.adapter';
import { UsersContext } from 'f/project/users.context';
import { getProjectDataFromHref } from 'f/project/project.context';
import { ErrorType } from 'f/errors/types';

import TaskEditor from 'f/task/editor.ui';

export default function TaskPage() {
  const { id } = getTaskDataFromHref();
  const projectId = getProjectDataFromHref()().id;

  if (!id) {
    return <Navigate href="/4/0/4"/>;
  }

  const users = useContext(UsersContext);

  const [task, { refetch, mutate }] = createResource(() => (
    fetchTask(id)
      .then(r => {
        if (!r.data) {
          throw { status: r.response.status, ...r.error };
        }

        return r.data;
      })
      .catch(e => {
        if (e.status) {
          throw { type: ErrorType.HTTP, code: e.status, task: id, project: projectId };
        }

        console.log(e);

        throw e;
      })
  ));

  const setTask = async (_task: FullClientTask, local?: boolean): Promise<readonly [VoidFunction, FullClientTask | undefined]> => {
    if (local) {
      return [refetch, mutate(_task)];
    }

    const currentTask = task.latest;

    if (!currentTask) {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return [() => {}, undefined] as const;
    }

    const newTask = FullClientTask.fromRaw({
      ...currentTask,
      ..._task,
      planDate: _task.planDate ?? null,
      dueDate: _task.dueDate ?? null,
    });

    const resultingTask = await updateTask(newTask).catch(() => undefined);

    return [refetch, resultingTask] as const;
  };

  return <>
    <UsersContext.Provider value={users}>
      {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
      <TaskEditor task={task()!} setTask={setTask} />
    </UsersContext.Provider>
  </>;
}
