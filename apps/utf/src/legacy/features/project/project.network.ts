import { resolvedBackendUrl, upload } from 'shared/network/base-client';
import { getAutorizedHeaders } from 'shared/network/auth';
import { fetchUtasks, convertResponse, dedupe  } from 'shared/network';
import type { Schema } from 'shared/network';

import { projectToClientItem } from './project.adapter';

export const fetchProject = (id: string) => (
  fetchUtasks
    .get('/api/projects/{id}', { params: { path: { id } } })
    .then(r => {
      if (r.error && Object.keys(r.error).length > 0) {
        throw r.error;
      }

      if (r.response.status > 400) {
        throw { status: 403 };
      }

      return r;
    })
    .then(convertResponse(projectToClientItem))
);

export const deleteProject = (id: string) => (
  fetchUtasks
    .delete('/api/projects/{id}', { params: { path: { id } } })
);

export const postProject = (project: Schema.BaseProjectModel) => (
  fetchUtasks
    .post('/api/projects', { body: project })
);

export const updateProject = dedupe((signal, project: Schema.BaseProjectModel & { id: string; }) => (
  fetchUtasks
    .put('/api/projects/{id}', {
      params: { path: { id: project.id } },
      body: project as Schema.ProjectModel,
      signal,
    })
    .catch(() => undefined)
));

export const updateProjectPosition = (id: string, index: number, areaId?: string) => (
  fetchUtasks
    .put('/api/projects/{id}/position', { params: { path: { id }, query: { index, areaId } } })
);

export const deleteProjectPic = (id: string) => (
  fetchUtasks
    .delete('/api/projects/{id}/logo', { params: { path: { id } } })
);

export const updateProjectPic = async (id: string, files: FormData, updateProgress: (percent: number | undefined) => void) => {
  const response = await getAutorizedHeaders().then(headers => (
    upload(
      resolvedBackendUrl + `/api/projects/${id}/logo`,
      headers,
      files,
      updateProgress,
    )
  ));

  return response[0];
};
