import { Match, Show, Switch } from 'solid-js';
import { A } from '@solidjs/router';

import type { ClientProfile } from 'f/profile/profile.adapter';

import { t } from 'locales/home';

import { InitialsAvatar } from 'shared/ui/initials-avatar';

import ProAvatar from 'icons/ProAvatar.svg';
import ChevronRight from 'icons/ChevronRight.svg';
import Arrow from 'i/Arrow.svg';

export default function ProfileLink(props: {
  profile: ClientProfile;
}) {
  return <div class="=profile-row flex justify-between gap-4 py-0.5 overflow-hidden">
    <A href="/profile/" class="=profile-link flex items-center gap-3 ltr:pl-3 rtl:pr-3 overflow-hidden min-w-12.5" style="flex: 1 0 0"
      data-id="profile-link"
    >
      <InitialsAvatar mid
        user={{
          title: props.profile.firstName ?? '',
          avatar: props.profile.avatar,
          userName: props.profile.username,
        }}
      />
      <div class="= flex flex-col justify-center flex-grow overflow-hidden"
        style="max-width: calc(100% - 2.5rem)"
      >
        <div class="= flex items-center max-w-full overflow-hidden">
          <span class="= line-height-[1.375rem] font-510 text-ellipsis max-h-[1.375rem] whitespace-nowrap overflow-hidden"
            style="max-width: calc(100% - 1rem)"
          >
            {props.profile.firstName}
          </span>
          <Arrow class="= w-4 fill-tg_text! rtl:rotate-180 overflow-initial"/>
        </div>
      </div>
    </A>

    <A href="/profile/subscription" class="=subscription-link p-1 inline-flex items-center rounded-full bg-tg_bg my-0.5 overflow-hidden ltr:pr-2 rtl:pl-2"
      data-id="subscription-link"
    >
      <Show when={!props.profile.isFree}>
        <ProAvatar class="= min-w-8 min-h-8 rounded-full"/>
      </Show>

      <div class="= flex items-center overflow-hidden mt--0.5">
        <Switch
          // Trial:
          fallback={
            <div class="= flex items-center overflow-hidden">
              <div class="= flex flex-col justify-center overflow-hidden mx-2">
                <p class="= m-0 app-text-subheadline whitespace-nowrap">{props.profile.roleTitle}</p>
                <Show when={props.profile.roleExpires}>
                  {expires =>
                    <span class="= m-0 app-text-caption-regular whitespace-nowrap c-tg_hint">
                      {t('role expiration trial', { 'role expiration absolute': [{ date: expires() }], 'role expiration relative': [expires()] })}
                    </span>
                  }
                </Show>
              </div>
              <ChevronRight class="= fill-tg_hint overflow-initial rtl:rotate-180" />
            </div>
          }
        >
          <Match when={props.profile.isFree}>
            <p class="= mx-2 m-0 c-tg_accent_text app-text-subheadline whitespace-nowrap mx-2">{props.profile.roleTitle}</p>
            <ChevronRight class="= overflow-initial rtl:rotate-180 fill-tg_accent_text!" />
          </Match>
          <Match when={props.profile.isPro}>
            <div class="= flex items-center overflow-hidden">
              <div class="= flex flex-col justify-center overflow-hidden mx-2 mt-0.5">
                <p class="= m-0 app-text-subheadline whitespace-nowrap"
                  classList={{ 'ltr:pr-1 rtl:pl-1': props.profile.isSubscribed }}
                >{props.profile.roleTitle}</p>
                <Show when={!props.profile.isSubscribed}>
                  <Show when={props.profile.roleExpires}>
                    {expires =>
                      <span class="= m-0 app-text-caption-regular whitespace-nowrap c-tg_hint">
                        {t('role expiration pro', { 'role expiration absolute': [{ date: expires() }] })}
                      </span>
                    }
                  </Show>
                </Show>
              </div>
              <ChevronRight class="= fill-tg_hint overflow-initial rtl:rotate-180 mt-0.5" />
            </div>
          </Match>
        </Switch>
      </div>
    </A>
  </div>;
}
