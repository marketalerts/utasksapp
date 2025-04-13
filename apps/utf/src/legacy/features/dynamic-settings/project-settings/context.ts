import { createResource } from 'solid-js';

import type { Schema } from 'shared/network';

import { ClientDynamicSetting } from 'f/dynamic-settings/adapter';

import { fetchDynamicProjectSettings, updateDynamicProjectSettings } from './network';

export * from '../context';

export function createDynamicProjectSettingsResource(projectId: () => string) {
  return createResource<ClientDynamicSetting[], Parameters<typeof updateDynamicProjectSettings>>(
    (_, info) => Array.isArray(info.refetching) ? updateDynamicProjectSettings(...info.refetching) : fetchDynamicProjectSettings(projectId()),
    { initialValue: defaultSettingsTemplate.params.map(s => new ClientDynamicSetting(s)) },
  );
}

const defaultSettingsTemplate = {
  params: [
      {
          code: 'PR_EVENTS',
          enabled: true,
      },
      {
          code: 'PR_REMINDERS',
          enabled: false,
      },
      {
          code: 'PR_USER_TASKS_USERSONLY',
          enabled: false,
      },
      {
          code: 'PR_USER_TASKS_USERSONLY',
          enabled: false,
      },
      {
          code: 'PR_TIMEZONE',
          enabled: false,
      },
      {
          code: 'PR_LANGUAGE',
          enabled: false,
      },
      {
          code: 'PR_USER_EVENTS',
          enabled: false,
      },
      {
          code: 'USER_EVENTS',
          enabled: false,
      },
  ] as Schema.SettingsParamModel[],
};
