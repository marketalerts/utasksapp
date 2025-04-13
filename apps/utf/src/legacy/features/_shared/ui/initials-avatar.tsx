import WebApp from 'tma-dev-sdk';
import { For, Show, createMemo, createRenderEffect, mergeProps } from 'solid-js';
import type { ParentProps } from 'solid-js';
import { prop } from 'rambda';
import ColorHash from 'color-hash-ts';

import { isMac, isMobile } from 'shared/platform';
import { currentTextDirection } from 'shared/l10n';
import { ImgStatus, useImgStatus } from 'shared/img-status';

import { getCssColorVariable } from './telegram';

import Add from 'i/Add.svg';


interface ClientUser {
  title: string;
  avatar?: string;
  userName?: string;
}

export interface AvatarWithInitialsProps extends ParentProps {
  small?: boolean;
  big?: boolean;
  mid?: boolean;
  hideIfNoUser?: boolean;
  user?: ClientUser | null;
  color?: string;
  getInitials?: (user: ClientUser) => string[];
  class?: string;
  halo?: boolean;
  noGlare?: boolean;
  classList?: Record<string, boolean | undefined>;
  square?: boolean;
}

const colorHash = new ColorHash({ lightness: 0.4, saturation: 0.6 });
const colorBrand = new ColorHash({ lightness: 0.7, saturation: 0.6, hue: 260 });

export function getColorBy(hash: string) {
  return colorHash.hex(hash);
}

export function getColor(user: ClientUser) {
  return user.userName === 'UTasksBot' ? colorBrand.hex('')  : getColorBy(String(user.userName || user.title));
}

export function InitialsAvatar(_props: AvatarWithInitialsProps) {
  const props = mergeProps({ getInitials, children: [<Add />] }, _props);

  const avatarBackground = (user: ClientUser) => props.color || getColor(user);

  const { setImgStatus, isImgBad, isImgLoading } = useImgStatus();

  createRenderEffect(() => {
    if (props.user?.avatar) {
      setImgStatus(ImgStatus.LOADING);
    }
  });

  return <Show when={props.user}
    fallback={
      <Show when={!props.hideIfNoUser}>
        {props.children}
      </Show>
    }
  >
    <div class="=initials-avatar relative inline-block ltr:ml--0.5 rtl:mr--0.5 ltr:mr--0.5 rtl:ml--0.5"
      classList={{
        '=ava-regular app-text-title min-w-9! min-h-9! w-9! h-9!': !props.small && !props.mid,
        '=ava-small app-text-subtitle min-w-[26px]! min-h-[26px]! w-[26px]! h-[26px]!': props.small,
        'scale-83.5': props.square,
        '=ava-big scale-300! m-10': props.big,
        '=ava-mid min-w-[40px]! min-h-[40px]! w-[40px]! h-[40px]!': props.mid,
        [String(props.class)]: !!props.class,
        ...props.classList,
      }}
      title={props.user?.title}
    >
      <Show when={props.halo}>
        <div class="=avatar-halo absolute top--0.5 ltr:left--0.5 rtl:right--0.5 ltr:right--0.5 rtl:left--0.5 bottom--0.5 z--1 bg-tg_bg rounded-full"></div>
      </Show>
      <Show when={(props.user && !props.user.avatar) || isImgBad() || isImgLoading()}>
        <div
          class="=avatar-bg sf-rounded line-height-[1.5rem] rounded-full w-full h-full flex items-center justify-center text-tg_button_text font-700"
          classList={{ 'text-[0.8rem]!': props.small, 'rounded-2!': !!props.square }}
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          style={{ background: avatarBackground(props.user!) }}
        >
          <span class="=initials ltr:ml-0.25 rtl:mr-0.25"
            classList={{ 'text-[0.8rem]! mx-0! mt-[-1px] text-center': !isMobile() && !isMac() && props.small }}
          >{props.getInitials(props.user!)}</span>
        </div>
        <div class="= absolute top-0 ltr:left-0 rtl:right-0 w-full h-full rounded-full"
          classList={{ 'hidden': props.noGlare, 'rounded-2!': !!props.square }}
          style={WebApp.platform !== 'tdesktop' ? {
            background: 'linear-gradient(rgba(255,255,255,0.2), rgba(255,255,255,0))',
          } : {}}
        />
      </Show>
      <Show when={props.user?.avatar && !isImgBad()}>
        <img src={props.user?.avatar}
          class="=avatar-img absolute rounded-full h-full w-full ltr:left-0 rtl:right-0 top-0"
          classList={{
            'rounded-2!': !!props.square,
          }}
          onError={(e) => {
            if (isImgLoading()) {
              setImgStatus(ImgStatus.BAD);
            }
          }}
          onLoad={() => {
            setImgStatus(ImgStatus.GOOD);
          }}
          style="object-fit:cover"
        />
      </Show>
    </div>
  </Show>;

  function getInitials(user: ClientUser) {
    return user.title
      ?.split(' ', 2)
      .map(prop(0))
      .join('')
      .toUpperCase() ?? '';
  }
}


export function InitialsAvatars(_props: Omit<AvatarWithInitialsProps, 'user'> & {
  users: ClientUser[];
  limit?: number;
  width?: number;
}) {
  const props = mergeProps({ limit: 4, width: 3 }, _props);

  const difference = () => props.users.length - props.limit;
  const cappedUsers = createMemo(
    () => difference() > 0
      ? props.users.slice(0, props.limit)
      : props.users,
  );

  const otherUsersNames = createMemo(
    () => props.users.slice(props.limit - 1).map(u => u.title).join(', '),
  );

  const tgBgSecondary = getCssColorVariable('--tg-theme-secondary-bg-color', '--default-tg-theme-secondary-bg-color');

  return <Show when={props.users.length === 1}
    fallback={
      <div class="=avatars-list grid items-top justify-items-end"
        style={{
          'grid-template-columns': `repeat(${cappedUsers().length}, 1fr)`,
          'width': `${props.width}rem`,
          [currentTextDirection() !== 'rtl' ? 'margin-left' : 'margin-right']: `${cappedUsers().length * 3}px`,
        }}
      >
        <For each={cappedUsers()}>
          {(user, i) => <div class="=avatar-list-item relative w-0 flex justify-end">
            <Show when={isNotLast(i) || difference() <= 0}
              fallback={<>
                <InitialsAvatar class="= z-2 [&_*]:c-tg_hint!"
                  color={tgBgSecondary.toHexString()}
                  getInitials={() => ['+', String(difference() + 1)]}
                  user={{ title: otherUsersNames() }}
                  small
                  halo
                  noGlare
                />
              </>}
            >
              <InitialsAvatar class="= z-2"
                user={user}
                {...props}
                halo
              />
            </Show>
          </div>}
        </For>
      </div>
    }
  >
    <InitialsAvatar class="= z-2"
      user={props.users[0]}
      {...props}
    />
  </Show>;

  function isNotLast(i: () => number) {
    return i() < cappedUsers().length - 1;
  }
}
