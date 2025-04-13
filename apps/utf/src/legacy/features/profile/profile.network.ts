import { to } from 'data-mapper/decorators/base';

import { convertResponse, fetchUtasks } from 'shared/network';

import { ClientProfile } from './profile.adapter';

export const fetchUserProfile = () => (
  fetchUtasks
    .get('/api/profile', {})
    .then(convertResponse(to(ClientProfile)))
    .catch(() => undefined)
);
