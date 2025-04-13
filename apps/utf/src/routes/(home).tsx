import WebApp from 'tma-dev-sdk';
import { getOwner, runWithOwner, useContext, onMount } from 'solid-js';
import { useIsRouting, useNavigate, useSearchParams } from '@solidjs/router';

import { checkIfNotReserved, runLater } from 'shared/platform';
import { startParamKey } from 'shared/network/auth';

import { attachAssignee } from 'f/task/task.network';
import { updateProjectPosition } from 'f/project/project.network';
import Splash from 'f/mandatory-popup/ui';
import { useSplash } from 'f/mandatory-popup/types';
import { GroupTreeContext, createGroupTreeResource } from 'f/group/list.context';
import { updateAreaPosition } from 'f/group/area.network';

import { t } from 'locales/home';

// import TrialSplash from 'f/trial/ui';
import { BackButton } from 'shared/ui/telegram';
import { PopupController } from 'shared/ui/popup';

import Home from 'f/home/home.ui';


const ignoreStartKey = 'ignore-start-param';

const shouldRedirect = (x: string | undefined): x is string => (
  typeof x === 'string' && !sessionStorage.getItem(ignoreStartKey)
);

const startParamCode = {
  '#': /-H-/g,
  '/': /-S-/g,
  '?': /-Q-/g,
  '=': /-E-/g,
  '&': /-A-/g,
};

if (WebApp.platform.startsWith('web')) {
  sessionStorage.removeItem(ignoreStartKey);
}

export default function HomePage() {
  const [params] = useSearchParams();
  const startParam = WebApp.initDataUnsafe.start_param ?? params.tgWebAppStartParam;

  const navigate = useNavigate();

  const decodedUrl = Object.entries(startParamCode).reduce(
    (param, [replacement, code]) => param?.replace(code, replacement),
    startParam,
  );

  const isRouting = useIsRouting();

  const owner = getOwner();

  if (shouldRedirect(startParam) && decodedUrl && checkIfNotReserved(decodedUrl)) {
    sessionStorage.setItem(startParamKey, startParam);
    sessionStorage.setItem(ignoreStartKey, 'true');

    if (decodedUrl.includes('#')) {
      // Check if the app is being opened to attach an assignee to an inline task
      const [, taskId] = decodedUrl.match(/#(?:.*&)?attachassignee=([^&]+)(?:&.*)?$/) ?? [];

      if (typeof taskId === 'string') {
        attachAssignee(taskId)
          .then((r) => showAttachPopup(r.response.status, taskId));
      } else {
        const { attachassignee: taskId } = JSON.parse(sessionStorage.getItem('__telegram__initParams') ?? '{}');

        if (typeof taskId === 'string') {
          attachAssignee(taskId)
            .then((r) => showAttachPopup(r.response.status, taskId));
        }
      }
    }

    const decodedPath = decodedUrl.replace(/(\?.*)?(#.*)/, '');

    if (!['', '/'].includes(decodedPath)) {
      const splitUrl = decodedPath.split('/');

      if (splitUrl.length > 1) {
        splitUrl.slice(0, -1).reduce((cummulative, suburl) => {
          console.log('navigating to:', cummulative, suburl);

          const final = cummulative ? `${cummulative}/${suburl}` : suburl;

          history.pushState(null, '', final);

          return final;
        }, '');
      }

      runLater(() => navigate(decodedUrl));

      onMount(() => {
        runRoutingHealthCheck();
      });

      return <></>;
    }
  }

  const splashProps = useSplash();

  return <>
    {/* <Title>UTasks</Title> */}
    <BackButton isVisible={false}/>

    <Splash {...splashProps}>
      <HomeMain />
    </Splash>
  </>;

  function showAttachPopup(status: number, taskId: string) {
    if (status >= 400) {
      return;
    }

    runWithOwner(owner, () => {
      const popup = useContext(PopupController);

      popup?.setText(status === 200 ? t('attachassignee popup') : t('attachassignee popup accepted'));
      // popup?.setChildren(<>
      //   <A href={`/g_inc/${taskId}`} class="= c-tg_button bg-transparent" onClick={() => popup.hide()}>
      //     {t('attachassignee popup go-to')}
      //   </A>
      // </>);
      popup?.show(10000);
    });
  }

  function HomeMain() {
    const groupTree = createGroupTreeResource();

    return <>
      <GroupTreeContext.Provider value={groupTree}>
        <Home
          onReorderProject={updateProjectPosition}
          onReorderArea={updateAreaPosition}
        />
      </GroupTreeContext.Provider>
    </>;
  }

  function runRoutingHealthCheck() {
    const interval = setInterval(() => {
      if (isRouting()) {
        console.log('Routing...');
      } else {
        console.log('Stopped routing!');
        clearInterval(interval);

        // see https://github.com/solidjs/solid/issues/2046
        if (!document.querySelector('main') || !document.getElementById('app')?.hasChildNodes()) {
          location.reload();
        }
      }
    }, 200);
  }
}
