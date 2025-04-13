import { persistResource } from 'solid-utils/persist-resource';
import { createContext, createResource, createRoot } from 'solid-js';

import { today } from 'f/settings/units/date';

import { fetchUserProfile } from './profile.network';
import { ClientProfile } from './profile.adapter';

const [getInitial, setInitial] = persistResource({
  key: () => 'profile',
  defaultValue: new ClientProfile({
    id: '',
    isStarted: true,
    permissions: [],
    role: 'FREE',
    userName: '',
    version: '',
    roleDate: today().toString(),
    roleTitle: '',
    subscription: true,
    rolePrice: 0,
    rolePriceCode: '',
  }),
  serialize: ClientProfile.original,
  deserialize: v => new ClientProfile(v),
});

export const ProfileContext = createContext(createRoot(() => createResource(
  () => (
    fetchUserProfile()
      .then(r => {
        return setInitial(r?.data ?? getInitial());
      })
  ),
  {
    initialValue: getInitial(),
  },
)));
