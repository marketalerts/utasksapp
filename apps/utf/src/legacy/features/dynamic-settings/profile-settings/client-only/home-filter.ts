import { createSignal } from 'solid-js';
import { makePersisted } from '@solid-primitives/storage';

import { lastGroupTree } from 'f/group/group-tree.context';
import type { ClientGroupTree } from 'f/group/group-tree.adapter';
import { ClientOnlyDynamicSetting } from 'f/dynamic-settings/adapter';
import type { SupportedSettings } from 'f/dynamic-settings/adapter';

import { safeRead } from './cached';

import { CloudStorage } from 'shared/ui/telegram';

const code = 'CLIENT_HOMEFILTER_TOGGLE_COLLECTION';
const getSectionId = (groupId: string) => `${code}_${groupId.toUpperCase()}`;
export const getGroupId = (sectionId: string) => sectionId.replace(code + '_', '').toLowerCase();

const defaultGroups: ClientGroupTree = (lastGroupTree ? JSON.parse(lastGroupTree) : { taskGroups: [] });
const defaultGroupsFilter = defaultGroups.taskGroups.reduce((obj, g) => ({ ...obj, [getSectionId(g.id)]: true }), {} as Record<string, boolean>);

delete defaultGroupsFilter[getSectionId('g_inc')];


const [getCurrentFilter, setCurrentFilter] = makePersisted(
  createSignal<Record<string, boolean>>(safeRead('home-filter', defaultGroupsFilter)),
  {
    name: 'home-filter',
    storage: CloudStorage,
  },
);

export const getHomeGroupsFilter = () => {
  return Object.fromEntries(Object.entries(getCurrentFilter() ?? defaultGroupsFilter).map(([id, v]) => [getGroupId(id), v]));
};

export const homeFilterSetting = new ClientOnlyDynamicSetting<SupportedSettings.Multitoggle>({
  code: code,
  defaultValue: defaultGroupsFilter,
  enabled: true,
}, {
  getValue() {
    return getCurrentFilter();
  },
  setValue(v) {
    setCurrentFilter(v);
  },
  isPro: true,
});