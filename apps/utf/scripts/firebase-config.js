import { log } from 'console';

import { fetch } from 'undici';

export async function fetchConfig(options) {
  log('🐾 Fetching remote config from firebase...');
  log('...using options:', options);

  return await fetch(
    `https://firebaseremoteconfig.googleapis.com/v1/projects/${options.projectId}/namespaces/firebase:fetch?key=${options.apiKey}`,
    {
      method: 'POST',
      body: `{"app_instance_id":"cgfq61j_TYSWE4aNsXoxpr","app_id":"${options.appId}"}`,
    }
  )
    .then(r => r.json())
    .catch(() => ({ entries: {} }))
    .then((config) => {
      log('💬 Remote config:', config.entries);
      return config;
    });
}

