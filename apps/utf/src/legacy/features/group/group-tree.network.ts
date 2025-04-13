import { fetchUtasks, convertResponse } from 'shared/network';

import { toClientGroupTree } from './group-tree.adapter';

export const fetchGroupTree = () => (
  fetchUtasks
    .get('/api/projects/groups', {})
    .then(convertResponse(toClientGroupTree))
);
