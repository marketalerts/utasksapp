import WebApp from 'tma-dev-sdk';
import { useDirectives } from 'solid-utils/model';
import { get, set } from 'solid-utils/access';
import { createStore } from 'solid-js/store';
import { createEffect, createMemo, createResource, createRoot, createSignal, Match, onCleanup, onMount, Show, Switch, useContext } from 'solid-js';
import type { Signal } from 'solid-js';
import { makePersisted } from '@solid-primitives/storage';

import { isIOS, isMac, isMobile } from 'shared/platform';

import { FullTaskContext } from 'f/task/task.context';
import { ProjectType } from 'f/project/project.adapter';
import { ErrorImg } from 'f/errors/ui/standard-template';

import { NameWithExt } from '../name';
import { ClientTaskFile, getAttrs, getDownloadLink  } from '../adapter';
import type { DisplayableFile } from '../adapter';

import PreviewVideo from './types/video';
import PreviewImage from './types/image';
import PreviewAudio from './types/audio';
import { useSwipeToClose } from './swipeToClose';

import { t } from 'locales/task';

import { BackButton, MainButton } from 'shared/ui/telegram';
import { Loader } from 'shared/ui/loader.ui';
import { DownloadIcon } from 'shared/ui/download';

import Eye from 'icons/Eye.svg';
import Dismiss from 'icons/Dismiss.svg';
import ChevronRight from 'icons/ChevronRightSM.svg';
import Attach from 'icons/Attach.svg';

export interface PreviewControls<Initial = number | undefined> {
  files: Array<DisplayableFile>;
  index: Signal<Initial>;
}

const [downloads, setDownloads] = createRoot(() => createStore<Record<string, File>>({}));

const [downloadProgress, setProgress] = createRoot(() => makePersisted(createStore<Record<string, number>>({}), {
  storage: sessionStorage,
  name: 'download-progress',
}));

export default function PreviewHost(props: PreviewControls) {
  createEffect(() => {
    try {
      if (isFileSelected()) {
        WebApp.disableVerticalSwipes();
      } else {
        WebApp.enableVerticalSwipes();
      }
    } catch {
      /* Most probably unsupported on current client versions */
    }
  });

  return <Show when={props.files.length > 0 && isFileSelected()}>
    <PreviewFiles {...props as PreviewControls<number>} />
  </Show>;

  function isFileSelected() {
    return typeof get(props.index) === 'number';
  }
}

function PreviewFiles(props: PreviewControls<number>) {
  const currentFile = createMemo(() => props.files[get(props.index)]);

  const currentDownloadProgress = () => {
    const current = currentFile();
    const name = current instanceof ClientTaskFile ? current.id : current.name;

    return downloadProgress[name] ?? 0;
  };

  const [file, { refetch }] = createResource(
    () => [props.index[0]()],
    ([index]) => {
      const current = props.files[index];
      const name = current instanceof ClientTaskFile ? current.id : current.name;

      if (current instanceof File) {
        return markAsDownloaded(name, current);
      }

      return downloads[name] ?? current.download(progress => setProgress(old => ({ ...old, [name]: progress })))
        .then((r) => markAsDownloaded(name, r))
        .catch(e => {
          markAsNotDownloaded(name);

          throw e;
        });
    },
    { initialValue: new File([], '') },
  );

  const attrs = createMemo(() => getAttrs(currentFile()));

  const downloadLink = createMemo(() => {
    const f = currentFile();
    if ((isMobile() || isMac() || WebApp.platform === 'macos') && f instanceof ClientTaskFile) {
      return getDownloadLink(f);
    }
    try {
      return URL.createObjectURL(file.latest);
    } catch (error) {
      return f instanceof ClientTaskFile ? getDownloadLink(f) : undefined;
    }
  });

  const task = useContext(FullTaskContext);

  const messageLink = (ignoreRestriction?: boolean) => {
    const file = currentFile();
    const chatId = task?.().project?.chatId;

    if (file instanceof File || (!ignoreRestriction && (
      (chatId && file.chatId !== chatId)
      || task?.().project?.type === ProjectType.Private
      || !task?.().project
    ))) {
      return undefined;
    }

    return file.messageLink;
  };

  onMount(() => {
    document.body.style.overflow = 'hidden';
  });

  onCleanup(() => {
    document.body.style.overflow = '';
  });

  const baseBgOpacity = (isMobile() ? 0.99 : 0.6);
  const bgOpacityDelta = createSignal(0);
  const bgOpacity = () => (baseBgOpacity - Math.min(get(bgOpacityDelta), baseBgOpacity - 0.5));

  const [switchersHidden, hideSwitchers] = createSignal(!isMobile());

  const swipeToCloseDisabled = createSignal(false);

  const { classes, dragComputed, draggable } = useSwipeToClose({
    onClose: progress => {
      set(bgOpacityDelta, progress);

      if (progress === 1) {
        close();
      }
    },
    disabled: () => get(swipeToCloseDisabled) /* || file.type === 'pdf'? */,
  });

  useDirectives(draggable);

  return <>
    <BackButton isVisible={false} />
    <MainButton isVisible={false} />

    <div class="= fixed left-0 top-0 w-full h-full z-1000 flex items-center justify-center">
      <div class="= absolute bg-black w-full h-full" style={{ opacity: bgOpacity() }} onClick={isMobile() ? undefined : close} />
      <div class="= relative flex w-full items-center justify-center"
        classList={{ ...classes(), '[&:hover+.switchers]:opacity-100': !isMobile() }}
        use:draggable={dragComputed()}
      >
        <Show when={!file.loading}
          fallback={
            <Loader class="= scale-300" />
          }
        >
          <Switch fallback={
            <div class="= relative flex gap-6 items-center p-6 rounded-4 overflow-hidden mx-4">
              <div class="= absolute z--1 left-0 bg-tg_bg_secondary w-full h-full opacity-90" />
              <Attach class="= fill-tg_hint scale-300 min-w-5" />
              <div class="= overflow-hidden">
                <p class="= m-0 app-text-title-2 c-tg_button_text ellipsis">{attrs()?.name}</p>
                <p class="= m-0 c-tg_hint">.{attrs()?.ext}</p>
              </div>
            </div>
          }>
            <Match when={file.error}>
              <div class="= flex flex-col items-center max-w-50% text-center gap-2">
                <ErrorImg />
                <p class="= mt--8 c-tg_button_text">{t('task files download-error')}</p>
                <button onClick={refetch} class="= rounded-3 px-3 py-2">
                  {t('task files download-error retry')}
                </button>
                <Show when={messageLink()}>
                  <button onClick={(e) => openMessageLink(e)} class="= rounded-3 px-3 py-2 bg-border-regular flex items-center gap-2">
                    {t('task files download-error message-link')}
                    <Eye class="= fill-tg_button_text" />
                  </button>
                </Show>
              </div>
            </Match>
            <Match when={!file.error && isImage(file.latest)}>
              <PreviewImage alt={file.latest?.name}
                src={downloadLink()}
                onAction={(active) => (hideSwitchers(active), set(swipeToCloseDisabled, active))}
              />
            </Match>
            <Match when={!file.error && isVideo(file.latest)}>
              <PreviewVideo alt={file.latest?.name}
                src={downloadLink()}
                onAction={(active) => (hideSwitchers(active), set(swipeToCloseDisabled, active))}
                loop={file.latest.type.includes('/gif')}
                controls={!file.latest.type.includes('/gif') || isIOS()}
                autoplay={file.latest.type.includes('/gif')}
              />
            </Match>
            <Match when={!file.error && isAudio(file.latest)}>
              <PreviewAudio alt={file.latest?.name}
                src={downloadLink()}
                onAction={(active) => (hideSwitchers(active), set(swipeToCloseDisabled, active))}
              />
            </Match>
          </Switch>
        </Show>

      </div>
      <div class="= switchers flex items-center hover:opacity-100"
        classList={{ 'opacity-0 app-transition-opacity': !isMobile() }}
        style={{ opacity: isMobile() ? switchersHidden() ? 0 : 1 - get(bgOpacityDelta) : undefined }}
      >
        <Show when={get(props.index) > 0}>
          <button class="= absolute bg-transparent left-0 p-4"
            onClick={() => set(props.index, i => i - 1)}
          >
            <ChevronRight class="= fill-tg_button_text scale-300 rotate-180" />
          </button>
        </Show>
        <Show when={get(props.index) < props.files.length - 1}>
          <button class="= absolute bg-transparent right-0 p-4"
            onClick={() => set(props.index, i => i + 1)}
          >
            <ChevronRight class="= fill-tg_button_text scale-300" />
          </button>
        </Show>
      </div>
      <Show when={!isMobile()}
        fallback={
          <>
            <div class="= absolute top-0 flex w-full bg-black-gradient-180" style={{ opacity: 1 - get(bgOpacityDelta) }}>
              <div class="= flex-grow">
                <button class="= bg-transparent p-4" onClick={() => close()}>
                  <Dismiss class="= fill-tg_button_text" />
                </button>
              </div>
              <div class="= flex items-center">
                <Show when={messageLink()}>
                  <a href={messageLink()} onClick={openMessageLink}
                    data-id={file.name + '-message-link'}
                    class="= p-4"
                  >
                    <Eye class="= fill-tg_button_text" />
                  </a>
                </Show>
                <Show when={!file.error}>
                  <a href={downloadLink()}
                    download={file.latest?.name ?? currentFile().name}
                    target="_blank"
                    rel="noopener"
                    class="= p-4"
                    data-id={file.name + '-download-link'}
                    onClick={e => {
                      e.preventDefault();
                      window.open(downloadLink(), '_blank', 'noopener,popup');
                    }}
                  >
                    <DownloadIcon white class="= m--2" />
                  </a>
                </Show>
              </div>
            </div>
            <div class="= absolute bottom-0 flex w-full bg-black-gradient-0 p-4" style={{ opacity: 1 - get(bgOpacityDelta) }}>
              <p class="= m-0 flex-grow overflow-hidden flex items-center c-tg_button_text">
                <NameWithExt file={currentFile()} />
              </p>
              <Show when={currentDownloadProgress() < 100}>
                <div class="= absolute left-0 bottom-0 h-0.5 z-2 bg-tg_button" style={{ width: currentDownloadProgress() + '%' }} />
              </Show>
            </div>
          </>
        }
      >
        <div class="= absolute top-0 flex w-full justify-end bg-black-gradient-180">
          <div class="= flex-grow px-4 py-3">
            <p class="=file-limit-counter m-0 c-tg_button_text"
              classList={{ 'opacity-0': props.files.length < 2 }}
            >{get(props.index) + 1}/{props.files.length}</p>
          </div>
          <button class="= bg-transparent px-4 py-3" onClick={() => close()}>
            <Dismiss class="= fill-tg_button_text" />
          </button>
        </div>
        <div class="= absolute bottom-0 w-full bg-black-gradient-0">
          <div class="= flex relative z-2">
            <div class="= flex-grow overflow-hidden flex items-center px-4 c-tg_button_text">
              <NameWithExt file={currentFile()} />
            </div>
            <Show when={messageLink()}>
              <a href={messageLink()} onClick={openMessageLink}
                data-id={file.name + '-message-link'}
                class="=file-message-link p-4 hover:bg-border-regular"
              >
                <Eye class="= fill-tg_button_text" />
              </a>
            </Show>
            <Show when={!file.loading && !file.error}
              fallback={
                <p class="= m-0 p-4 hover:bg-border-regular [&_*]:filter-grayscale-100">
                  <DownloadIcon class="= scale-120 m--2" />
                </p>
              }
            >
              <a href={downloadLink()} download={file.latest?.name ?? currentFile().name} target="_blank"
                class="=file-download-link p-4 hover:bg-border-regular cursor-pointer"
                data-id={file.name + '-download-link'}
                onClick={e => {
                  if (WebApp.platform !== 'macos') {
                    return;
                  }

                  e.preventDefault();
                  window.open(downloadLink(), '_blank', 'noopener,popup');
                }}
              >
                <DownloadIcon class="= scale-120 m--2" />
              </a>
            </Show>
          </div>
          <Show when={currentDownloadProgress() < 100}>
            <div class="= absolute left-0 bottom-0 h-1 z-1 bg-tg_button" style={{ width: currentDownloadProgress() + '%' }} />
          </Show>
        </div>
      </Show>
    </div>
  </>;

  function openMessageLink(e: Event) {
    e.preventDefault();
    const link = messageLink();

    if (link) {
      WebApp.openTelegramLink(link);
    } else {
      WebApp.showPopup({ message: 'Unable to open chat' });
    }
  }

  function close(): void {
    set(props.index, undefined);
  }

  function markAsDownloaded(i: string, r: File) {
    setProgress(old => ({ ...old, [i]: 100 }));
    setDownloads(old => ({ ...old, [i]: r }));

    return r;
  }

  function markAsNotDownloaded(i: string) {
    setProgress(old => ({ ...old, [i]: 0 }));
    setDownloads(old => ({ ...old, [i]: undefined }));
  }

  function isImage(file?: File) {
    return !!file?.type.startsWith('image/') && !file.type.includes('/gif');
  }

  function isSticker(file?: File) {
    return !!file?.type.startsWith('application/octet-stream') && file.name.endsWith('.tgs');
  }

  function isVideo(file?: File) {
    return !!file?.type.startsWith('video/') || file?.type.includes('/gif');
  }

  function isAudio(file?: File) {
    return !!file?.type.startsWith('audio/');
  }
}