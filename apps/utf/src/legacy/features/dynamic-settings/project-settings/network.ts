
import { dedupe, fetchUtasks } from 'shared/network';

import { ClientDynamicSetting } from 'f/dynamic-settings/adapter';

let latestSettings: ClientDynamicSetting[] = [];

export const fetchDynamicProjectSettings = dedupe((signal, projectId: string) => (
  fetchUtasks
    .get('/api/projects/{id}/settings', {
      params: { path: { id: projectId } },
      signal,
    })
    .then(r => latestSettings = r.data?.params?.map(s => new ClientDynamicSetting(s)) ?? [])
    .catch(() => latestSettings)
));

export const updateDynamicProjectSettings = dedupe((signal, projectId: string, settings: ClientDynamicSetting[]) => (
  fetchUtasks
    .put('/api/projects/{id}/settings', {
      params: { path: { id: projectId } },
      body: { params: settings.map(s => ClientDynamicSetting.revert(s)) },
      signal,
    })
    .then(r => latestSettings = r.data?.params?.map(s => new ClientDynamicSetting(s)) ?? [])
    .catch(() => latestSettings)
));
