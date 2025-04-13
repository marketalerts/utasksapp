import WebApp from 'tma-dev-sdk';
import { createHistorySignal } from 'solid-utils/history';
import type { HistorySignal } from 'solid-utils/history';
import { get, set } from 'solid-utils/access';
import { For, Show, children, createEffect, createMemo, createRenderEffect, createSignal, mergeProps, on, untrack, useContext } from 'solid-js';
import type { ComponentProps, ParentProps, Signal } from 'solid-js';
import { omit } from 'rambda';

import { isAndroid, isMobile } from 'shared/platform';

import { ProfileContext } from 'f/profile/profile.context';

import { NameWithExt } from '../files/name';
import { ClientTaskFile } from '../files/adapter';
import type { DisplayableFile } from '../files/adapter';

import { t } from 'locales/task';

import { waterfall } from 'ui/composables/use-waterfall';
import { Loader } from 'shared/ui/loader.ui';
import ListArrow from 'shared/ui/list-arrow';
import List from 'shared/ui/list';
import { DownloadIcon } from 'shared/ui/download';

import Dismiss from 'icons/DismissSM.svg';
import Attach from 'icons/Attach.svg';

export const formFieldName = 'files';

export const getFormFiles = (form: FormData) => form.getAll(formFieldName) as File[];
export const appendFormFile = (file: File, form: FormData) => form.append(formFieldName, file);
export const clearFormFiles = (form: FormData) => form.delete(formFieldName);
export const deleteFormFile = (file: File, form: FormData) => {
  const prevFiles = getFormFiles(form);
  clearFormFiles(form);
  appendFormFiles(
    prevFiles.filter(f => f !== file),
    form,
  );
};

export const appendFormFiles = (files: File[], form: FormData, key?: string) => {
  files.forEach(file => form.append(key ?? formFieldName, file));
};

export function FilesList(_props: ParentProps<{
  ref?: ComponentProps<'div'>['ref'];
  simple?: boolean;
  files?: HistorySignal<ClientTaskFile[]>;
  disabled?: boolean;
  formData: FormData;
  limit?: number;
  maxSize?: number;
  onDisabled?: VoidFunction;
  uploadProgress?: WeakMap<File, Signal<number | undefined>>;
  onRemoveFile?: (file: DisplayableFile) => void;
  openPreview?: (file: number) => void;
}>) {
  const props = mergeProps({ files: createHistorySignal<ClientTaskFile[]>([]) }, _props);

  const [profile] = useContext(ProfileContext);

  const isOpen = createSignal(false);
  const noFilesTitle = createMemo(() => [t('task no files')]);
  const filesTitle = createMemo(() => [t('task files')]);

  const formFiles = createSignal<File[]>([]);
  const files = createMemo(() => [...get(props.files), ...get(formFiles)]);
  const hasFiles = () => files().length;

  const listHeight = createSignal(0);

  createEffect(on(isOpen[0], () => {
    WebApp.HapticFeedback.selectionChanged();
  }, { defer: true }));

  createEffect(on([isOpen[0], formFiles[0]], () => requestAnimationFrame(() => {
    const fileList = document.getElementById('file-list');

    const scrollHeight = fileList?.scrollHeight;

    if (!scrollHeight) {
      return;
    }

    set(listHeight, scrollHeight + 64);
  })));

  createEffect(() => {
    if (getFormFiles(props.formData).length === 0) {
      set(formFiles, []);
    }
  });

  const resolved = children(() => isDisabled() ? props.children : undefined);

  const getMaxMB = () => (props.maxSize ?? 0) / 1024 / 1024;

  return <Show when={!props.simple}
    fallback={
      <div class="= relative flex items-center gap-1" >
        <Attach class="ui-icon-tertiary" classList={{ 'fill-tg_button!': files().length > 0 }} />

        <Show when={files().length}>
          <p class="= m-0 app-text-caption-regular rounded-2 p-1 px-1.5 bg-tg_bg_secondary c-tg_text">
            {files().length}
          </p>
        </Show>

        <input type="file" name="file" id="file" multiple={!isAndroid()}
          onLoad={undefined/* TODO: check that file is loading correctly */}
          onChange={e => (setFiles(Array.from(e.target.files ?? [])), e.target.value = '')}
          class="= absolute w-full h-full top-0 left-0 cursor-pointer [::-webkit-file-upload-button]:hidden opacity-0 z-2"
          disabled={isDisabled()}
        />
      </div>
    }
  >
    <div >
      <Show when={hasFiles()}
        fallback={
          <div class="= relative">
            <List refactor type="div" each={noFilesTitle()}>
              {text => <List.Item
                semantic={false}
                class="= max-h-11 overflow-hidden app-transition-max-height"
                left={
                  <Attach class="ui-icon-tertiary ml-0.5" classList={{ 'fill-tg_button!': props.files.canUndo() }} />
                }
                right={
                  isDisabled()
                  ? <div class="= ltr:mr-2 rtl:ml-2 flex items-center">{props.children}</div>
                  : undefined
                }
                rightHint={<SizeLimit />}
              >
                <p class="app-text-subheadline flex-grow ltr:text-left rtl:text-right m-0"
                  classList={{ 'c-text-tertiary': isDisabled() }}
                >
                  {text}
                </p>
              </List.Item>}
            </List>

            <input type="file" name="file" id="file" multiple
              onLoad={undefined/* TODO: check that file is loading correctly */}
              onChange={e => (setFiles(Array.from(e.target.files ?? [])), e.target.value = '')}
              class="= absolute w-full h-full top-0 left-0 cursor-pointer [::-webkit-file-upload-button]:hidden opacity-0 z-2"
              disabled={isDisabled()}
            />
          </div>
        }
      >
        <div class="= reset-list bg-section rounded-3" ref={props.ref}>
          <List.Item
            onClick={() => set(isOpen, !get(isOpen))}
            semantic={false}
            class="= max-h-11 overflow-hidden app-transition-max-height"
            left={
              <Attach class="= fill-tg_hint ml-0.5" classList={{ 'fill-tg_button!': props.files.canUndo() }} />
            }
            style={get(isOpen) ? {
              'max-height': `${get(listHeight)}px`,
            } : {}}
            rightHint={
              <span class="app-text-body-s/regular rounded-2 p-1 px-1.5 bg-tg_bg_secondary c-tg_text">
                {files().length}
              </span>
            }
            right={
              <ListArrow class="= overflow-initial fill-tg_hint"
                isOpen={isOpen[0]}
              />
            }
            bottom={
              <div id="file-list" class="= flex flex-col pt-2 pb-4 ltr:(pl-13.5 pr-2) rtl:(pr-13.5 pl-2)">
                <div
                  class="= relative flex flex-wrap gap-2 [&_*]:app-text-subheadline! cursor-initial!"
                  onClick={e => e.stopPropagation()}
                >
                  <For each={files()}>
                    {(file, index) =>
                      <FilePill file={file} onClick={() => props.openPreview?.(index())}
                        remove={() => removeFile(file)}
                        uploadProgress={getUploadProgress(file)}
                      />
                    }
                  </For>

                  <Show when={files().length < (props.limit ?? Infinity) || !profile.latest.isPro}>
                    <FilePill disabled={isDisabled()}
                      onDisabled={props.onDisabled}
                      add={files => addFiles(files)}
                    >
                      {resolved()}
                    </FilePill>
                  </Show>
                </div>

                <Show when={props.limit}>
                  <p class="= mx-1 mb--1 mt-1 self-end app-text-footnote c-tg_hint">
                    {files().length}/{props.limit}
                  </p>
                </Show>
              </div>
            }
          >
            <p class="= app-text-subheadline flex-grow ltr:text-left rtl:text-right m-0">
              {filesTitle()[0]}
            </p>
          </List.Item>
        </div>
      </Show>
    </div>
  </Show>;

  function getUploadProgress(file: ClientTaskFile | File) {
    if (!(file instanceof File)) {
      return undefined;
    }

    if (!props.uploadProgress?.get(file)) {
      const progress = createSignal<number>();

      props.uploadProgress?.set(file, progress);

      return () => get(progress);
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return () => get(props.uploadProgress!.get(file)!);
  }

  function SizeLimit() {
    return <Show when={props.maxSize}>
      <span class="= app-text-footnote c-text-tertiary">
        {t('task files size', {
          'task files size unit': [getMaxMB()],
        })}
      </span>
    </Show>;
  }

  function isDisabled() {
    return !!props.disabled || files().length >= (props.limit ?? Infinity);
  }

  interface FilesValidation {
    invalidSize: File[];
    invalidAmount: File[];
    valid: File[];
  }

  function splitInvalidFiles(files: File[], limit?: number): FilesValidation {
    const maxSize = props.maxSize;
    limit = limit ?? props.limit;

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

  function validateFiles(files: File[], limit?: number) {
    const { valid, invalidAmount, invalidSize } = splitInvalidFiles(files, limit);

    const title = t('task files invalid-title');
    const messages: string[] = [];

    if (invalidSize.length > 0) {
      const limitMB = (props.maxSize ?? 0) / 1024 / 1024;
      messages.push(t('task files invalid-size', {
        'task files invalid-size amount': [invalidSize.length],
        'task files invalid-size limit': [limitMB],
      }));
    }

    if (invalidAmount.length > 0) {
      messages.push(t('task files invalid-amount', {
        'task files invalid-amount amount': [invalidAmount.length],
        'task files invalid-amount limit': [props.limit ?? 0],
      }));
    }

    const message =
      messages.join(t('task files invalid-conjunction'))
      + (messages.length > 0 ? t('task files invalid-conjunction-2') : '')
      + t('task files valid-conclusion', {
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

  function setFiles(newFiles: File[]): void {
    if (isDisabled()) {
      return;
    }

    const filesLeft = props.limit
      ? props.limit - files().length
      : undefined;

    newFiles = validateFiles(newFiles, filesLeft);

    clearFormFiles(props.formData);

    if (!newFiles || newFiles.length === 0) {
      return;
    }

    appendFormFiles(set(formFiles, [...newFiles]), props.formData);

    set(isOpen, true);
  }

  function removeFile(file: DisplayableFile) {
    WebApp.HapticFeedback.selectionChanged();

    if (file instanceof ClientTaskFile) {
      props.onRemoveFile?.(file);
      set(props.files, get(props.files).filter(f => f !== file));
      return;
    }

    deleteFormFile(file, props.formData);
    set(formFiles, getFormFiles(props.formData));
    props.onRemoveFile?.(file);
  }

  function addFiles(newFiles: FileList | null) {
    if (!newFiles) {
      return;
    }

    const filesLeft = props.limit
      ? props.limit - files().length
      : undefined;

    const valid = validateFiles(Array.from(newFiles), filesLeft);

    for (const file of valid) {
      appendFormFile(file, props.formData);
      set(formFiles, getFormFiles(props.formData));
    }
  }
}

export function isTaskFileFromDifferentChat(file: ClientTaskFile | File, taskChatId?: number) {
  return typeof taskChatId === 'undefined' || file instanceof File || taskChatId !== file.chatId;
}

export function FilePill(props: ParentProps<({
  file: ClientTaskFile | File;
  remove?: () => void;
  add?: undefined
  onDisabled?: undefined;
  uploadProgress?: () => number | undefined;
  onClick: () => void;
} | {
  file?: undefined;
  remove?: undefined;
  onClick?: undefined;
  onDisabled?: VoidFunction;
  uploadProgress?: undefined;
  add: (files: FileList | null) => void;
}) & {
  disabled?: boolean;
}>) {
  const linkProps = () => ({
    href: getLocalDownloadLink(props.file),
    target: isMobile() ? '_blank' : undefined,
    download: props.file?.name,
    onClick: (e: Event) => {
      e.preventDefault();
      e.stopPropagation();

      if (props.disabled) {
        return props.onDisabled?.();
      }

      props.onClick?.();
    },
  } satisfies ComponentProps<'a'>);

  const progress = createSignal<number>(0);
  const getProgress = () => props.uploadProgress?.() ?? get(progress) ?? 0;

  createRenderEffect(() => set(progress, Math.max(getProgress(), untrack(() => get(progress)))));

  return <div class="= relative rounded-2 b-solid b-1 b-border-regular cursor-pointer flex items-center justify-between overflow-hidden">
    <div class="= progress absolute left-0 top-0 bottom-0 bg-tg_button opacity-20 pointer-events-none"
      style={{
        width: get(progress) + '%',
      }}
    />
    <a class="= flex items-center justify-between overflow-hidden"
      {...linkProps()}
    >
      <span class="= [&_*]:app-text-subheadline! m-2 ltr:mr-0 rtl:ml-0 overflow-hidden pointer-events-none inline-flex"
        classList={{
          'c-tg_button': !!props.add,
          'cursor-pointer!': !props.disabled,
          'c-tg_hint': props.disabled && !!props.add,
          'c-tg_text!': props.disabled && !props.add,
        }}
      >
        <NameWithExt file={props.file} fallback={t('task files add')} />
      </span>
    </a>
    <Show when={props.remove || props.add}
      fallback={
        <Show when={props.file instanceof ClientTaskFile}>
          <Show when={getLocalDownloadLink(props.file)}>
            <a class="= cursor-pointer! relative"
              {...omit(['onClick'], linkProps())}
              onClick={e => {
                e.stopPropagation();

                if (typeof WebApp.downloadFile === 'function') {
                  try {
                    WebApp.downloadFile({
                      url: linkProps().href!,
                      file_name: props.file!.name,
                    }, accepted => {
                      if (!accepted) return;
                    });

                    e.preventDefault();

                    return;
                  } catch (error) {
                    /*  */
                  }
                }
              }}
            >
              <DownloadIcon />
            </a>
          </Show>
        </Show>
      }
    >
      <div role="button" class="= cursor-pointer! flex items-center"
        classList={{
          'p-4 m--2': isAndroid(),
          'p-2': !isAndroid(),
        }}
        onClick={e => {
          e.stopPropagation();

          if (isLoading()) {
            return;
          }

          props.remove?.();
        }}
      >
        <Show when={!props.children} fallback={props.children}>
          <Show when={!isLoading()} fallback={<Loader class="= m--2" />}>
            <Dismiss
              classList={{
                'fill-tg_hint cursor-pointer!': !!props.remove,
                'fill-tg_button rotate-45': !!props.add,
              }}
            />
          </Show>
        </Show>
      </div>
    </Show>
    <Show when={props.add}>
      {add =>
        <input type="file" name="file" id="file" multiple onChange={e => add()(e.target.files)}
          class="= absolute w-full h-full top-0 left-0 cursor-pointer [::-webkit-file-upload-button]:hidden opacity-0 z-2"
          disabled={props.disabled}
        />
      }
    </Show>
  </div>;

  function isLoading(): boolean {
    return get(progress) > 0 && get(progress) < 100;
  }

  function getLocalDownloadLink(file?: DisplayableFile) {
    if (!file) {
      return undefined;
    }

    try {
      return file instanceof ClientTaskFile ? file.downloadLink : URL.createObjectURL(file);
    } catch (error) {
      return undefined;
    }
  }
}
