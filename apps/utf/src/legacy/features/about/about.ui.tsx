import { onMount } from 'solid-js';
import Multiline from '@intl-schematic/solid/Multiline';

import { setFrameColor } from 'shared/platform';
import { currentLocale } from 'shared/l10n';

import { t } from 'locales/about';

import ListLinks from 'shared/ui/list/links';
import { InitialsAvatar } from 'shared/ui/initials-avatar';


export default function AboutPage() {
  onMount(() => {
    //setFrameColor('secondary_bg_color');
  });

  const localeImage = new Proxy({
    'en': 'en',
    'ru': 'ru',
  } as Record<string, string>, {
    get: (t, k: Extract<keyof typeof t, string>) => k in t ? t[k as keyof typeof t] : t.en,
  });

  return <main
    class="= flex flex-col items-center p-4 gap-4"
  >
    <section class="= flex flex-col items-center gap-2">
      <InitialsAvatar big
        user={{
          title: 'UTasks',
          userName: 'UTasksBot',
          avatar: `${import.meta.env.BASE_URL}${import.meta.env.APP_BASE ?? '/'}Logo.jpg`,
        }}
      />
      <div class="= text-center">
        <h1 class="= m-0 text-[1.75rem] line-height-[2.125rem] font-590 letter-spacing-[0.0245rem]">
          UTasks
        </h1>
      </div>
    </section>

    <section class="= bg-tg_bg p-4 rounded-3">
      <Multiline t={t} k="about text" class="= first:mt-0 last:mb-0" />
    </section>

    <ListLinks each={[
      {
        left: <img src={`${import.meta.env.BASE_URL}${import.meta.env.APP_BASE ?? '/'}News-${localeImage[currentLocale().language]}.png`}
          alt="UTasksBlog"
          class="= rounded-full min-w-9 h-9"
        />,
        href: t('news link'),
        title: () => t('news title'),
      },
      {
        left: <img src={`${import.meta.env.BASE_URL}${import.meta.env.APP_BASE ?? '/'}Chat-${localeImage[currentLocale().language]}.png`}
          alt="UtasksChat"
          class="= rounded-full min-w-9 h-9"
        />,
        href: t('chat link'),
        title: () => t('chat title'),
      },
    ]} />
  </main>;
}
