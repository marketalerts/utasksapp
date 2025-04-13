import WebApp from 'tma-dev-sdk';
import { Dynamic } from 'solid-js/web';
import { Show, Suspense, createSignal, onMount, useContext } from 'solid-js';

import { setFrameColor } from 'shared/platform';
import { currentLocale } from 'shared/l10n';

import { ProfileContext } from './profile.context';

import { t } from 'locales/profile';
import { t as tAbout } from 'locales/about';

import ListLinks from 'shared/ui/list/links';
import { InitialsAvatar } from 'shared/ui/initials-avatar';

import Web from 'icons/devices/web.svg';
import IOS from 'icons/devices/ios.svg';
import Desktop from 'icons/devices/desktop.svg';
import Android from 'icons/devices/android.svg';
import Settings from 'icons/30/Settings.svg';
import ProStar from 'icons/30/Pro.svg';
import Telegram from 'icons/30/News.svg';
import Question from 'icons/30/FAQ.svg';
import Chat from 'icons/30/Contact Support.svg';

export default function ProfilePage() {
  const [user] = useContext(ProfileContext);

  onMount(() => {
    //setFrameColor('secondary_bg_color');
  });

  const DevTools = import.meta.env.APP_ENV !== 'prod'
    ? <ListLinks each={[
      {
        href: '/devtools',
        title: () => 'Developer Tools',
      },
    ]} />
    : <></>;

  return <main class="= flex flex-col items-center p-4 gap-4">
    <Suspense>
      <Show when={user.latest}>
        {(profile) => <>
          <section class="= flex flex-col items-center gap-2">
            <InitialsAvatar big
              user={{
                title: profile().firstName ?? '',
                userName: profile().username,
                avatar: profile().avatar,
              }}
            />
            <div class="= text-center">
              <h1 class="= m-0 text-[1.75rem] line-height-[2.125rem] font-590 letter-spacing-[0.0245rem]">
                {profile().firstName} {profile().lastName}
              </h1>
              <p class="= m-0 c-tg_hint select-auto">@{profile().username}</p>
            </div>
          </section>

          <ListLinks each={[
            {
              href: '/profile/subscription/',
              title: () => t('subscription title'),
              left: <ProStar />,
              rightHint: profile().roleTitle,
            },
          ]} />

          <ListLinks each={[
            {
              href: '/profile/settings/',
              left: <Settings />,
              title: () => t('settings title'),
            },
          ]} />

          <ListLinks each={[
            ...(currentLocale().language === 'ru' ? [{
              href: 'https://doc.utasks.io/main',
              rel: 'documentation',
              instantView: true,
              left: <Question />,
              title: () => t('docs title'),
            }] : []),
            {
              href: 'https://t.me/UTasks_Support',
              left: <Chat />,
              title: () => t('support title'),
            },
            {
              href: tAbout('news link'),
              left: <Telegram />,
              title: () => tAbout('news title'),
            },
          ]} />

          <ListLinks each={[
            {
              href: 'https://utasks.io/Terms%20of%20Use.pdf',
              rel: 'terms-of-use',
              title: () => t('terms title'),
            },
            {
              href: 'https://utasks.io/Privacy%20and%20Cookie%20Policy.pdf',
              rel: 'privacy-policy',
              title: () => t('policy title'),
            },
            {
              href: 'https://utasks.io/Payment%20Policy.pdf',
              title: () => t('policy payment title'),
            },
          ]} />

          {DevTools}
        </>}
      </Show>
    </Suspense>

    <AppVersion backendVersion={() => user.latest?.backendVersion} />
  </main>;
}

function AppVersion(props: { backendVersion: () => (string | undefined); }) {
  const [showPlatform, setShowPlatform] = createSignal(false);
  const appVersion = `v${import.meta.env.APP_VERSION}`;

  const platform = (
    WebApp.platform === 'unknown'
    ? 'web version'
    : WebApp.platform
  );

  const Icon = () => {
    switch (WebApp.platform) {
      case 'tdesktop': return Desktop;

      case 'macos':
      case 'ios': return IOS;

      case 'android_x':
      case 'android': return Android;

      default:
        return Web;
    }
  };

  return <div class="= flex flex-col items-center [&_*]:(line-height-[16px] text-[13px])"
    onClick={() => setShowPlatform(!showPlatform())}
  >
    <Suspense>
      <p class="= c-tg_hint m-0">{t('version title')}</p>
    </Suspense>
    <p class="= c-tg_hint m-0">
      <span>{appVersion}F</span>
      <Suspense fallback="">
        <span> - </span>
        <span>
          {props.backendVersion()}B
        </span>
      </Suspense>
    </p>
    <div class="= flex mt-2 flex-col items-center max-h-0 app-transition-max-height overflow-hidden" classList={{ 'max-h-12': showPlatform() }}>
      <Dynamic component={Icon()} class="= fill-tg_hint" />
      <p class="= c-tg_hint m-0 mt-1">{platform}-v{WebApp.version}</p>
    </div>
  </div>;
}
