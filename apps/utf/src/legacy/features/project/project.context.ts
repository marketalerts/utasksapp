import { persistResource } from 'solid-utils/persist-resource';
import { createContext, createResource } from 'solid-js';
import type { InitializedResourceReturn } from 'solid-js';
import { useParams, useSearchParams } from '@solidjs/router';

import { ProjectType } from './project.adapter';
import type { ClientItem } from './project.adapter';

import { t } from 'locales/group';

export const defaultProject: ClientItem = {
  id: 'g_inc',
  get name() {
    return t('group-name', 'g_inc');
  },
  icon: 'g_inc',
  type: ProjectType.Dynamic,
};

export const ProjectContext = createContext<InitializedResourceReturn<ClientItem>>(
  createResource(() => defaultProject, { initialValue: defaultProject }),
);

export const persistProject = (id: string, defaultProjectValue = defaultProject) => persistResource<ClientItem>({
  key: () => id,
  defaultValue: defaultProjectValue,
});

export const getProjectDataFromHref = () => {
  try {
    const params = useParams();
    const [search] = useSearchParams();

    return (): ClientItem => {
      const { name, type } = search;
      return {
        id: params.projectId,
        name: name ?? '',
        type: !type
          ? ProjectType.Dynamic
          : type === ProjectType.Dynamic
            ? ProjectType.Dynamic
            : type === ProjectType.Public
              ? ProjectType.Public
              : ProjectType.Private,
      };
    };
  } catch {
    return (): ClientItem => {
      const id = location.pathname.slice(0, location.pathname.indexOf('/'));

      return {
        id,
        name: '',
        type: ProjectType.Public,
      };
    };
  }
};
