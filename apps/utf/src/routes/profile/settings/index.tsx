import { createMemo, useContext } from 'solid-js';
import { useParams } from '@solidjs/router';

import type { StructureTemplate } from 'f/dynamic-settings/settings-sections';
import { createDynamicProfileSettingsResource, DynamicSettingsContext } from 'f/dynamic-settings/profile-settings/context';
import { clientSettings } from 'f/dynamic-settings/profile-settings/client-only';
import type { SettingOf, SupportedSettings } from 'f/dynamic-settings/adapter';

import SettingsSections from 'f/dynamic-settings/settings-sections.ui';

const projectSettingsStructure = [
  {
    section: 'app',
    links: [
      'USER_LANGUAGE',
      'USER_TIMEZONE',
      ...clientSettings,
    ],
  },
  {
    section: 'inbox',
    links: [
      'USER_EVENTS',
    ],
  },
] satisfies StructureTemplate;

export default function ProfileSettings() {
  const params = useParams<{ pages?: string; }>();
  const pages = createMemo(() => ['pages'].concat(params.pages?.split('/') ?? []));
  const settings = useContext(DynamicSettingsContext) ?? createDynamicProfileSettingsResource();

  return <>
    <SettingsSections onInlineSet={rememberChanges}
      settingsResource={settings[0]}
      filterPages={pages()}
      settingsStructure={projectSettingsStructure}
    />
  </>;

  function rememberChanges(id: string, value: SettingOf<SupportedSettings>) {
    const matchingSetting = settings[0].latest.find(s => s.id === id);

    if (!matchingSetting) {
      return;
    }

    matchingSetting.value = value;

    settings[1].refetch([[matchingSetting]]);
  }
}
