import { createRenderEffect, createResource, createRoot } from 'solid-js';
import type { InitializedResourceReturn } from 'solid-js';
import { original } from 'data-mapper/decorators/base';

import type { Schema } from 'shared/network';
import { currentLocale, setCurrentLocale } from 'shared/l10n';

import { getCurrentTimezoneId, getCurrentTimezoneOffset, getLocalTimezoneId, getLocalTimezoneOffset, getTimezone, getTimezoneOffset, setCurrentTimezone } from 'f/settings/timezone';
import { createClientTimeZone } from 'f/settings/settings.adapter';
import { ClientDynamicSetting, createRawSetting, getSettingOfType, SupportedSettings } from 'f/dynamic-settings/adapter';
import type { DynamicSetting, SettingOf } from 'f/dynamic-settings/adapter';

import { fetchDynamicProfileSettings, updateDynamicProfileSettings } from './network';
import { clientOnlySettingIds, clientOnlySettings } from './client-only';

export * from '../context';

// Profile settings resource only really needs to be created once,
// But due to DI limitations, we have to use the factory multiple times and cache the outcome
let profileSettingsResource: InitializedResourceReturn<ClientDynamicSettings, Parameters<typeof updateDynamicProfileSettings>>;

export function createDynamicProfileSettingsResource() {
  return profileSettingsResource ??= createRoot(() => {
    const resource = createResource<ClientDynamicSettings, Parameters<typeof updateDynamicProfileSettings>>(
      async (_, info) => {
        if (Array.isArray(info.refetching) && info.refetching[0].every(s => clientOnlySettingIds.includes(s.id))) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          return info.value!;
        }

        const updatedSettings = await (
          Array.isArray(info.refetching)
          ? updateDynamicProfileSettings(...info.refetching)
          : fetchDynamicProfileSettings()
        );

        return updatedSettings.concat(clientOnlySettings);
      },
      { initialValue: getInitialSettings() },
    );

    createRenderEffect(() => {
      saveSettings(resource[0].latest, resource[0].state === 'ready');
    });

    return resource;
  });
}

export type ClientDynamicSettings = ClientDynamicSetting[];

const serializeSettings = (s: ClientDynamicSettings): string => {
  return JSON.stringify(s.map(s => ClientDynamicSetting.revert(s)));
};

const deserializeSettings = (s: string | null): ClientDynamicSettings => {
  const deserialized = JSON.parse(s || 'null');

  if (
    !deserialized
    || !Array.isArray(deserialized)
  ) {
    return defaultMappedSettings();
  }

  return deserialized.map(s => new ClientDynamicSetting(s));
};

const saveSettings = (r: ClientDynamicSettings, trulyServerData?: boolean) => {
  localStorage.removeItem('settings'); // Deprecated key
  localStorage.setItem('dynamic-settings', serializeSettings(r));

  const locale = getSettingOfType(SupportedSettings.Language, r);
  const timezone = getSettingOfType(SupportedSettings.Timezone, r);

  if (locale) {
    setCurrentLocale(locale.finalValue);
  }

  if (timezone) {
    const newTZ = createClientTimeZone(validateTimeZone(timezone.finalValue));

    setCurrentTimezone(newTZ);

    if (trulyServerData && timezone.finalValue.timeZoneId === newTZ.id && timezone.finalValue.timeZone !== newTZ.offset) {
      updateDynamicProfileSettings([new ClientDynamicSetting<SupportedSettings.Timezone>({
        ...timezone[original],
        value: {
          timeZone: newTZ.offset,
          timeZoneId: newTZ.id,
        },
      })]);
    }
  }

  return r;
};

function validateTimeZone(value: SettingOf<SupportedSettings.Timezone>): SettingOf<SupportedSettings.Timezone> {
  const idOffset = getTimezoneOffset(value.timeZoneId);

  if (value.timeZoneId && value.timeZone !== idOffset) {
    const updatedTZ = getTimezone(getLocalTimezoneOffset(), value.timeZoneId);
    return {
      timeZone: updatedTZ.offset,
      timeZoneId: updatedTZ.id,
    };
  }

  return value;
}

const getInitialSettings = () => deserializeSettings(localStorage.getItem('dynamic-settings'));

const defaultSettingsTemplate = () => [
    {
        code: 'USER_EVENTS',
        enabled: false,
    },
    createRawSetting(SupportedSettings.Timezone, {
      code: 'USER_TIMEZONE',
      enabled: false,
      defaultValue: {
        timeZone: getLocalTimezoneOffset(),
        timeZoneId: getLocalTimezoneId(),
      },
      value: {
        timeZone: getCurrentTimezoneOffset(),
        timeZoneId: getCurrentTimezoneId(),
      },
    }),
    createRawSetting(SupportedSettings.Language, {
      code: 'USER_LANGUAGE',
      enabled: false,
      defaultValue: 'en',
      value: currentLocale().baseName,
    }),
] as Schema.SettingsParamModel[];

const defaultMappedSettings = () => defaultSettingsTemplate().map(s => new ClientDynamicSetting(s));