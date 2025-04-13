import { revert } from 'data-mapper';

import { convertResponse, fetchUtasks } from 'shared/network';

import { toFullClientTask } from './task.adapter';
import type { BaseClientTask, FullClientTask } from './task.adapter';

export const fetchTask = (id: string) => (
  fetchUtasks.get('/api/tasks/{id}', { params: { path: { id } } })
    .then(convertResponse(toFullClientTask))
);

export const updateTask = (task: FullClientTask) => (
  fetchUtasks.put('/api/tasks/{id}', {
    params: { path: { id: task.id } },
    body: revert(task),
  })
  .then(convertResponse(toFullClientTask))
  .then(r => r.data)
);

export const postTask = (
  task: BaseClientTask,
  projectId?: string,
) => fetchUtasks.post('/api/tasks', {
  params: {
    query: {
      projectid: projectId,
    },
  },
  body: revert(task),
})
.then(convertResponse(toFullClientTask))
.then(r => r.data);

export const completeTask = (id: string) => (
  fetchUtasks.post('/api/tasks/{id}/complete', { params: { path: { id } } })
    .then(convertResponse(toFullClientTask))
);

export const uncompleteTask = (id: string) => (
  fetchUtasks.post('/api/tasks/{id}/uncomplete', { params: { path: { id } } })
    .then(convertResponse(toFullClientTask))
);

export const deleteTask = (id: string) => (
  fetchUtasks.delete('/api/tasks/{id}', { params: { path: { id } } })
);

export const postToChat = (id: string) => (
  fetchUtasks.post('/api/tasks/{id}/publish', { params: { path: { id } } })
    .then(r => r.data)
    .catch(() => undefined)
);

// Attaches an assignee to an inline task
export const attachAssignee = (id: string) => (
  fetchUtasks.post('/api/tasks/{id}/attachassignee', { params: { path: { id } } })
);