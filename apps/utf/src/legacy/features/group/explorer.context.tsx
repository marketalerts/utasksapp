import { createContext } from 'solid-js';
import type { Accessor } from 'solid-js';

import type { ClientItem } from './project.adapter';

export const SelectedProject = createContext<Accessor<ClientItem | undefined>>();
