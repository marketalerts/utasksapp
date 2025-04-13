import { createContext } from 'solid-js';

export interface FilePreviewController {
  show(fileIndex: number): void;
}

export const PreviewContext = createContext<FilePreviewController>();