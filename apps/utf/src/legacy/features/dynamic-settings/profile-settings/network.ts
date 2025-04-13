
import { dedupe, fetchUtasks } from 'shared/network';

import { ClientDynamicSetting } from 'f/dynamic-settings/adapter';

let latestSettings: ClientDynamicSetting[] = [];

export const fetchDynamicProfileSettings = dedupe((signal) => (
  fetchUtasks
    .get('/api/profile/settings', { signal })
    .then(r => latestSettings = r.data?.params?.map(s => new ClientDynamicSetting(s)) ?? [])
    .catch(() => latestSettings)
));

export const updateDynamicProfileSettings = dedupe((signal, settings: ClientDynamicSetting[]) => (
  fetchUtasks
    .put('/api/profile/settings', {
      body: { params: settings.map(s => ClientDynamicSetting.revert(s)) },
      signal,
    })
    .then(r => latestSettings = r.data?.params?.map(s => new ClientDynamicSetting(s)) ?? [])
    .catch(() => latestSettings)
));
