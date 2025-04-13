import WebApp from 'tma-dev-sdk';
import { model, useDirectives } from 'solid-utils/model';
import { get, set } from 'solid-utils/access';
import { createMemo, useContext, Show, getOwner, runWithOwner, createSignal, createRenderEffect, createResource, For } from 'solid-js';
import { useNavigate } from '@solidjs/router';

import { appendFormFiles, clearFormFiles } from 'f/task/editor.ui/files';
import { getTimezone } from 'f/settings/timezone';
import { ProfileContext } from 'f/profile/profile.context';
import { GroupTreeContext } from 'f/group/list.context';
import { deleteArea, deleteAreaPic, updateAreaPic } from 'f/group/area.network';
import { DynamicSettingsContext } from 'f/dynamic-settings/context';
import { SupportedSettings } from 'f/dynamic-settings/adapter';
import type { ClientDynamicSetting } from 'f/dynamic-settings/adapter';

import { ClientItemViewMode } from './view-mode.adapter';
import { requestUsersUpdate } from './users.network';
import { createUsersResource, UsersContext } from './users.context';
import { deleteProject, deleteProjectPic, updateProjectPic } from './project.network';
import { getProjectDataFromHref, ProjectContext } from './project.context';
import { ClientItem, isArea, ProjectType } from './project.adapter';

import { t as tTask } from 'locales/task';
import { t } from './locales';

import { BackButton, MainButton } from 'shared/ui/telegram';
import ProBadge from 'shared/ui/pro-badge';
import { Loader } from 'shared/ui/loader.ui';
import List from 'shared/ui/list';
import { InitialsAvatar } from 'shared/ui/initials-avatar';
import Popup from 'shared/ui/floater';

import { ItemIcon } from 'f/group/explorer-item.ui';

import ViewModeSwitcher from './view-mode-switcher.ui';

import AreaIcon from 'icons/30/Areas.svg';
import Trash from 'icons/24/Trash bin.svg';
import Slider from 'icons/24/Slider Filled.svg';
import More from 'icons/24/More Horizontal Outlined.svg';
import Gear from 'icons/24/Gear Filled.svg';

export default function ProjectDetails(props: {
  onTitleUpdate?(newTitle: string): void;
}) {
  useDirectives(model);

  const hrefProject = createMemo(getProjectDataFromHref());

  const [project, { refetch: updateProject }] = useContext(ProjectContext);
  const [profile] = useContext(ProfileContext);
  const projectTitle = createSignal(project.latest.name || hrefProject().name);

  createRenderEffect(() => {
    if (project.latest.name) {
      set(projectTitle, project.latest.name);
    }
  });

  const [users, { refetch }] = initUsersContext();

  const [usersUpdating, setUsersUpdating] = createSignal(false);
  const [isPicDirty, setPicDirty] = createSignal<string>();
  const [isPicUpdating, setPicUpdating] = createSignal(false);
  const [picProgress, setPicProgress] = createSignal<number>();

  const updateUsers = () => {
    setUsersUpdating(true);

    requestUsersUpdate(hrefProject().id)
      .then(() => refetch())
      .finally(() => setUsersUpdating(false));
  };

  const update = () => {
    if (get(projectTitle) && get(projectTitle) !== project.latest.name) {
      props.onTitleUpdate?.(get(projectTitle));
    }

    if (formData.getAll('logo').length > 0) {
      setPicUpdating(true);

      if (isArea(project.latest)) {
        updateAreaPic(hrefProject().id, formData, setPicProgress)
          .finally(async () => {
            await updateProject();
            setPicUpdating(false);
            setPicDirty(old => {
              old && URL.revokeObjectURL(old);
              return undefined;
            });
          });
        return;
      }

      updateProjectPic(hrefProject().id, formData, setPicProgress)
        .finally(async () => {
          await updateProject();
          setPicUpdating(false);
          setPicDirty(old => {
            old && URL.revokeObjectURL(old);
            return undefined;
          });
        });
    } else if (isPicDirty() === '') {
      if (isArea(project.latest)) {
        deleteAreaPic(hrefProject().id)
          .then(async () => {
            await updateProject();
            setPicDirty();
          });
        return;
      }
      deleteProjectPic(hrefProject().id)
        .then(async () => {
          await updateProject();
          setPicDirty();
        });
    }
  };

  const maxSize = 10485760;
  const formData = new FormData();

  const [publicProjectTabs] = createResource(() => [users().length], ([usersAmount]) => [
    new ClientItemViewMode({
      code: 'users',
      count: usersAmount,
      name: t('members literal', { members: [usersAmount] }),
    }),
    new ClientItemViewMode({
      code: 'users',
      count: 0,
      name: t('journal'),
      disabled: true,
    }),
    new ClientItemViewMode({
      code: 'users',
      count: 0,
      name: t('files'),
      disabled: true,
    }),
  ]);

  return <>
    <main class="= flex flex-col p-4 gap-4">
      <div class="= flex flex-col items-center gap-2 pt-4 pb-1">
        <Show when={project.latest.icon || !isArea(project.latest) || isPicDirty()} fallback={<AreaIcon class="scale-350 my-10.75" />}>
          <ItemIcon big
            url={isPicDirty() === '' ? undefined : (isPicDirty() || project.latest.icon)}
            type={project.latest.type || hrefProject().type}
            fallback={project.latest.name || hrefProject().name}
            id={project.latest.id || hrefProject().id}
          />
        </Show>

        <div class="= text-center overflow-hidden max-w-80%">
          <h1 class="=project-details-title m-0 text-[28px] line-height-[28px] font-590 letter-spacing-[1.4%] max-w-full">
            {get(projectTitle) !== project.latest.name ? get(projectTitle) : (project.latest.name || hrefProject().name)}
          </h1>
        </div>
        <Show when={project.latest.type === ProjectType.Public}>
          <ProjectSettingsSummary project={project.latest} />
        </Show>
      </div>

      <div class="grid gap-2 grid-cols-3">
        <Show when={project.latest.type === ProjectType.Public}
          fallback={
            <a aria-disabled data-id="project-link"
              class="h-15 bg-section rounded-3 flex flex-col gap-1 items-center justify-center"
            >
              <Gear class="ui-icon-tertiary scale-116.6667" />
              <span class="c-app-text-tertiary app-text-body-s/medium">
                {t('details links', 'settings')}
              </span>
            </a>
          }
        >
          <a href={'details/' + 'settings'} data-id="project-link"
            class="h-15 bg-section rounded-3 flex flex-col gap-1 items-center justify-center"
          >
            <Gear class="ui-icon-accented scale-116.6667" />
            <span class="c-app-text-accented app-text-body-s/medium">
              {t('details links', 'settings')}
            </span>
          </a>
        </Show>
        <a aria-disabled data-id="project-link"
          class="h-15 bg-section rounded-3 flex flex-col gap-1 items-center justify-center"
        >
          <Slider class="ui-icon-tertiary scale-116.6667" />
          <span class="c-app-text-tertiary app-text-body-s/medium">
            {t('details links', 'filters')}
          </span>
        </a>
        <Popup placement="bottom-end">{{
          opener: (attrs, open) =>
            <button data-id="project-link" onClick={open}
              class="h-15 bg-section rounded-3 flex flex-col gap-1 items-center justify-center"
              {...attrs}
            >
              <More class="ui-icon-accented scale-116.6667" />
              <span class="c-app-text-accented app-text-body-s/medium">
                {t('details links', 'other')}
              </span>
            </button>,
          floater: (attrs, close) =>
            <div class="bg-section rounded-3 min-w-40 shadow-2xl z-1001 mt-2" {...attrs}>
              <List refactor>
                <List.Item onClick={deleteProjectOnClick(project.latest.id, project.latest.type)}
                  left={<Trash class="ui-icon-negative" />}
                >
                  {isArea(project.latest) ? t('delete area button-text') : t('delete button-text')}
                </List.Item>
              </List>
            </div>,
        }}
        </Popup>
      </div>

      <Show when={project.latest.type === ProjectType.Public}>
        <div class="= flex flex-col gap-2">
          <div class="relative bg-app-section mx--4">
            <div class="px-4 sticky top-0 b-b-solid b-b-1 b-b-border-regular bg-section z-10">
              <ViewModeSwitcher
                model={/* @once */createSignal(0)}
                viewModes={publicProjectTabs}
              />
            </div>

            <List each={users()} refactor class="b-t-solid b-t-1 b-t-border-regular rounded-0 w-full">
              {(user) =>
                <List.Item rightClass="h-15!"
                  right={<>
                    <span class="c-tg_hint app-text-footnote text-ellipsis whitespace-nowrap overflow-hidden mx-2">
                      {t('members status', user.status)}
                    </span>
                  </>}
                  left={<InitialsAvatar user={user} />}
                >
                  <div class="= flex flex-col">
                    <span class="=member-title app-text-body-regular">{user.title}</span>
                    <Show when={user.userName}>
                      <span class="=member-username app-text-subheadline c-tg_hint">@{user.userName}</span>
                    </Show>
                  </div>
                </List.Item>
              }
            </List>
          </div>
        </div>
      </Show>

      <Show when={project.latest.type === ProjectType.Private}>
        <BackButton isVisible={!isPicUpdating()} />
        <MainButton isVisible={isPicDirty() !== undefined || get(projectTitle) !== project.latest.name}
          showProgress={isPicUpdating() || project.loading}
          disabled={isPicUpdating() || project.loading}
          text={t('save changes')}
          onClick={update}
        />

        <div class="= flex flex-col gap-2">
          <p class="= app-text-footnote uppercase c-tg_hint m-0">
            {t('rename text')}
          </p>
          <List refactor>
            <List.Item right={<></>} rightHint={<></>}>
              <input class="=project-title-input w-full p-0"
                type="text"
                placeholder={t('rename text-placeholder')}
                use:model={projectTitle}
                maxlength={128}
              />
            </List.Item>
          </List>
        </div>
        <div class="= flex flex-col gap-2">
          <p class="= app-text-footnote uppercase c-tg_hint m-0">
            {t('avatar section')}
          </p>
          <List refactor>
            <List.Item disabled={!profile.latest.isPro}
              right={!profile.latest.isPro ? <span/> : undefined}
              rightHint={!profile.latest.isPro ? <ProBadge /> : undefined}
            >
              <span>{t(project.latest.icon ? 'update avatar' : 'upload avatar')}</span>
              <Show when={profile.latest.isPro}>
                <input type="file" name="files" id="project-pic" accept="image/*"
                  onLoad={undefined/* TODO: check that file is loading correctly */}
                  onChange={e => (setFiles(Array.from(e.target.files ?? [])), e.target.value = '')}
                  class="= absolute w-full h-full top-0 left-0 cursor-pointer [::-webkit-file-upload-button]:hidden opacity-0 z-2"
                  disabled={isPicUpdating()}
                />
              </Show>
            </List.Item>

            <List.Item rightHint={<></>} disabled={!project.latest.icon}
              onClick={() => deleteAvatar()}
            >
              {t('delete avatar')}
            </List.Item>
          </List>
        </div>

        <div class="= absolute left-0 bottom-0 h-0.5 bg-tg_button" style={{ width: picProgress() + '%' }} />
      </Show>

      <Show when={isArea(project.latest)}>
        <BackButton isVisible={!isPicUpdating()} />
        <MainButton isVisible={isPicDirty() !== undefined || get(projectTitle) !== project.latest.name}
          showProgress={isPicUpdating() || project.loading}
          disabled={isPicUpdating() || project.loading}
          text={t('save changes')}
          onClick={update}
        />

        <div class="= flex flex-col gap-2">
          <p class="= app-text-footnote uppercase c-tg_hint m-0">
            {t('rename area text')}
          </p>
          <List refactor>
            <List.Item right={<></>} rightHint={<></>}>
              <input class="=area-title-input w-full p-0"
                type="text"
                placeholder={t('rename text-placeholder')}
                use:model={projectTitle}
                maxlength={128}
              />
            </List.Item>
          </List>
        </div>
        <div class="= flex flex-col gap-2">
          <p class="= app-text-footnote uppercase c-tg_hint m-0">
            {t('avatar area section')}
          </p>
          <List refactor>
            <List.Item disabled={!profile.latest.isPro}
              right={!profile.latest.isPro ? <span/> : undefined}
              rightHint={!profile.latest.isPro ? <ProBadge /> : undefined}
            >
              <span>{t(project.latest.icon ? 'update avatar' : 'upload avatar')}</span>
              <Show when={profile.latest.isPro}>
                <input type="file" name="files" id="project-pic" accept="image/*"
                  onLoad={undefined/* TODO: check that file is loading correctly */}
                  onChange={e => (setFiles(Array.from(e.target.files ?? [])), e.target.value = '')}
                  class="= absolute w-full h-full top-0 left-0 cursor-pointer [::-webkit-file-upload-button]:hidden opacity-0 z-2"
                  disabled={isPicUpdating()}
                />
              </Show>
            </List.Item>

            <List.Item rightHint={<></>} disabled={!project.latest.icon}
              onClick={() => deleteAvatar()}
            >
              {t('delete avatar')}
            </List.Item>
          </List>
        </div>
      </Show>
{/*
      <button onClick={deleteProjectOnClick(project.latest.id, project.latest.type)}
        class="=project-delete-button mt-4 text-center w-full p-4 bg-transparent c-urgent font-700 app-text-headline opacity-90"
      >
        {isArea(project.latest) ? t('delete area button-text') : t('delete button-text')}
      </button> */}
    </main>
  </>;

  function initUsersContext() {
    return useContext(UsersContext) ?? (() => {
      return createUsersResource(
        () => hrefProject().id,
      );
    })();
  }

  function deleteAvatar() {
    formData.delete('logo');
    setPicDirty('');
  }

  function setFiles(newFiles: File[]): void {
    if (isPicUpdating()) {
      return;
    }

    newFiles = validateFiles(newFiles);

    clearFormFiles(formData);

    if (!newFiles || newFiles.length === 0) {
      return;
    }

    appendFormFiles(newFiles, formData, 'logo');
    setPicDirty(URL.createObjectURL(newFiles[0]));
  }

  function validateFiles(files: File[], limit?: number) {
    const { valid, invalidSize } = splitInvalidFiles(files, limit);

    const title = tTask('task files invalid-title');
    const messages: string[] = [];

    if (invalidSize.length > 0) {
      const limitMB = (maxSize ?? 0) / 1024 / 1024;
      messages.push(tTask('task files invalid-size', {
        'task files invalid-size amount': [invalidSize.length],
        'task files invalid-size limit': [limitMB],
      }));
    }

    const message =
      messages.join(tTask('task files invalid-conjunction'))
      + (messages.length > 0 ? tTask('task files invalid-conjunction-2') : '')
      + tTask('task files valid-conclusion', {
        'task files valid-amount': [valid.length],
      });

    if (messages.length === 0) {
      return valid;
    }

    if (WebApp.platform === 'unknown') {
      alert(message);
    } else {
      WebApp.showPopup({
        title,
        message,
      });
    }

    return valid;
  }

  interface FilesValidation {
    invalidSize: File[];
    invalidAmount: File[];
    valid: File[];
  }

  function splitInvalidFiles(files: File[], limit?: number): FilesValidation {
    limit = limit ?? 1;

    if (!maxSize) {
      return limit ? splitByLimit(files, limit) : {
        invalidAmount: [],
        invalidSize: [],
        valid: files,
      };
    }

    if (!limit) {
      return splitBySize(files, maxSize);
    }

    const bySize = splitBySize(files, maxSize);
    const byLimitAndSize = splitByLimit(bySize.valid, limit);

    return {
      valid: byLimitAndSize.valid,
      invalidAmount: byLimitAndSize.invalidAmount,
      invalidSize: bySize.invalidSize,
    };
  }

  function splitByLimit(files: File[], limit: number | undefined): FilesValidation {
    return {
      invalidSize: [],
      invalidAmount: files.slice(limit),
      valid: files.slice(0, limit),
    };
  }

  function splitBySize(files: File[], maxSize: number): FilesValidation {
    return files.reduce<FilesValidation>((list, file) => {
      if (file.size >= maxSize) {
        return {
          ...list,
          invalidSize: list.invalidSize.concat([file]),
        };
      }

      return {
        ...list,
        valid: list.valid.concat([file]),
      };
    }, {
      valid: [],
      invalidSize: [],
      invalidAmount: [],
    });
  }
}

function ProjectSettingsSummary(props: { project: ClientItem }) {
  if (isArea(props.project)) {
    return '';
  }

  const [settings] = useContext(DynamicSettingsContext) ?? [];

  const lang = () => (
    settings?.latest
      .find((s): s is ClientDynamicSetting<SupportedSettings.Language> => s.type === SupportedSettings.Language)
      ?.finalValue
  );

  const timezone = () => {
    const timeZone = settings?.latest
      .find((s): s is ClientDynamicSetting<SupportedSettings.Timezone> => s.type === SupportedSettings.Timezone)
      ?.finalValue
      ?.timeZone;

    if (!timeZone) {
      return undefined;
    }

    return getTimezone(timeZone).offsetName;
  };

  const line = createMemo(() => {
    const language = lang()
      ?.replace('_', '-');

    const offset = timezone()
      ?.replace(/:00$/, '');

    if (!language && !offset) {
      return '';
    }

    if (!language) {
      return offset;
    }

    if (!offset) {
      return language;
    }

    return `${language} • GMT${offset}`;
  });

  return <>
    <p class="=project-settings-summary m-0 c-tg_hint uppercase app-text-body-l-stable">{line()}</p>
  </>;
}

export function deleteProjectOnClick(projectId: string, projectType?: ProjectType) {
  const owner = getOwner();

  return () => runWithOwner(owner, () => {
    const id = projectId;

    if (!id) {
      return;
    }

    const navigate = useNavigate();
    const [, groups] = useContext(GroupTreeContext) ?? [];

    if (projectType === ProjectType.Private) {
      WebApp.showConfirm(t('delete confirm'), (confirmed) => {
        if (!id || !confirmed) {
          return;
        }

        deleteProject(id)
          .then(() => {
            groups?.refetch();
            navigate('/');
          })
          .catch(() => WebApp.showAlert(t('delete error')));
      });

      return;
    }

    if (isArea({ id })) {
      WebApp.showConfirm(t('delete area confirm'), (confirmed) => {
        if (!id || !confirmed) {
          return;
        }

        deleteArea(id)
          .then(() => {
            groups?.refetch();
            navigate('/');
          })
          .catch(() => WebApp.showAlert(t('delete error')));
      });

      return;
    }

    deleteProject(id)
      .then(() => WebApp.showAlert(t('delete public'), () => {
        groups?.refetch();
        navigate('/');
      }))
      .catch(() => WebApp.showAlert(t('delete error')));
  });
}