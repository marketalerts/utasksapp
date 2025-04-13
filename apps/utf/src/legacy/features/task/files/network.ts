import { download, resolvedBackendUrl, upload } from 'shared/network/base-client';
import { getAutorizedHeaders, getLocalToken } from 'shared/network/auth';
import { fetchUtasks } from 'shared/network';

export const attachFiles = (id: string, files: FormData, updateProgress: (percent?: number) => void, messageId?: number) => {
  const response = getAutorizedHeaders().then(headers => (
    upload(
      resolvedBackendUrl + `/api/tasks/${id}/attach` + (messageId ? `?messageId=${messageId}` : ''),
      headers,
      files,
      updateProgress,
    )
  ));

  return response;
};

export const deleteFiles = (id: string, fileIds: string[], lastMessageId?: number) => (
  fetchUtasks
    .delete('/api/tasks/{id}/attach', {
      params: {
        path: { id },
        query: { messageid: lastMessageId },
      },
      body: fileIds,
    })
);

export const downloadFile = async (id: string, updateProgress?: (percent?: number) => void) => {
  const [response] = await getAutorizedHeaders().then(() => (
    download(
      resolvedBackendUrl + `/api/tasks/files/${id}?token=${getLocalToken()}`,
      {},
      updateProgress,
    )
  ));

  return await response as File;
};
