// @refresh reload
import { mount, StartClient } from '@solidjs/start/client';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export default mount(() => <StartClient />, document.getElementById('app')!);
