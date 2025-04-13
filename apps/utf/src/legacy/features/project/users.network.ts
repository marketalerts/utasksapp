import { map } from 'rambda';
import { to } from 'data-mapper';

import { fetchUtasks, convertResponse } from 'shared/network';

import { ClientUser } from './users.adapter';

export const listUsers = (projectId: string) => (
  fetchUtasks.get('/api/projects/{id}/users', {
    params: { path: { id: projectId } },
  }).then(convertResponse(map(to(ClientUser))))
);

export const requestUsersUpdate = (projectId: string) => (
  fetchUtasks.post('/api/projects/updateusers', { params: { query: { projectId } } })
);