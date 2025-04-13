import { Route } from '@solidjs/router';

import Session from './session';
import Demo from './demo';

import ListLinks from 'shared/ui/list/links';

export default import.meta.env.APP_ENV !== 'prod' ? () => <>
  <Route path="/devtools" component={() => <>
    <main class="= p-4">
      <ListLinks each={[
        {
          title: () => 'Telegram API testing',
          href: 'demo',
        },
        {
          title: () => 'Session settings',
          href: 'session',
        },
      ]} />
    </main>
  </>} />
  <Route path="/devtools/demo" component={Demo} />
  <Route path="/devtools/session" component={Session} />
</> : () => <></>;