import { Subtask } from '../definitions';
import type { SubtaskItemController, SubtaskListController, SubtaskCollection } from '../definitions';

export * from '../definitions';

export class SubtaskList implements SubtaskListController {
	constructor(
		private store: SubtaskCollection,
	) {}

	addItem(index: number): void {
		this.store.set(subtasks => subtasks.splice(index, 0, new Subtask()));
	}

	updateItemText(value: string, index: number): void {
		this.store.set(subtasks => {
			if (typeof index === 'undefined' || index === subtasks.length) {
				if (!value) return;

				subtasks.push(new Subtask(value));

				return;
			}

			if (!subtasks[index]) {
				subtasks[index] = new Subtask(value);
			} else {
				subtasks[index].title = value;
			}
		});
	}

	updateItemState(value: boolean, index: number): void {
		this.store.set(subtasks => {
			if (!subtasks[index]) return;

			subtasks[index].done = value;
		});
	}

	removeItem(index: number): void {
		this.store.set(subtasks => {
			if (index === 0 && subtasks.length === 1) {
				subtasks[index].title = '';
				return;
			}

			subtasks.splice(index, 1);
		});
	}

	get length(): number {
		return this.store.get().length;
	}
}

export abstract class SubtaskItem implements SubtaskItemController {
	constructor(
		protected subtasks: SubtaskListController,
		protected index: () => number,
	) {}

	abstract getInput(offset: number): HTMLElement | undefined;

	updateText(val: string) {
		this.subtasks.updateItemText(val, this.index());
	}

	add(insert?: boolean) {
		if (this.index() === this.subtasks.length - 1 || insert) {
			this.subtasks.addItem(this.index() + 1);
		}
	}

	remove(): void {
		this.subtasks.removeItem(this.index());
	}

	select(offset: number) {
		this.getInput(offset)?.focus();
	}

	updateState(checked: boolean) {
		if (this.subtasks.length === 0) {
			return;
		}

		this.subtasks.updateItemState(checked, this.index());
	}
}

export const subtaskItemRegex = /^(?:\[( |u|x)\]) (.+)(?:\n|$)/gm;
export function subtaskToString(subtask: Subtask) {
	return `[${subtask.done ? 'x' : ' '}] ${subtask.title}`;
}

export function sanitizeDescription(description: string): string {
	return description.replace(subtaskItemRegex, '').trimEnd();
}

export function* extractSubtasks(description: string) {
	for (const [, check, title] of description.matchAll(subtaskItemRegex)) {
		yield new Subtask(title, check === 'x');
	}
}

export function fromDescription(description: string, allowEmpty?: boolean) {
	const subtasks = [...extractSubtasks(description)];

	return (subtasks.length === 0 && !allowEmpty) ? [new Subtask()] : subtasks;
}

export function toDescription(subtasks: readonly Subtask[], description: string) {
	return description.trim().concat(
		...subtasks
			.filter(s => s.title.length > 0)
			.map(s => '\n' + subtaskToString(s)),
	);
}