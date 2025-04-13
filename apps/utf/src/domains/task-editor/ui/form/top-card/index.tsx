import type { Store, SetStoreFunction, StoreReturn } from 'solid-js/store';
import type { JSX, Signal } from 'solid-js';

import type { TaskPriority, TaskStatus } from 'shared/network/schema';

import type { Subtask } from '#/task-editor/subtasks/features';

import StatusBar from './status-bar';
import ControlBar from './control-bar';

import { waterfall } from 'ui/composables/use-waterfall';

import TaskTitle from '#/task-editor/ui/title';
import TaskDescription from '#/task-editor/ui/description';
import Subtasks from '#/task-editor/subtasks/ui';

declare module 'solid-js/store' {
  export type StoreReturn<T> = [get: Store<T>, set: SetStoreFunction<T>];
}

export default function TopCard(props: {
	title: Signal<string>;
	description: Signal<string>;
	status: Signal<TaskStatus>;
	priority: Signal<TaskPriority>;
	subtasks: StoreReturn<Subtask[]>;
	checkbox: JSX.Element;
	dates: JSX.Element;
	calendarLink: JSX.Element;
	contextMenu?: JSX.Element;
}) {

	const title = props.title;
	const description = props.description;
	const [subtasks, updateSubtasks] = props.subtasks;

	return <>
		<div class="bg-section flex flex-col rounded-3" >
			<ControlBar {...props} />

			<TaskTitle model={title} />

			<div data-id="task-description-container" class="px-4 min-h-[204px] flex flex-col">
				<TaskDescription model={description} />
				<Subtasks list={subtasks} updateList={updateSubtasks} />
			</div>

			<StatusBar contextMenu={props.contextMenu}
				status={props.status}
				priority={props.priority}
			/>
		</div>
	</>;
}
