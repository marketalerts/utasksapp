import WebApp from 'tma-dev-sdk';
import { createRef } from 'solid-utils/ref';
import { Transition } from 'solid-transition-group';
import { createEffect, createSignal, Show } from 'solid-js';
import type { ComponentProps, JSX } from 'solid-js';
import { createAsync } from '@solidjs/router';

import { getConfigString } from 'shared/firebase';

import type { FullClientTask } from 'f/task/task.adapter';

import { t } from 'locales/task';

import { waterfall } from 'ui/composables/use-waterfall';

import Check from 'icons/20/Checkmark.svg';
import Document from 'icons/16/Document Outlined.svg';
import UnfoldMore from 'icons/16/Unfold More.svg';
import LinkOutlined from 'icons/16/Link Outlined.svg';
import { Loader } from 'shared/ui/loader.ui';

export default function TaskHeader(props: {
	projectSelector: JSX.Element;
	taskKey?: string;
	task?: FullClientTask;
}) {

	const [getText, setTextRef] = createRef<HTMLDivElement>();
	let text!: HTMLParagraphElement;
	const botUrl = createAsync(() => getConfigString('boturl'));

	const [hasCopied, setCopied] = createSignal(false);
	const [getWidth, setWidth] = createSignal(0);

	createEffect(() => {
		setWidth(getText()?.clientWidth ?? 0);
	});

	return <>
		<header
			class="flex flex-nowrap items-center justify-between p-2 pb-0"
		>
			{props.projectSelector}
			<Show when={props.taskKey}>
				<button class="flex items-center gap-1 p-2"
					onClick={() => {
						navigator.clipboard.writeText(getTaskLink(botUrl(), props.task?.project?.id, props.task?.id));
						WebApp.HapticFeedback.impactOccurred('soft');

						setCopied(true);
						setTimeout(() => setCopied(false), 300);
					}}
				>

					<div class="flex gap-1 items-center ltr:right-2 rtl:left-2" ref={setTextRef}>
						<LinkOutlined />

						<Transition
							enterActiveClass={hasCopied() ? 'animate-init-fade-in-down' : 'animate-init-fade-in-up'}
							exitActiveClass={hasCopied() ? 'animate-init-fade-out-down' : 'animate-init-fade-out-up'}
						>
							<Show fallback={<Document class="absolute ui-icon-tertiary" />}
								when={!hasCopied()}
							>
								<LinkOutlined class="absolute ui-icon-tertiary " />
							</Show>
						</Transition>
						<p data-id="task-readable-id" class="app-text-body-l/regular c-text-secondary">
							{props.taskKey}
						</p>
					</div>
				</button>
			</Show>
		</header>
	</>;

	function getTaskLink(botUrl?: string, projectId?: string, taskId?: string): string {
		return `${botUrl}/Tasks?startapp=${projectId}-S-${taskId}`;
	}
}

export function ProjectSelector(props: ComponentProps<'button'> & { projectName: string; disabled?: boolean }) {
	return <button
		data-id="project-selector"
		type="button"
		class="flex-grow flex items-center gap-1 p-2 overflow-hidden"
		{...props}
	>
		<Show when={props.projectName} fallback={<Loader class="app-text-body-l/regular-stable max-h-5" />}>
			<p data-id="project-title" class="app-text-body-l/regular-stable c-text-secondary ellipsis!">
				{props.projectName}
			</p>
		</Show>
		<UnfoldMore class="inline ui-icon-secondary min-w-4"
			classList={{ 'hidden': props.disabled }}
		/>
	</button>;
}