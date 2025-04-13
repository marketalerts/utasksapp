import { map } from 'rambda';

import { upload, resolvedBackendUrl } from 'shared/network/base-client';
import { getAutorizedHeaders } from 'shared/network/auth';
import { convertResponse, fetchUtasks } from 'shared/network';
import type { Schema } from 'shared/network';

import { toClientList } from 'f/group/list.adapter';

import { toClientItem } from './project.adapter';

export const fetchAreas = () => (
  fetchUtasks
    .get('/api/areas', {})
    .then(convertResponse(map(toClientList)))
);

export const fetchStrandedProjects = () => (
  fetchUtasks
    .get('/api/areas/projects', {})
    .then(convertResponse(map(toClientItem)))
);

export const postArea = (area: Schema.BaseAreaModel) => (
  fetchUtasks
    .post('/api/areas', { body: area })
    .then(convertResponse(toClientList))
);

export const renameArea = (area: Schema.BaseAreaModel & { id: string; }) => (
  fetchUtasks
    .put('/api/areas/{id}', { body: area, params: { path: { id: area.id } } })
);

export const deleteArea = (id: string) => (
  fetchUtasks
    .delete('/api/areas/{id}', { params: { path: { id } } })
);

export const updateAreaPosition = (id: string, index: number) => (
  fetchUtasks
    .put('/api/areas/{id}/position', { params: { path: { id }, query: { index } } })
);

export const deleteAreaPic = (id: string) => (
  fetchUtasks
    .delete('/api/areas/{id}/logo', { params: { path: { id } } })
);

export const updateAreaPic = async (id: string, files: FormData, updateProgress: (percent: number | undefined) => void) => {
  const response = await getAutorizedHeaders().then(headers => (
    upload(
      resolvedBackendUrl + `/api/areas/${id}/logo`,
      headers,
      files,
      updateProgress,
    )
  ));

  return response[0];
};
