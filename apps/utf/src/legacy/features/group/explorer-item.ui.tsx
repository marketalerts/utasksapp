import { Dynamic } from 'solid-js/web';
import { Match, Show, Switch, createMemo, createSignal, useContext } from 'solid-js';
import type { JSX, ParentProps } from 'solid-js';
import { assoc } from 'rambda';
import { A } from '@solidjs/router';

import { defaultProject } from 'f/project/project.context';
import { isArea } from 'f/project/project.adapter';
import { ProfileContext } from 'f/profile/profile.context';
import { Permissions } from 'f/profile/profile.adapter';

import { ItemType } from './project.adapter';
import type { ClientItem } from './project.adapter';
import { SelectedProject } from './explorer.context';
import { GroupsExplorerMode, isLinks } from './explorer-mode';
import type { ModeOptions } from './explorer-mode';

import { t } from 'locales/group';

import ProBadge from 'shared/ui/pro-badge';
import ListArrow from 'shared/ui/list-arrow';
import { InitialsAvatar } from 'shared/ui/initials-avatar';

import Today from './date-icon.ui';

import Tomorrow from 'icons/list/Tomorrow.svg';
import PremiumStar from 'icons/list/Pro.svg';
import Next7Days from 'icons/list/Next.svg';
import Inbox from 'icons/list/Inbox.svg';
import Completed from 'icons/list/Completed.svg';
import All from 'icons/list/All.svg';
import Area from 'icons/Stack.svg';
import GroupProModal from 'icons/GroupProModal.svg';
import GroupPro from 'icons/GroupPro.svg';
import Group from 'icons/Group.svg';
import Star from 'i/Star.svg';


export interface ItemProps extends ParentProps, Partial<ModeOptions> {
  item: ClientItem;
  wrapText?: boolean;
  ref?: (el: HTMLLIElement) => void;
}

export default function Item(props: ItemProps) {
  const { mode = GroupsExplorerMode.Links } = props;
  const getSelectedProject = useContext(SelectedProject);

  const [profile] = useContext(ProfileContext);

  const isDisabled = () => (!profile.latest.canUse(
    props.item.type === ItemType.Private
      ? Permissions.PrivateProjectTaskCount
      : Permissions.PublicProjectTaskCount,
    true,
    props.item.count,
  ) || (
    props.item.type === ItemType.Public
    && !props.item.used
    && !profile.latest.canUse(Permissions.PublicProjectLimit)
  ))
    && !isLinks(mode);

  const showProGroup = () => (
    props.item.used && profile.latest?.isFree
  );

  const isItemSelected = () => (
    getSelectedProject?.()?.id === props.item.id
    || (
      // Always select default project in options mode
      props.item.id === defaultProject.id
      && getSelectedProject?.()?.id === undefined
      && mode === GroupsExplorerMode.Options
    )
  );

  return <div class="=explorer-item w-full h-full rounded-3" data-id={`${props.item?.id}-item`}
    classList={{
      '=explorer-item-selected bg-tg_button': isItemSelected() && !isDisabled(),
      '= [&:hover>.select-bg]:bg-tg_button': !!getSelectedProject && !isDisabled(),
      'bg-tg_bg_secondary': isDisabled(),
    }}
  >
    <Show when={getSelectedProject}>
      <div class="= select-bg absolute rounded-2 w-full h-90% top-5% pointer-events-none z--1 opacity-50"></div>
    </Show>
    <Dynamic component={getComponent()} {...props}>
      <div class="= flex">
        <ItemIcon fallback={props.item.name} name={props.item.icon} url={props.item.icon} type={props.item.type} id={props.item.id} />
      </div>
      <div data-title class="
        flex-grow inline-flex justify-between items-center ltr:ml-4 rtl:mr-4 ltr:pr-2 rtl:pl-2 py-[10px] overflow-hidden
      ">
        <div text-handle class="= inline-flex flex-grow max-w-full flex-col gap-1 overflow-hidden app-transition-padding-right-100">
          <p class="= app-text-body-l/regular w-full m-0"
            classList={{
              // 'app-text-subheadline': props.bold,
              'c-tg_button_text': isItemSelected(),
              'mr-2': !isLinks(mode),
              'c-tg_hint!': isDisabled() || props.item.href?.includes('://'),
              'overflow-hidden whitespace-nowrap text-ellipsis': !props.wrapText,
            }}
            data-id={`${props.item.id}-name`}
          >
            {props.item.name || t('group-name', props.item.id)}
          </p>
          <Show when={props.item.description && isLinks(mode) && props.item.type === ItemType.Dynamic}>
            <p class="= app-text-body-m/regular m-0 c-tg_hint">{props.item.description}</p>
          </Show>
        </div>

        <Show when={!props.children} fallback={props.children}>
          <ItemRightSlot disabled={isDisabled()} showProGroup={showProGroup()} {...props} />
        </Show>
      </div>
    </Dynamic>
  </div>;

  function getComponent() {
    if (isLinks(mode)) {
      return ItemLink;
    }

    if (isDisabled()) {
      return (props: ItemProps) => <ItemButton {...assoc('onItemClick', undefined, props)} />;
    }

    return ItemButton;
  }
}

export interface ItemIconProps {
  fallback: JSX.Element;
  id?: string;
  name?: string;
  url?: string;
  small?: boolean;
  big?: boolean;
  type?: ItemType;
}

export function ItemIcon(props: ItemIconProps) {
  const title = typeof props.fallback === 'string' ? props.fallback : '';

  const FallbackIcon = () => typeof props.fallback === 'string' ? (
    <InitialsAvatar small={props.small} big={props.big}
      user={{ title: title, userName: props.id ?? title, avatar: props.url }}
      square={isArea({ id: props.id ?? '' })}
    />
  ) : props.fallback;

  // TODO: refactor to dynamic import?
  const getIcon = (name?: string) => {
    switch (name) {
      case 'g_all':
      case 'all': return All;

      case 'g_inc':
      case 'incoming': return Inbox;

      case 'g_next7':
      case 'next-7-days': return Next7Days;

      case 'g_tod':
      case 'today': return Today;

      case 'g_tom':
      case 'tomorrow': return Tomorrow;

      case 'g_compl':
      case 'completed': return Completed;

      case 'star': return Star;
      case 'premium-star': return PremiumStar;

      default:
        if (isArea({ id: name ?? '' })) {
          return props.url ? FallbackIcon : () => <Area class="= fill-tg_hint" />;
        } else switch (props.type) {
          case ItemType.Dynamic:
            return Inbox;

          default:
            return FallbackIcon;
        }
    }
  };

  const Icon = createMemo(() => getIcon(props.id));

  const enum ImgStatus {
    LOADING = 'loading',
    GOOD = 'good',
    BAD = 'bad'
  }

  const [getImgStatus, setImgStatus] = createSignal(ImgStatus.LOADING);

  const isImgBad = () => getImgStatus() === ImgStatus.BAD;
  const isImgLoading = () => getImgStatus() === ImgStatus.LOADING;

  return <Show when={Icon() !== FallbackIcon} fallback={<FallbackIcon />}>
    <div data-id={`${props.id}-pic`}
      class="=explorer-item-avatar relative inline-block min-w-[30px] max-w-[30px] min-h-[30px] max-h-[30px] rounded-1.5 overflow-hidden"
    >
      <Show when={!props.url || isImgBad() || isImgLoading()}>
        <Dynamic component={getIcon(props.name)} class="= max-w-[30px]" />
      </Show>
      <Show when={props.url && !isImgBad()}>
        <img src={props.url} alt="Avatar" class="= absolute rounded-full"
          classList={{ 'w-9 h-9': props.url?.includes('utb') && !props.big }}
          onError={() => setImgStatus(ImgStatus.BAD)}
          onLoad={() => setImgStatus(ImgStatus.GOOD)}
          style="object-fit:cover"
        />
      </Show>
    </div>
  </Show>;
}

const ItemLink = (props: ItemProps) => props.item.href ? (
  <A href={props.item.href} data-id={`${props.item.id}-link`}
    state={{ name: props.item.name, description: props.item.description }}
    class="=explorer-item-link flex ltr:pl-4 rtl:pr-4 items-center"
  >{props.children}</A>
) : <ItemButton {...props} />;

const ItemButton = (props: ItemProps) => {
  return <div role="button" data-id={`${props.item?.id}-item`}
    onClick={() => props.onItemClick?.(props.item)}
    class="=explorer-item-button flex ltr:pl-4 rtl:pr-4 items-center"
    classList={{ 'cursor-pointer': !!props.onItemClick, 'cursor-not-allowed!': !props.onItemClick }}
  >
    {props.children}
  </div>;
};

function ItemRightSlot(props: ItemProps & { disabled?: boolean; showProGroup?: boolean; }) {
  const getSelectedProject = useContext(SelectedProject);

  const isItemSelected = () => (
    getSelectedProject?.()?.id === props.item.id
    || (
      // Always select default project in options mode
      props.item.id === defaultProject.id
      && getSelectedProject?.()?.id === undefined
      && props.mode === GroupsExplorerMode.Options
    )
  );

  return <div class="=explorer-item-right-slot flex gap-1 items-center c-tg_hint self-center h-6 text-center">
    <Show when={props.item.urgent}>
      <span class="= bg-urgent c-tg_button_text app-text-body-m/regular line-height-[1.45rem] text-center rounded-4.5 h-6 min-w-6 ltr:pl-1.9 rtl:pr-1.9 ltr:pr-2.1 rtl:pl-2.1">
        {props.item.urgent}
      </span>
    </Show>
    <Show when={typeof props.item.count === 'number' && props.item.type === ItemType.Dynamic} fallback={
      <>
        <Show when={props.item.type === ItemType.Public}>
          <Switch fallback={
            <div class="= flex gap-2">
              <Group class="= self-center fill-tg_hint opacity-70"
                classList={{
                  'fill-tg_button_text!': isItemSelected(),
                }}
              />
              <ProBadge when={props.disabled} class="ltr:mr-2 rtl:ml-2" />
            </div>
          }>
            <Match when={props.showProGroup && !props.disabled}>
              <Show when={isLinks(props.mode ?? GroupsExplorerMode.Links)}
                fallback={
                  <Show when={!isItemSelected()} fallback={<Group class="= self-center fill-tg_button_text!" />}>
                    <GroupProModal class="= self-center" />
                  </Show>
                }
              >
                <GroupPro class="= self-center" />
              </Show>
            </Match>
          </Switch>
        </Show>
        <Show when={!props.disabled}>
          <ListArrow
            classList={{
              'fill-tg_button_text!': isItemSelected(),
            }}
          />
        </Show>
      </>
    }>
      <span class="=explorer-item-count min-w-6.5 text-center app-text-subheadline ltr:mr--1 rtl:ml--1"
        classList={{ 'c-tg_text': !isLinks(props.mode ?? GroupsExplorerMode.Links) }}
      >
        {props.item.count}
      </span>
      <ListArrow
        classList={{
          'fill-tg_button_text!': isItemSelected(),
        }}
      />
    </Show>
  </div>;
}
