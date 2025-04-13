import { original } from 'data-mapper/decorators/base';

import type { Schema } from 'shared/network';

import { SupportedSettings, isSupported } from './adapter';
import type { DynamicSetting } from './adapter';

export type StructureTemplate = Array<SectionTemplate>;
type SectionTemplate = { section: string, links: SettingTemplate[], inline?: SettingTemplate[] } | SettingTemplate[];
export type SettingTemplate = string | PageTemplate;
type PageTemplate = { page: string, sections: StructureTemplate };

export type SettingsGenerator = Generator<{
  section: string;
  settings: Array<DynamicSetting>;
}>;

export function *getSettingsTree(
  structure: StructureTemplate,
  settingsObjects: DynamicSetting[],
  filterPages: string[],
): SettingsGenerator {
  // Always assume the first page is root and comes from the url itself
  const [root, ...pages] = filterPages;

  const rootPage = {
    page: root,
    sections: structure,
  } satisfies PageTemplate;

  const sections = pages.length > 0
    ? findPageSections(rootPage, filterPages)
    : rootPage.sections;

  for (const section of sections) {
    const { section: name, links: templates, inline } = Array.isArray(section)
      ? { section: '', links: section, inline: undefined }
      : section;

    yield {
      section: name,
      settings: [...generateSettings(templates, settingsObjects, filterPages, inline)],
    };
  }
}

function *generateSettings(
  settingTemplates: SettingTemplate[],
  settingsObjects: DynamicSetting[],
  parentCollections: string[],
  inlineSettings?: SettingTemplate[],
) {
  for (const template of settingTemplates) {
    if (!isPageTemplate(template)) {
      yield* settingsObjects.filter(setting => template === setting.id && isSupported(() => setting));
      continue;
    }

    const { page, sections: structure } = template;
    const topSettings = structure.flatMap(getSettingTemplates);

    yield new DynamicSettingCollection(
      page,
      settingsObjects.filter(setting => topSettings.includes(setting.id)),
      parentCollections,
    );
  }

  if (!inlineSettings) {
    return;
  }

  for (const template of inlineSettings) {
    if (!isPageTemplate(template)) {
      yield* settingsObjects.filter(setting => template === setting.id && isSupported(() => setting)).map(s => (s.isInline = true, s));
      continue;
    }

    const { page, sections: structure } = template;
    const topSettings = structure.flatMap(getSettingTemplates);

    yield new DynamicSettingCollection(
      page,
      settingsObjects.filter(setting => topSettings.includes(setting.id)),
      parentCollections,
    );
  }
}

function findPageSections(
  rootPage: PageTemplate,
  [currentPage, ...nextPages]: string[],
): StructureTemplate {
  const page = findTopPage(rootPage, currentPage);

  if (!page) {
    return [];
  }

  if (nextPages.length === 0) {
    return page.sections;
  }

  return findPageSections(page, nextPages);
}

function findTopPage(rootPage: PageTemplate, page: string) {
  if (page === rootPage.page) {
    return rootPage;
  }

  const topCollections = rootPage.sections
    .flatMap(getSettingTemplates)
    .filter(isPageTemplate);

  return topCollections.find(c => c.page === page);
}

const getSettingTemplates = (section: SectionTemplate): SettingTemplate[] => (
  Array.isArray(section) ? section : section.links
);

const isPageTemplate = (setting: SettingTemplate): setting is PageTemplate => (
  typeof setting === 'object'
);

export class DynamicSettingCollection implements DynamicSetting {
  id = SupportedSettings.Page;
  type = SupportedSettings.Page;
  default = null;
  value = null;
  finalValue = null;
  href: string;

  constructor(
    public label: string,
    protected settings: DynamicSetting[],
    parentCollections: string[],
  ) {
    this.href = `${parentCollections.join('/')}/${label}`;
  }

  [original]!: Schema.SettingsParamModel;

  get isAvailable(): boolean {
    return this.settings.some(s => s.isAvailable);
  }

  static filterInstance(setting: DynamicSetting): DynamicSettingCollection | undefined {
    return setting instanceof DynamicSettingCollection ? setting : undefined;
  }
}
