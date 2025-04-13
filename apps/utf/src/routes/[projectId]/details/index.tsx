import { useContext } from 'solid-js';

import { updateProject } from 'f/project/project.network';
import { ProjectContext } from 'f/project/project.context';
import { isArea, ProjectItem } from 'f/project/project.adapter';
import { renameArea } from 'f/group/area.network';

import ProjectDetails from 'f/project/details.ui';

export default function Details() {
  const [project, { mutate, refetch }] = useContext(ProjectContext);

  return <ProjectDetails
    onTitleUpdate={name => {
      if (isArea(project.latest)) {
        renameArea({ id: project.latest.id, name })
          .then(() => (mutate(prev => {
            prev.name = name;
            return ({
              ...prev as ProjectItem,
              name,
            });
          }), refetch()));
        return;
      }

      updateProject({ ...ProjectItem.revert(project.latest as ProjectItem), name })
        .then(() => mutate(prev => {
          prev.name = name;
          return ({
            ...prev as ProjectItem,
            name,
          });
        }));
    }}
  />;
}
