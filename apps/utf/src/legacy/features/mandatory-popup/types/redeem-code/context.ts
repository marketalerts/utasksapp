import { createContext } from 'solid-js';
import type { ResourceReturn } from 'solid-js';

import type { RedeemCode } from './adapter';

export const SplashContext = createContext<ResourceReturn<RedeemCode>>();
