import WebApp from 'tma-dev-sdk';
import { useContext, onMount, createRenderEffect, createEffect, ErrorBoundary, Suspense, on } from 'solid-js';
import type { ParentProps } from 'solid-js';
import { useNavigate, useLocation } from '@solidjs/router';
// import { Title, Meta, Link } from '@solidjs/meta';

import { applyAndroidScrollFix, runLater, setFrameColor, setFrameColorToTopElementBg } from 'shared/platform';
import { isInline } from 'shared/platform';
import { isQaModeEnabled } from 'shared/network/auth';
import { currentTextDirection, currentLocale } from 'shared/l10n';

import { SettingsContext } from 'f/settings/settings.context';
import StandardError from 'f/errors/ui/standard';
import { ErrorType } from 'f/errors/types';

import 'ui/css';

import SW from './SW';

import { BackButton } from 'shared/ui/telegram';
import { usePopup } from 'shared/ui/popup';

if (!WebApp.initData && !isInline() && !isQaModeEnabled()) {
  location.href = 'https://t.me/UTasksBot/Tasks';
}

export default function Root(props: ParentProps) {
  useContext(SettingsContext);
  const navigate = useNavigate();

  if (!WebApp.initDataUnsafe?.user?.allows_write_to_pm) {
    try {
      WebApp.requestWriteAccess();
    } catch (error) {
      console.log('access already requested');
    }
  }

  WebApp.expand();

  const route = useLocation();
  const isRoot = () => route.pathname === '/';

  onMount(() => {
    document.documentElement.style.colorScheme = WebApp.colorScheme;

    applyAndroidScrollFix();

    const viewport = document.createElement('meta');
    /*
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no" />
    */

    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no';
    document.head.appendChild(viewport);

    if (!isInline()) {
      WebApp.SettingsButton.show();
      WebApp.SettingsButton.onClick(() => {
        navigate('/profile/');
      });
    }
  });

  createEffect(on(() => route.pathname, () => runLater(() => {
    setFrameColorToTopElementBg();
  })));

  createRenderEffect(() => {
    document.documentElement.dir = currentTextDirection();
    document.documentElement.lang = currentLocale().baseName;
  });

  const { Popup, PopupProvider } = usePopup();

  return <>
    {/* <Title dir="auto">{displayName}</Title>
    <Meta charset="utf-8" />
    <Meta name="title" content={displayName}/>
    <Meta name="description" content={description}/>
    <Meta name="robots" content="noindex, nofollow" />
    <Link rel="manifest" href={`${import.meta.env.APP_BASE ?? '/'}manifest.json`} />
    <Link rel="shortcut icon" href="data:image/x-icon;," type="image/x-icon" /> */}
    <PopupProvider>
      <ErrorBoundary fallback={
        (e, reset) => <>
          <StandardError type={(e.code || e.cause?.code) ? ErrorType.HTTP : ErrorType.Client}
            error={() => e.cause ?? e}
            retry={reset}
            code={e.code ?? e.cause?.code}
          />
        </>
      }>
        <BackButton isVisible={!isRoot()} />
        <Suspense>{props.children}</Suspense>
        <SW />
        <Popup />
      </ErrorBoundary>
    </PopupProvider>
  </>;
}
