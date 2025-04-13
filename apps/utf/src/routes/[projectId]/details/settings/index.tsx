import { createMemo, useContext } from 'solid-js';
import { useParams } from '@solidjs/router';

import { getProjectDataFromHref } from 'f/project/project.context';
import type { StructureTemplate } from 'f/dynamic-settings/settings-sections';
import { DynamicSettingsContext, createDynamicProjectSettingsResource } from 'f/dynamic-settings/project-settings/context';

import SettingsSections from 'f/dynamic-settings/settings-sections.ui';

const projectSettingsStructure = [
  {
    section: 'collaborative',
    links: [
      'PR_EVENTS',
      'PR_TIMEZONE',
      'PR_LANGUAGE',
    ],
  },
  {
    section: 'personal',
    links: [
      'PR_USER_TASKS_USERSONLY',
      'PR_USER_EVENTS',
    ],
  },
] satisfies StructureTemplate;

const inboxSettingsStructure = [
  {
    section: 'inbox',
    links: [
      'USER_EVENTS',
    ],
  },
] satisfies StructureTemplate;

export default function ProjectSettings() {
  const params = useParams<{ pages?: string; }>();
  const hrefProject = createMemo(getProjectDataFromHref());
  const pages = createMemo(() => ['pages'].concat(params.pages?.split('/') ?? []));
  const [settingsResource] = useContext(DynamicSettingsContext) ?? createDynamicProjectSettingsResource(() => hrefProject().id);

  return <SettingsSections
    settingsResource={settingsResource}
    filterPages={pages()}
    settingsStructure={hrefProject().id === 'g_inc' ? inboxSettingsStructure : projectSettingsStructure}
  />;
}
