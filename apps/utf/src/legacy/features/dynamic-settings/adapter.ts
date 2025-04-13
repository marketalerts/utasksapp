import { Copy, Mutable, Mapable, Rename } from 'data-mapper';

import type { Schema } from 'shared/network';

import type { ClientProfile } from 'f/profile/profile.adapter';


export interface DynamicSetting<Type extends SupportedSettings = SupportedSettings> extends Mapable<Schema.SettingsParamModel> {
  id: string;
  type: Type;
  href: string;
  default: SettingOf<Type>;
  value: SettingOf<Type> | null;
  isAvailable: boolean;
  isInline?: boolean;
  readonly options?: string[];
  readonly isPro?: boolean;
  readonly hint?: string;
  readonly finalValue: SettingOf<Type>;
}

@Mutable
export class ClientDynamicSetting<Type extends SupportedSettings = SupportedSettings> extends Mapable<Schema.SettingsParamModel> implements DynamicSetting<Type> {
  @Rename('code')
  id!: string;

  @Rename('code', x => x)
  href!: string;

  @Rename('code', getSettingType)
  type!: Type;

  @Rename('defaultValue')
  default!: Exclude<SettingOf<Type>, null>;

  @Copy
  value!: SettingOf<Type> | null;

  @Rename('enabled', x => !!x)
  @Rename.reverse()
  isAvailable!: boolean;

  get finalValue() {
    return this.value ?? this.default;
  }

  get hint(): string | undefined {
    return undefined;
  }

  // @ts-expect-error Maybe support will come later
  @Copy
  readonly isPro?: boolean;

  // @ts-expect-error Maybe support will come later
  @Copy
  readonly options?: string[];
}

export class ClientOnlyDynamicSetting<Type extends SupportedSettings = SupportedSettings> extends ClientDynamicSetting<Type> {
  #hint?: () => string;

  constructor(source: Schema.SettingsParamModel, options: {
    getValue: () => SettingOf<Type>,
    setValue: (v: SettingOf<Type>) => void,
    hint?: () => string;
    isPro: boolean;
  }) {
    super(source);

    Object.defineProperty(this, 'value', {
      get: options.getValue,
      set: options.setValue,
    });

    this.#hint = options.hint;

    this.isPro = options.isPro;
  }

  get hint() {
    return this.#hint?.();
  }

  readonly isPro?: boolean;
  readonly options?: string[];
}

export enum SupportedSettings {
  Events = 'EVENTS',
  TaskVisibility = 'TASKS_USERSONLY',
  Timezone = 'TIMEZONE',
  Language = 'LANGUAGE',
  Page = 'PAGE',
  Toggle = 'TOGGLE',
  Multitoggle = 'TOGGLE_COLLECTION',
  Options = 'OPTIONS',
}

export const supportedSettings = Object.values(SupportedSettings);

type SupportedTypes = {
  'EVENTS': Record<string, boolean>;
  'TASKS_USERSONLY': boolean;
  'LANGUAGE': string;
  'TIMEZONE': { timeZone: number, timeZoneId: string };
  'PAGE': null;
  'TOGGLE': boolean;
  'TOGGLE_COLLECTION': Record<string, boolean>;
  'OPTIONS': string;
}

export type SettingOf<ID extends SupportedSettings> =
  ID extends keyof SupportedTypes ? SupportedTypes[ID] : never;

export type Supports<ID extends SupportedTypes[keyof SupportedTypes]> =
  ID extends SupportedTypes[infer SupportedType extends keyof SupportedTypes] ? SupportedType : never;


const supportedSettingRegExp = new RegExp(`(${supportedSettings.join('|')})$`, 'i');

// A setting has prefixes to signify its usage and placement,
// we don't need these to tell how the setting functions
export function getSettingType(settingId: string): SupportedSettings {
  return settingId.match(supportedSettingRegExp)?.[0] as SupportedSettings;
}

export function isSupported(setting: () => DynamicSetting | undefined) {
  return isSettingOfType(setting, ...supportedSettings);
}

export function isSettingOfType<Type extends SupportedSettings>(
  setting: () => DynamicSetting | undefined,
  ...types: Type[]
): setting is () => DynamicSetting<Type> {
  const type = setting()?.type;

  if (type == undefined) {
    return false;
  }

  return types.includes(type as Type);
}

export function settingOfType<Type extends SupportedSettings>(
  setting: () => DynamicSetting | undefined,
  ...types: Type[]
): DynamicSetting<Type> | undefined {
  if (isSettingOfType(setting, ...types)) {
    return setting();
  }

  return undefined;
}

type SettingCase<T extends SupportedSettings, R> = [T[], (setting: DynamicSetting<T>) => R];

export function switchPerType<R>(
  setting: () => DynamicSetting | undefined,
  cases: SettingCase<any, R>[],
): undefined | (() => R) {
  for (const [types, action] of cases) {
    if (isSettingOfType(setting, ...types)) {
      return () => action(setting());
    }
  }

  return undefined;
}

export const caseOf = <T extends SupportedSettings>(...types: T[]) => <R>(action: (setting: DynamicSetting<T>) => R): SettingCase<T, R> => {
  return Array.isArray(types) ? [types, action] : [[types], action];
};

export const createRawSetting = <Type extends SupportedSettings>(
  setting: Type,
  value: Schema.SettingsParamModel & { value?: SettingOf<Type>; defaultValue: SettingOf<Type> },
) => value;

export const createClientSetting = <Type extends SupportedSettings>(
  setting: Type,
  value: Schema.SettingsParamModel & { value?: SettingOf<Type>; defaultValue: SettingOf<Type> },
) => new ClientDynamicSetting<Type>(value);

export const getSettingOfType = <R extends SupportedSettings>(type: R, settings: DynamicSetting[]): DynamicSetting<R> | undefined => (
  settings.find((s): s is DynamicSetting<R> => isSettingOfType(() => s, type))
);

export function isSettingDisabled(setting: DynamicSetting, profile: ClientProfile): boolean {
  return !setting.isAvailable || !isSupported(() => setting) || (!!setting.isPro && !profile.isPro);
}