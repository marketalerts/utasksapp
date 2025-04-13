import { persistResource } from 'solid-utils/persist-resource';
import { createContext, createResource } from 'solid-js';
import type { InitializedResourceReturn } from 'solid-js';

import { listUsers } from './users.network';
import type { ClientUser } from './users.adapter';

export const UsersContext = createContext<InitializedResourceReturn<ClientUser[], string>>();

export const createUsersResource = (projectId: () => string | undefined, defaultValue?: () => ClientUser[]): InitializedResourceReturn<ClientUser[], string> => {
  const [getInitial, setInitial, getPromise] = persistResource<ClientUser[]>({
    key: () => `${projectId()}-users`,
    defaultValue: defaultValue?.() ?? [],
  });

  const resource = createResource<ClientUser[], string>(
    projectId,
    (id, info) => (
      id || typeof info.refetching === 'string' || getInitial().length === 0 || !info.value?.length
      ? listUsers(typeof info.refetching === 'string' ? info.refetching : id)
        .then(r => setInitial(r.data ?? getInitial()))
        .catch(getPromise)
      : getPromise()
    ).then(r => r ?? []),
    { initialValue: getInitial() },
  );

  return resource;
};
