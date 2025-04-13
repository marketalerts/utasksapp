import { createMemo, onMount } from 'solid-js';
import type { ParentProps } from 'solid-js';

import { setFrameColor } from 'shared/platform';

import { getProjectDataFromHref } from 'f/project/project.context';
import { isArea } from 'f/project/project.adapter';
import { createDynamicProjectSettingsResource } from 'f/dynamic-settings/project-settings/context';
import { DynamicSettingsContext } from 'f/dynamic-settings/context';

export default function RootDetails(props: ParentProps) {
  onMount(() => {
    //setFrameColor('secondary_bg_color');
  });

  const hrefProject = getProjectDataFromHref();
  const settings = isArea(hrefProject()) ? undefined : createDynamicProjectSettingsResource(createMemo(() => hrefProject().id));

  return <>
    <DynamicSettingsContext.Provider value={settings}>
      {props.children}
    </DynamicSettingsContext.Provider>
  </>;
}
