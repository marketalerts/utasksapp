import { Mapable, Immutable, Copy, Rename, Map } from 'data-mapper';

import { getMessageLink } from 'shared/platform';
import { resolvedBackendUrl } from 'shared/network/base-client';
import { getLocalToken } from 'shared/network/auth';
import type { Schema } from 'shared/network';

import { downloadFile } from './network';

const downloads: Record<string, Promise<File>> = {};

@Immutable
export class ClientTaskFile extends Mapable<Schema.TaskFileModel> {
  @Copy
  id!: string;

  @Copy
  chatId!: number;

  @Rename('fileName')
  name!: string;

  @Map(file => getDownloadLink(file))
  downloadLink!: string;

  getLocalDownloadLink(onprogress?: (progress?: number) => void) {
    return this.download(onprogress)
      .then(b => {
        return this.downloadLink = URL.createObjectURL(b);
      });
  }

  @Map(getMessageLink)
  messageLink?: string;

  download(onprogress: ((progress?: number) => void) | undefined) {
    return downloads[this.id] ??= downloadFile(this.id, onprogress)
      .catch(e => {
        delete downloads[this.id];
        throw e;
      });
  }
}

export type DisplayableFile = File | ClientTaskFile;

export const getAttrs = (file?: DisplayableFile): {
  name: string;
  ext?: string
} | undefined => {
  if (!file) {
    return undefined;
  }

  const [, name, ext] = file.name.match(/^(.+)\.(.+)$/) ?? [];

  return { name: name ?? file.name, ext };
};

export function getDownloadLink(file: { id?: string }): string {
  return `${resolvedBackendUrl}/api/tasks/files/${file.id}?token=${getLocalToken()}`;
}
