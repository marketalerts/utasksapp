import { createMemo, useContext } from 'solid-js';
import { useParams } from '@solidjs/router';

import { createDynamicProfileSettingsResource, DynamicSettingsContext } from 'f/dynamic-settings/profile-settings/context';
import type { SettingOf, SupportedSettings } from 'f/dynamic-settings/adapter';

import SingleSetting from 'f/dynamic-settings/single-setting.ui';

export default function SettingPage() {
  const params = useParams();
  const getSettingId = createMemo(() => decodeURIComponent(params.settingId));
  const settings = useContext(DynamicSettingsContext) ?? createDynamicProfileSettingsResource();

  return <main class="= p-4 flex flex-col gap-4">
    <DynamicSettingsContext.Provider value={settings}>
      <SingleSetting settings={settings[0]}
        settingId={getSettingId()}
        onSet={value => rememberChanges(getSettingId(), value)}
      />
    </DynamicSettingsContext.Provider>
  </main>;

  function rememberChanges(id: string, value: SettingOf<SupportedSettings>) {
    const matchingSetting = settings[0].latest.find(s => s.id === id);

    if (!matchingSetting) {
      return;
    }

    matchingSetting.value = value;

    settings[1].refetch([[matchingSetting]]);
  }
}
