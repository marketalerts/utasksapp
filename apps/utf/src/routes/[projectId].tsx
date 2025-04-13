import { createEffect, createResource, createSignal } from 'solid-js';
import { createMemo } from 'solid-js';
import type { ParentProps } from 'solid-js';
import { useParams, useLocation, useSearchParams } from '@solidjs/router';
import { MultiProvider } from '@solid-primitives/context';

import { SelectedModeContext } from 'f/project/view-mode.context';
import { createUsersResource, UsersContext } from 'f/project/users.context';
import { fetchProject } from 'f/project/project.network';
import { getProjectDataFromHref, persistProject, ProjectContext } from 'f/project/project.context';
import { ProjectType, ProjectItem, isArea } from 'f/project/project.adapter';
import type { ClientItem } from 'f/project/project.adapter';
import { createLocalGroupTreeResource, GroupTreeContext } from 'f/group/list.context';
import { toClientList } from 'f/group/list.adapter';
import { ErrorType } from 'f/errors/types';


export default function (props: ParentProps) {
  const hrefProject = createMemo(getProjectDataFromHref());

  const { taskId } = useParams<{ projectId: string, taskId?: string }>();
  const location = useLocation();

  const defaultProjectValue = isArea(hrefProject())
    ? toClientList(hrefProject())
    : new ProjectItem({
      id: hrefProject().id,
      name: hrefProject().name,
      openTaskCount: 0,
      position: 0,
      used: false,
      userCount: 0,
      type: hrefProject().type,
    }) as ClientItem;

  const shouldUseDummyTree = createSignal(location.pathname.includes('details'));
  const groupTree = createLocalGroupTreeResource(shouldUseDummyTree);

  createEffect(() => {
    shouldUseDummyTree[1](location.pathname.includes('details'));
  });

  const [getInitial, setInitial, getPromise] = persistProject(hrefProject().id, defaultProjectValue);

  const project = createResource(
    async () => {
      const cache = { ...(getInitial() ?? await getPromise()), ...hrefProject() };

      fetchProject(cache.id)
        .then(r => r.data ?? getInitial())
        .then(r => {
          return setInitial(oldP => ({ ...oldP, ...r as ClientItem }));
        })
        .then(r => project[1].mutate(r))
        .catch(e => {
          if (taskId) {
            return undefined;
          }

          if (e.status >= 400) {
            throw { type: ErrorType.HTTP, code: e.status, project: defaultProjectValue.id };
          }

          throw e;
        });

      return cache;
    },
    { initialValue: getInitial() },
  );

  const [params] = useSearchParams();

  const mode = createSignal(Number(params.mode || 0));

  const users = createUsersResource(() => {
    const projectId = project[0].latest.id;
    return [ProjectType.Dynamic, ProjectType.Private].includes(project[0].latest.type ?? ProjectType.Private)
      ? undefined
      : projectId;
  });

  return <>
    <MultiProvider
      values={[
        [ProjectContext, project],
        [GroupTreeContext, groupTree],
        [SelectedModeContext, mode],
        [UsersContext, users],
      ]}
    >
      {props.children}
    </MultiProvider>
  </>;
}