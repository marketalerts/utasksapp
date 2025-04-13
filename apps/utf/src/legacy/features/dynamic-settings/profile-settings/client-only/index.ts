import type { SettingTemplate, StructureTemplate } from 'f/dynamic-settings/settings-sections';

import { projectGearSetting } from './project-gear';
import { newsSetting } from './news';
import { hourCycleSetting } from './hour-cycle';
import { homeFilterSetting } from './home-filter';

export const clientOnlySettings = [
  homeFilterSetting,
  hourCycleSetting,
  newsSetting,
  projectGearSetting,
];

export const clientOnlySettingIds = clientOnlySettings.map(s => s.id);

export const clientSettingsSectionId = 'app-display';

export const clientSettingsSections: StructureTemplate = [{
  section: clientSettingsSectionId,
  links: [
    homeFilterSetting.id,
    hourCycleSetting.id,
    projectGearSetting.id,
  ],
  inline: [
    newsSetting.id,
  ],
}];

export const clientSettings: SettingTemplate[] = [{
  page: clientSettingsSectionId,
  sections: clientSettingsSections,
}];

export * from './hour-cycle';
export * from './project-gear';
export * from './news';
