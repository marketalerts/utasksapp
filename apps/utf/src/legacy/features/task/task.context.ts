import { createContext } from 'solid-js';

import type { FullClientTask } from './task.adapter';

export const FullTaskContext = createContext<() => FullClientTask>();