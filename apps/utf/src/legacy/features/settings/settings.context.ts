import { createContext, createResource, createRoot } from 'solid-js';

import { createDynamicProfileSettingsResource } from 'f/dynamic-settings/profile-settings/context';
import type { ClientDynamicSettings } from 'f/dynamic-settings/profile-settings/context';
import { getSettingOfType, SupportedSettings } from 'f/dynamic-settings/adapter';

import { createClientTimeZone, EssentialSettings } from './settings.adapter';

export const SettingsContext = createContext(createRoot(() => {
  const [resource] = createDynamicProfileSettingsResource();

  return createResource(
    () => [resource()] as const,
    ([settings]) => {
      return getEssentials(settings);
    },
    { initialValue: getEssentials(resource.latest) },
  );
}));

export function getEssentials(settings: ClientDynamicSettings) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const locale = getSettingOfType(SupportedSettings.Language, settings)!;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const timezone = getSettingOfType(SupportedSettings.Timezone, settings)!;

  return new EssentialSettings(
    new Intl.Locale(locale.finalValue),
    createClientTimeZone(timezone.finalValue),
  );
}
