import WebApp from 'tma-dev-sdk';
import { datemodel, model, useDirectives } from 'solid-utils/model';
import { createHistorySignal } from 'solid-utils/history';
import { get, set } from 'solid-utils/access';
import { Show, Suspense, createSignal } from 'solid-js';

import { isIOS } from 'shared/platform';

import { postProject, updateProject } from 'f/project/project.network';
import { ProjectType } from 'f/project/project.adapter';

import { t } from '../create-button/locales';

import { MainButton } from 'shared/ui/telegram';

import ShevronRight from 'i/ShevronRight.svg';
import Plus from 'i/Plus.svg';
import InfoCircle from 'i/InfoCircle.svg';

// TODO: fix calendar icon line thinckness
// import Calendar from 'i/interactive/Calendar.svg';

export default function ProjectForm(props: {
  isContainerOpen: boolean;
  setContainerState: (isOpen: boolean) => void;
  onDone?: () => void;
  editor?: boolean;
  id?: string;
  title?: string;
}) {
  useDirectives(model, datemodel);

  // TODO: refactor this logic - preferably move to f/project

  const title = createHistorySignal(props.title ?? '');
  const description = createHistorySignal('');

  const resetFormData = () => {
    title.reset(props.title);
    description.reset();
  };

  const isRequestInProgress = createSignal(false);
  const isRequestSuccessful = createSignal<boolean>();

  const isTitleEmpty = () => get(title).trim().length === 0;
  const isFormDisabled = () => isTitleEmpty() || get(isRequestInProgress);

  // const [height, setHeight] = createSignal(3);

  // const onTextArea = (el: HTMLTextAreaElement) => {
  //   createRenderEffect(on(() => get(description),
  //     () => setHeight(el.scrollHeight),
  //     { defer: true }
  //   ));
  // };

  const submitProject = async (e: { currentTarget: HTMLFormElement }) => {
    if (isFormDisabled()) {
      e.currentTarget.querySelector('input')?.focus();
      WebApp.HapticFeedback.notificationOccurred('error');
      return;
    }

    try {
      set(isRequestInProgress, true);

      await (props.editor ? updateProject : postProject)({
        id: props.id ?? '',
        name: get(title),
        description: get(description),
        type: String(ProjectType.Private) as 'Private',
      }).then((r) => {
        if (r && 'error' in r) {
          throw r.error;
        }

        set(isRequestSuccessful, true);
        WebApp.HapticFeedback.notificationOccurred('success');
        props.onDone?.();
      });
    } catch (e) {
      set(isRequestSuccessful, false);

      try {
        WebApp.HapticFeedback.notificationOccurred('error');
        WebApp.showPopup({
          title: 'Error creating the project!',
          message: JSON.stringify(e),
        });
      } catch {
        console.error(e);
      }
    } finally {
      setTimeout(() => {
        set(isRequestInProgress, false);
        const isSuccess = get(isRequestSuccessful);
        set(isRequestSuccessful, undefined);

        setTimeout(() => {
          props.setContainerState(false);

          if (isSuccess) {
            resetFormData();
          }
        });
      }, 500);
    }
  };

  const l10nPrefix = props.editor ? 'edit' : 'new';

  let form!: HTMLFormElement;

  // TODO: debug the 'form' error, optimize markup
  return <Suspense>
    <button onClick={() => (resetFormData(), props.setContainerState(false))}
      class="= bg-transparent absolute p-0 ltr:right-1 rtl:left-1 top-1 w-8 h-8 flex items-center justify-center"
      tabIndex={7}
    >
      <Plus class="= rotate--45 fill-tg_hint w-4.5 h-4.5" />
    </button>
    <form id="new-project" onSubmit={e => (e.preventDefault(), submitProject(e))} ref={form}
      class="= [&>:not(:last-child)]:px-5"
    >
      <input use:model={title}
        disabled={get(isRequestInProgress)}
        autofocus
        id="project-title"
        name="project-title"
        enterkeyhint="next"
        inputmode="text"
        type="text"
        placeholder={t(`${l10nPrefix}-project input-title`)}
        class="= flex-grow ltr:pl-0 rtl:pr-0 pt-3 pb-2 ltr:pr-10 rtl:pl-10! app-text-title w-full"
        tabIndex={1}
      />

      {/* <textarea use:model={description} ref={onTextArea}
        disabled={get(isRequestInProgress)}
        id="project-description"
        name="project-description"
        placeholder={t(`${l10nPrefix}-project input-desc')}
        style={{ height: `${height()}px` }}
        class="= resize-none p-0 w-full app-text-base min-h-11 max-h-17"
        tabIndex={2}
      ></textarea> */}

      <section id="project-params"
        class="= mt-4 px-5 py-2.5 flex items-center justify-between bg-tg_bg_secondary overflow-x-auto"
      >
        <div class="= flex items-center c-tg_hint max-w-80% m-0 cursor-pointer"
          onClick={() => WebApp.showAlert(t(`${l10nPrefix}-project info`))}
        >
          <InfoCircle class="= min-w-7 ltr:mr-1 rtl:ml-1" />
          <span class="= app-text-smaller line-clamp-2">{t(`${l10nPrefix}-project info`)}</span>
        </div>

        <Show when={props.isContainerOpen && !isIOS()}>
          <MainButton
            onClick={() => submitProject({ currentTarget: form })}
            text={props.editor ? t('edit-project save') : t('new-project create')}
            disabled={isFormDisabled()}
            showProgress={get(isRequestInProgress)}
            isVisible={props.isContainerOpen} />
        </Show>
        <Show when={isIOS()}>
          <button type="submit"
            class="= flex gap-1 items-center justify-center p-2 rounded-2 app-transition-background"
            disabled={isFormDisabled()}
            classList={{
              'bg-success c-tg_button_text': get(isRequestSuccessful),
              'bg-urgent c-tg_button_text': get(isRequestSuccessful) === false,
            }}
            tabIndex={6}
          >
            <Show when={get(isRequestSuccessful) !== false}>
              <ShevronRight class="= fill-tg_button_text app-transition-transform" classList={{ 'rotate-90': get(isRequestSuccessful) }} />
            </Show>
            <Show when={get(isRequestSuccessful) === false}>
              <Plus class="= fill-tg_button_text rotate--45 ltr:ml-1 rtl:mr-1 w-5 h-5" />
            </Show>
          </button>
        </Show>
      </section>
    </form>
  </Suspense>;
}
