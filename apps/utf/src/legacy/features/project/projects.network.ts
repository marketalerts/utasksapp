import { map } from 'rambda';

import { convertResponse, fetchUtasks } from 'shared/network';

import { toClientItem } from 'f/group/project.adapter';

export const fetchProjects = () => (
  fetchUtasks
    .get('/api/projects', {})
    .then(convertResponse(map(toClientItem)))
);

export const sendGroupInvite = (projectId?: string) => (
  fetchUtasks
    .post('/api/projects/public', { params: { query: { projectId } } })
);
