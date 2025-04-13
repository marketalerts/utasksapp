import WebApp from 'tma-dev-sdk';
import { createHistorySignal } from 'solid-utils/history';
import { get, set } from 'solid-utils/access';
import { Match, Show, Switch, createMemo, createRenderEffect, createSignal, on, useContext } from 'solid-js';
import type { InitializedResource } from 'solid-js';
import { map } from 'rambda';

import { getTimezone } from 'f/settings/timezone';
import { ProfileContext } from 'f/profile/profile.context';
import { isSettingDisabled, settingOfType, SupportedSettings } from 'f/dynamic-settings/adapter';
import type { ClientDynamicSetting, DynamicSetting, SettingOf } from 'f/dynamic-settings/adapter';

import { t } from './locales';

import ProBadge from 'shared/ui/pro-badge';
import { Loader } from 'shared/ui/loader.ui';
import List from 'shared/ui/list';

import TimeZonesList from 'f/settings/timezone.ui';
import LanguagesList from 'f/settings/language.ui';

import Checkmark from 'icons/Checkmark.svg';

export default function SingleSetting(props: {
  settings: InitializedResource<ClientDynamicSetting[]>;
  settingId: string | ClientDynamicSetting;
  onSet: (value: SettingOf<SupportedSettings> | null) => unknown;
  allowClientDefaults?: boolean;
  inline?: boolean;
}) {
  const [profile] = useContext(ProfileContext);
  const setting = createMemo(() => typeof props.settingId === 'string'
    ? props.settings.latest.find(s => s.id === props.settingId)
    : props.settingId,
  );
  const [initialValue, setInitial] = createSignal(setting()?.value);

  createRenderEffect(() => {
    if (typeof setting()?.default !== 'undefined' && initialValue() === null) {
      setInitial(setting()?.value);
    }
  });

  return <>
    <div class="=dynamic-setting-controls flex flex-col gap-2"
      classList={{
        '= b-t-border-regular b-t-solid b-b-solid b-b-tg_bg': props.inline,
        '= pt-2 [&>:first-child]:mx-4': props.inline && !settingOfType(setting, SupportedSettings.Toggle),
      }}
    >
      <Switch>
        <Match when={settingOfType(setting, SupportedSettings.Events, SupportedSettings.Multitoggle)}>
          {setting => <MultitoggleSetting setting={setting()} />}
        </Match>
        <Match when={settingOfType(setting, SupportedSettings.Timezone)}>
          {setting => <TimezoneSetting setting={setting()} />}
        </Match>
        <Match when={settingOfType(setting, SupportedSettings.Language)}>
          {setting => <LanguageSetting setting={setting()} />}
        </Match>
        <Match when={settingOfType(setting, SupportedSettings.TaskVisibility, SupportedSettings.Toggle)}>
          {setting => <ToggleSetting setting={setting()} />}
        </Match>
        <Match when={settingOfType(setting, SupportedSettings.Options)}>
          {setting => <OptionsSetting setting={setting()} />}
        </Match>
      </Switch>
      <Show when={!props.inline}>
        <p class="=dynamic-setting-desc app-text-body-s c-tg_hint m-0">
          {t('setting id-description', { key: setting()?.id ?? '', fallback: '' })}
        </p>
      </Show>
    </div>
  </>;

  function LanguageSetting(props: {
    setting: DynamicSetting<SupportedSettings.Language>;
  }) {
    const [value, SettingHeader] = useSettingModel(props.setting);

    return <>
      <SettingHeader setting={props.setting}
        applyDefaults={() => set(value, null)}
        showDefaultsButton={get(value) !== null}
      />
      <div class="= overflow-hidden languages"
        classList={{
          '= [&_svg]:fill-tg_hint': get(value) === null,
        }}
      >
        <LanguagesList defaultLanguage={props.setting.default}
          selected={get(value)}
          onSelect={lang => set(value, lang)}
        />
      </div>
    </>;
  }

  function TimezoneSetting(_props: {
    setting: DynamicSetting<SupportedSettings.Timezone>;
  }) {
    const [value, SettingHeader] = useSettingModel(_props.setting);

    return <>
      <div class="= w-full h-10" />
      <SettingHeader setting={_props.setting}
        showDefaultsButton={get(value) !== null}
        applyDefaults={() => set(value, null)}
      />
      <div
        classList={{
          '= [&_svg]:fill-tg_hint': get(value) === null,
        }}
      >
        <TimeZonesList hideLocal={props.allowClientDefaults}
          getSelectedTimeZone={() => {
            const val = get(value) ?? _props.setting.default;

            return getTimezone(val.timeZone, val.timeZoneId);
          }}
          selectTimeZone={tz => () => set(value, {
            timeZone: tz.offset,
            timeZoneId: tz.id,
          })}
          wrapper={props => <>{props.children}</>}
        />
      </div>
    </>;
  }

  function ToggleSetting(_props: {
    setting: DynamicSetting<SupportedSettings.TaskVisibility | SupportedSettings.Toggle>;
  }) {
    const [value, SettingHeader] = useSettingModel(_props.setting);

    const options = [
      { id: constructToggleId(_props.setting.id, true), value: true },
      { id: constructToggleId(_props.setting.id, false), value: false },
    ];

    return <Show when={!props.inline}
      fallback={
        <List.Item semantic={false}
          onClick={isSettingDisabled(_props.setting, profile.latest) ? undefined : () => set(value, prev => !prev)}
          right={
            <Show when={!isSettingDisabled(_props.setting, profile.latest)}
              fallback={
                _props.setting.isPro ? <ProBadge class="= ltr:pr-2 rtl:pl-2" /> : undefined
              }
            >
              <OptionCheckmark gray={get(value) === null}
                isSelected={!!get(value)}
              />
            </Show>
          }
        >
          <List.Text
            title={t('setting id', _props.setting.id)}
            subtitle={t('setting id-description', { key: _props.setting.id, fallback: '' })}

            titleProps={{ classList: { 'c-tg_hint': isSettingDisabled(_props.setting, profile.latest) } }}
            subtitleProps={{ classList: { 'c-tg_hint': isSettingDisabled(_props.setting, profile.latest) } }}
          />
        </List.Item>
      }
    >
      <SettingHeader setting={_props.setting}
        showDefaultsButton={get(value) !== null}
        applyDefaults={applyDefaults}
      />
      <List each={options}>
        {(option) =>
          <List.Item onClick={() => set(value, option.value)}
            right={
              <OptionCheckmark gray={get(value) === null}
                isSelected={option.value === (get(value) ?? _props.setting.default)}
              />
            }
          >
            <List.Text
              title={t('setting toggle-text', option.id)}
              subtitle={t('setting toggle-text-description', option.id)}
            />
          </List.Item>
        }
      </List>
    </Show>;

    function applyDefaults() {
      set(value, null);
    }
  }

  function OptionsSetting(_props: {
    setting: DynamicSetting<SupportedSettings.Options>;
  }) {
    const [value, SettingHeader] = useSettingModel(_props.setting);

    const initial = () => initialValue() as SettingOf<SupportedSettings.Options> | null;

    const initialDiffersFromDefaults = (() => checkIfDiffersFromDefaults(initial()));
    const differsFromDefaults = createMemo(() => checkIfDiffersFromDefaults(get(value)));

    const finalValue = () => get(value) ?? _props.setting.default;
    const isDefaultOption = (key: string) => key === _props.setting.default;

    const setOption = (key: string) => () => {
      set(value, key);
    };

    return <>
      <SettingHeader setting={_props.setting}
        showDefaultsButton={differsFromDefaults() && initialDiffersFromDefaults()}
        applyDefaults={applyDefaults}
      />
      <List each={_props.setting.options}>
        {(key) =>
          <List.Item onClick={setOption(key)}
            right={<OptionCheckmark isSelected={finalValue() === key} gray={!differsFromDefaults()} />}
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            rightHint={setting()?.hint && isDefaultOption(key) ? t('setting toggle-text', { key: setting()!.hint!, fallback: '' }) : undefined}
          >
            <List.Text
              title={t('setting toggle-text', key)}
              subtitle={t('setting toggle-text-description', { key, fallback: '' })}
            />
          </List.Item>
        }
      </List>
    </>;

    function checkIfDiffersFromDefaults(value: SettingOf<SupportedSettings.Options> | null) {
      return value != null;
    }

    function applyDefaults() {
      set(value, null);
    }
  }

  function MultitoggleSetting(_props: {
    setting: DynamicSetting<SupportedSettings.Events | SupportedSettings.Multitoggle>;
  }) {
    const [value, SettingHeader] = useSettingModel(_props.setting);

    const initial = () => initialValue() as SettingOf<SupportedSettings.Events> | null;

    const initialDiffersFromDefaults = (() => checkIfDiffersFromDefaults(initial()));
    const differsFromDefaults = createMemo(() => checkIfDiffersFromDefaults(get(value)));

    const finalValue = () => get(value) ?? _props.setting.default;
    const shouldEnable = createMemo(() => Object.values(finalValue()).some(v => !v));
    const isDefaultOption = (key: string) => !!_props.setting.default[key];

    const setOption = (key: string) => () => {
      set(value, (old) => {
        return { ...(old ?? _props.setting.default), [key]: !finalValue()[key] };
      });
    };

    return <>
      <SettingHeader setting={_props.setting}
        showDefaultsButton={differsFromDefaults() && initialDiffersFromDefaults()}
        applyDefaults={applyDefaults}
      />
      <List each={Object.keys(_props.setting.default)}
        title={
          <div class="= flex items-center justify-between p-2 b-b-1 b-b-solid b-border-regular">
            <button onClick={toggleAll}
              class="=toggle-all-setting-items bg-transparent c-tg_button app-text-footnote"
            >
              {t('setting toggle-all', String(shouldEnable()))}
            </button>
            {/* TODO: rollback is claimed to be too complicated. Remove? */}
            {/* <Show when={initial() != null && checkIfDiffers(initial(), finalValue())}>
              <button onClick={reset}
                class="= bg-transparent c-tg_link app-text-footnote"
              >
                {t('setting rollback')}
              </button>
            </Show> */}
          </div>
        }
      >
        {(key) =>
          <List.Item onClick={setOption(key)}
            right={<OptionCheckmark isSelected={finalValue()[key]} gray={get(value) === null} />}
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            rightHint={setting()?.hint && isDefaultOption(key) ? t('setting toggle-text', { key: setting()!.hint!, fallback: '' }) : undefined}
          >
            <List.Text
              title={t('setting toggle-text', key)}
              subtitle={t('setting toggle-text-description', { key, fallback: '' })}
            />
          </List.Item>
        }
      </List>
    </>;

    function checkIfDiffersFromDefaults(value: SettingOf<SupportedSettings.Events> | null) {
      return value != null;
    }

    // function checkIfDiffers(value: SettingOf<SupportedSettings.Events> | null, from: typeof value) {
    //   return value != null && from != null
    //     ? value != from && zip(Object.values(value), Object.values(from)).some(([a, b]) => a != b)
    //     : value != from;
    // }

    function toggleAll() {
      set(value, map(shouldEnable, _props.setting.finalValue));
    }

    function applyDefaults() {
      set(value, null);
    }

    // function reset() {
    //   if (typeof initial() !== 'undefined') {
    //     value.reset(initial());
    //   }
    // }
  }

  function useSettingModel<T extends SupportedSettings>(setting: DynamicSetting<T>) {
    const value = createHistorySignal<SettingOf<T> | null>(setting.value);

    createRenderEffect(on(value[0], () => {
      WebApp.HapticFeedback.selectionChanged();
      props.onSet(get(value));
    }, { defer: true }));

    return [value, SettingHeader] as const;

    function SettingHeader(_props: { setting: DynamicSetting; showDefaultsButton?: boolean; applyDefaults?: VoidFunction }) {
      return <div class="= flex flex-col">
        <div class="= flex items-center justify-between">
          <p class="= m-0" classList={{ '= c-tg_hint uppercase app-text-footnote': !props.inline }}>
            {t('setting id', _props.setting.id)}
          </p>

          <Show when={props.settings.loading}
            fallback={
              <Show when={_props.showDefaultsButton}>
                <button onClick={_props.applyDefaults}
                  class="=apply-setting-defaults bg-transparent p-0 c-tg_hint underline app-text-footnote whitespace-nowrap"
                  >
                  {t('setting apply-defaults')}
                </button>
              </Show>
            }
          >
            <div class="= my--2">
              <Loader />
            </div>
          </Show>
        </div>

        <Show when={props.inline}>
          <p class="=dynamic-setting-header-desc c-tg_hint app-text-footnote m-0">
            {t('setting id-description', { key: _props.setting.id, fallback: '' })}
          </p>
        </Show>
      </div>;
    }
  }
}

export function constructToggleId(id: string, enabled: boolean) {
  return `${id}_${enabled ? 'EN' : 'DIS'}ABLED`;
}

function OptionCheckmark(props: { isSelected?: boolean; gray?: boolean }) {
  return <Checkmark class="=option-checkmark fill-tg_button app-transition-width,opacity,fill"
    classList={{
      'w-0 opacity-0': !props.isSelected,
      'fill-tg_hint!': props.gray,
    }}
  />;
}
