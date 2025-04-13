import 'virtual:uno.css';
import '@unocss/reset/normalize.css';
import '@unocss/reset/sanitize/typography.css';
import '@unocss/reset/sanitize/sanitize.css';
import '@unocss/reset/sanitize/assets.css';
import '@unocss/reset/sanitize/forms.css';

import { FileRoutes } from '@solidjs/start/router';
import { Router } from '@solidjs/router';
// import { MetaProvider } from '@solidjs/meta';

import DevRoutes from 'f/_devtools/routes';

import Root from './root';

if (import.meta.env.APP_ENV !== 'prod') {
  if (localStorage.getItem('active-eruda') == 'true') {
    import('eruda').then(eruda => eruda.default.init());
  }
}

export default function App() {
  return <>
    {/* <MetaProvider> */}
      <Router
        root={Root}
      >
        <FileRoutes />
        <DevRoutes />
      </Router>
    {/* </MetaProvider> */}
  </>;
}
