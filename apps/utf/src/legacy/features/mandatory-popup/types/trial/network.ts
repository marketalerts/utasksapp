import WebApp from 'tma-dev-sdk';

import { fetchUtasks } from 'shared/network';

export const markTrialStart = () => (
  fetchUtasks
    .post('/api/profile/{id}/startpageconfirm', {
      params: { path: { id: String(WebApp.initDataUnsafe.user!.id) } },
    })
);

export const markTrialEnd = (selectedPlan: string) => (
  fetchUtasks
    .post('/api/profile/{id}/finishpageconfirm', {
      params: { path: { id: String(WebApp.initDataUnsafe.user!.id) }, query: { type: selectedPlan } },
    })
);

export const pageShown = () => (
  fetchUtasks
    .post('/api/profile/{id}/finishpageshown', {
      params: { path: { id: String(WebApp.initDataUnsafe.user!.id) } },
    })
);
