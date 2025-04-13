import WebApp from 'tma-dev-sdk';
import { onMount } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';

import { t } from 'locales/subscribe';

import { BackButton } from 'shared/ui/telegram';

export default function Subscription() {
  const navigate = useNavigate();
  const params = useParams<{ result: 'success' | 'fail' }>();

  const navigateHome = () => {
    navigate('/');
  };

  let alertOpen = false;

  onMount(() => {
    if (params.result && !alertOpen) {
      alertOpen = true;
      WebApp.showAlert(t(`subscribe ${params.result}`), () => alertOpen = false);
    }
  });

  return <>
    <BackButton onClick={navigateHome} />
  </>;
}
