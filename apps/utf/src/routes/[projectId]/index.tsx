import { createEffect, createMemo, useContext } from 'solid-js';
import { Navigate, useSearchParams } from '@solidjs/router';

import { SelectedModeContext } from 'f/project/view-mode.context';
import { getProjectDataFromHref } from 'f/project/project.context';

import Project from 'f/project/manager.ui';


export default function ProjectPage() {
  const hrefProject = createMemo(getProjectDataFromHref());

  if (!hrefProject().id) {
    return <Navigate href="/4/0/4"/>;
  }

  const [params, setParams] = useSearchParams();

  const mode = useContext(SelectedModeContext);

  createEffect(() => {
    setParams({
      ...params,
      mode: mode[0](),
    }, { replace: true });
  });

  return <>
    {/* <Title>{hrefProject().name}</Title> */}

    <Project />
  </>;
}
