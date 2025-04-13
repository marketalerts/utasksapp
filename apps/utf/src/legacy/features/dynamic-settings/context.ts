import { createContext } from 'solid-js';
import type { InitializedResourceReturn } from 'solid-js';

import type { ClientDynamicSetting } from './adapter';

export const DynamicSettingsContext = createContext<InitializedResourceReturn<ClientDynamicSetting[], any>>();
