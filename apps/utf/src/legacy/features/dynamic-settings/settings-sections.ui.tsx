import { For, Show, createMemo, useContext } from 'solid-js';
import type { InitializedResource } from 'solid-js';

import { getTimezone } from 'f/settings/timezone';
import { ProfileContext } from 'f/profile/profile.context';

import { DynamicSettingCollection, getSettingsTree } from './settings-sections';
import type { StructureTemplate } from './settings-sections';
import { SupportedSettings, caseOf, isSettingDisabled, isSupported, switchPerType } from './adapter';
import type { ClientDynamicSetting, DynamicSetting, SettingOf } from './adapter';

import { t } from 'locales/dynamic-settings';

import ProBadge from 'shared/ui/pro-badge';
import { Loader } from 'shared/ui/loader.ui';
import List from 'shared/ui/list';

import { getTimezoneName } from 'f/settings/timezone.ui';

import SingleSetting, { constructToggleId } from './single-setting.ui';

export default function SettingsSections(props: {
  settingsResource: InitializedResource<ClientDynamicSetting[]>;
  filterPages: string[];
  settingsStructure: StructureTemplate;
  onInlineSet?: (id: string, value: SettingOf<SupportedSettings> | null) => void;
}) {
  const settingsSections = createMemo(() => [
    ...getSettingsTree(
      props.settingsStructure,
      props.settingsResource.latest,
      props.filterPages,
    ),
  ]);

  const offsetFilter = createMemo(() => props.filterPages.length > 1 ? '../' : '');

  const [profile] = useContext(ProfileContext);

  return <>
    <main class="=dynamic-settings-sections p-4 flex flex-col gap-4">
      <For each={settingsSections()}>
        {({ section, settings }) => <Show when={settings.length > 0}>
          <div class="=dynamic-setting-section flex flex-col gap-2" classList={{ 'opacity-80': props.settingsResource.loading }}>
            <Show when={section}>
              <p class="=dynamic-setting-section-title app-text-footnote! uppercase c-tg_hint m-0">
                {t('setting section', { key: section, fallback: section })}
              </p>
            </Show>
            <List each={settings} class="= overflow-hidden">
              {(setting) => <Show when={!setting.isInline || !props.onInlineSet}
                fallback={
                  <SingleSetting inline
                    settings={props.settingsResource}
                    settingId={setting.id}
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    onSet={value => props.onInlineSet!(setting.id, value)}
                  />
                }
              >
                <List.Item class="dynamic-setting-link"
                  data-id={setting.href}
                  disabled={isDisabled(setting)}
                  href={offsetFilter() + setting.href}
                  children={
                    <Show when={DynamicSettingCollection.filterInstance(setting)}
                      fallback={
                        <List.Text
                          titleProps={{
                            id: 'setting-' + setting.id,
                            classList: { 'c-tg_hint': isDisabled(setting) },
                          }}
                          title={t('setting id', { key: setting.id, fallback: setting.id })}
                          subtitle={t('setting id-description', { key: setting.id, fallback: '' })}
                        />
                      }
                    >
                      {setting =>
                        <List.Text
                          titleProps={{
                            id: setting().id + '-title',
                            classList: { 'c-tg_hint': isDisabled(setting()) },
                          }}
                          title={t('setting section', { key: setting().label, fallback: setting().label })}
                          subtitle={t('setting section-description', { key: setting().label, fallback: '' })}
                        />
                      }
                    </Show>
                  }
                  right={setting.isPro && isDisabled(setting) ? <ProBadge class="= ltr:pr-2 rtl:pl-2" /> : undefined}
                  rightHint={
                    <Show when={!props.settingsResource.loading}
                      fallback={
                        <Loader />
                      }
                    >
                      <Show when={(!setting.isAvailable || isSupported(() => setting)) && !(isDisabled(setting) && setting.isPro)}>
                        <span id={setting.id + '-value'} class="=dynamic-setting-value ellipsis overflow-hidden" // app-text-subheadline
                          classList={{ 'ltr:pr-2 rtl:pl-2': isDisabled(setting) && !setting.isPro }}
                        >
                          {toString(() => setting)}
                        </span>
                      </Show>
                    </Show>
                  }
                />
              </Show>}
            </List>
          </div>
        </Show>}
      </For>
    </main>
  </>;

  function isDisabled(setting: DynamicSetting): boolean {
    return isSettingDisabled(setting, profile.latest);
  }

  function toString(setting: () => DynamicSetting) {
    return switchPerType(setting, [
      caseOf(SupportedSettings.Events, SupportedSettings.Multitoggle)(
        setting => t('setting value-boolean', String(Object.values(setting.finalValue).some(v => v))),
      ),
      caseOf(SupportedSettings.Language)(
        setting => new Intl.DisplayNames(setting.finalValue, { type: 'language' }).of(setting.finalValue)?.replace(/^(.)/, v => v.toUpperCase()),
      ),
      caseOf(SupportedSettings.Timezone)(
        setting => getTimezoneName(getTimezone(setting.finalValue.timeZone, setting.finalValue.timeZoneId)).name,
      ),
      caseOf(SupportedSettings.TaskVisibility)(
        setting => t('setting value-task-visibility', String(setting.finalValue)),
      ),
      caseOf(SupportedSettings.Options)(
        setting => t('setting toggle-text', setting.finalValue),
      ),
      caseOf(SupportedSettings.Toggle)(
        setting => t('setting toggle-text', constructToggleId(setting.id, setting.finalValue)),
      ),
    ])?.();
  }
}
