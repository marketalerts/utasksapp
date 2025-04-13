import { WebApp as WA } from '@twa-dev/types';

declare const WebApp: WA & {
  downloadFile(params: {
    url: string;
    file_name: string;
  }, cb: (accepted: boolean) => void): void;
};

export { WebApp };
