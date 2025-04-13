import { pipe } from 'rambda';
import { Copy, Rename, Mutable, to, from, Immutable, Mapable, Map } from 'data-mapper';
import { useParams } from '@solidjs/router';

import { TaskType, TaskCompletableType } from 'shared/network/schema';
import type { TaskStatus, TaskPriority } from 'shared/network/schema';
import type { Schema } from 'shared/network';

import { denormalizeDate, normalizeDate, toMinutes, toRelativeTimeString } from 'f/settings/units/date';
import { ClientUser } from 'f/project/users.adapter';
import { defaultProject } from 'f/project/project.context';
import { ProjectType, clientItemToProject } from 'f/project/project.adapter';
import type { ClientItem, ProjectItem } from 'f/project/project.adapter';
import { toClientItem } from 'f/group/project.adapter';
import { fromDescription, sanitizeDescription, toDescription } from '#/task-editor/subtasks/features';
import type { Subtask } from '#/task-editor/subtasks/features';

import { ClientTaskFile } from './files/adapter';

export { TaskCompletableType };

export const toNullableDate = (date?: string | null) => {
  const parsedDate = date == null ? null : new Date(date);

  return parsedDate;
};

export { TaskType } from 'shared/network/schema';

@Mutable
export class BaseClientTask extends Mapable<Schema.BaseTaskModel> {
  @Copy
  title!: string;

  @Copy
  description?: string;

  @Map.reverse((subtasks, output) => ({ description: toDescription(subtasks, output.description ?? '') }))
  subtasks!: Subtask[];

  @Copy
  type = TaskType.Task;

  @Copy
  fromInline?: boolean;

  @Copy(pipe(toNullableDate, denormalizeDate))
  @Copy.reverse(pipe(normalizeDate, toRelativeTimeString))
  dueDate!: Date | null;

  @Copy(pipe(toNullableDate, denormalizeDate))
  @Copy.reverse(pipe(normalizeDate, toRelativeTimeString))
  planDate!: Date | null;

  @Copy
  planCron?: string;

  @Copy(x => x?.map(to(ClientUser)) ?? [])
  @Copy.reverse(x => x?.map(from(ClientUser)))
  coassignees!: ClientUser[];

  @Copy
  status!: TaskStatus;

  @Copy
  priority!: TaskPriority;

  @Map((input) => toNotifications(input.planDateNotifications, input.planDate))
  @Map.reverse((x, output) => ({ planDateNotifications: formNotifications(x, output.planDate) }))
  planDateNotifications!: TaskNotification[];

  @Map((input) => toNotifications(input.dueDateNotifications, input.dueDate))
  @Map.reverse((x, output) => ({ dueDateNotifications: formNotifications(x, output.dueDate) }))
  dueDateNotifications!: TaskNotification[];
}

@Mutable
export class FullClientTask extends Mapable<Schema.TaskModel> {
  @Copy
  id!: string;

  @Copy
  title!: string;

  @Copy(d => sanitizeDescription(d ?? ''))
  description?: string;

  @Copy
  type = TaskType.Task;

  @Copy(pipe(toNullableDate, denormalizeDate))
  @Copy.reverse(pipe(normalizeDate, toRelativeTimeString))
  dueDate!: Date | null;

  @Copy(pipe(toNullableDate, denormalizeDate))
  @Copy.reverse(pipe(normalizeDate, toRelativeTimeString))
  planDate!: Date | null;

  @Copy
  planCron?: string;

  @Copy
  fromInline?: boolean;

  @Copy
  status!: TaskStatus;

  @Copy
  priority!: TaskPriority;

  @Rename('description', desc => fromDescription(desc ?? ''))
  @Map.reverse((subtasks, output) => ({ description: toDescription(subtasks, output.description ?? '') }))
  subtasks!: Subtask[];

  @Copy(x => x?.map(to(ClientUser)) ?? [])
  @Copy.reverse(x => x.map(from(ClientUser)))
  coassignees!: ClientUser[];

  @Copy(to(ClientUser))
  @Copy.reverse(from(ClientUser))
  author?: ClientUser;

  @Copy(toClientItem)
  @Copy.reverse(p => (!p || p.type === ProjectType.Dynamic || p.id === defaultProject.id) ? null : clientItemToProject(p as ProjectItem))
  project?: ClientItem;

  @Copy(x => x?.map(to(ClientTaskFile)) ?? [])
  @Copy.reverse(x => x.map(from(ClientTaskFile)))
  files!: ClientTaskFile[];

  @Copy(x => !!x)
  @Copy.reverse()
  isCompleted!: boolean;

  @Copy(pipe(toNullableDate, denormalizeDate))
  @Copy.reverse(() => null) // Do not pass back, as backend doesn't like it
  endDate!: Date | null;

  @Copy(x => x === TaskCompletableType.Completable)
  @Copy.reverse(x => x ? TaskCompletableType.Completable : TaskCompletableType.NotCompletable)
  completable!: boolean;

  @Copy
  completedUsers?: number[] | undefined;

  @Copy
  lastMessageId?: number;

  @Copy
  number?: string;

  @Map((input) => toNotifications(input.planDateNotifications, input.planDate))
  @Map.reverse((x, output) => ({ planDateNotifications: formNotifications(x, output.planDate) }))
  planDateNotifications!: TaskNotification[];

  @Map((input) => toNotifications(input.dueDateNotifications, input.dueDate))
  @Map.reverse((x, output) => ({ dueDateNotifications: formNotifications(x, output.dueDate) }))
  dueDateNotifications!: TaskNotification[];
}

export const toFullClientTask = (t: Schema.TaskModel) => new FullClientTask(t);

@Immutable
export class ClientTask extends Mapable<Schema.ListTaskModel> {
  @Copy
  id!: string;

  @Copy
  planCron!: string;

  @Copy
  title!: string;

  @Copy
  description!: string;

  @Copy
  filesCount?: number;

  @Copy
  fromInline?: boolean;

  @Copy
  status!: TaskStatus;

  @Copy
  priority!: TaskPriority;

  @Copy(x => !!x)
  @Copy.reverse()
  isCompleted!: boolean;

  @Copy(x => x === TaskCompletableType.Completable)
  @Copy.reverse(x => x ? TaskCompletableType.Completable : TaskCompletableType.NotCompletable)
  completable!: boolean;

  @Copy(pipe(toNullableDate, denormalizeDate))
  @Copy.reverse(x => x?.toString())
  dueDate!: Date | null;

  @Copy(pipe(toNullableDate, denormalizeDate))
  @Copy.reverse(x => x?.toString())
  planDate!: Date | null;

  @Copy(pipe(toNullableDate, denormalizeDate))
  @Copy.reverse(x => x?.toString())
  endDate!: Date | null;

  @Rename('group')
  groupBy?: string;

  @Copy
  @Copy.reverse()
  type = TaskType.Task;

  @Rename('projectName', name => name ? { name } : undefined)
  @Rename.reverse(project => project?.name)
  project?: Pick<ClientItem, 'name'> & Partial<ClientItem>;

  @Copy(to(ClientUser))
  author!: ClientUser;

  @Copy(coassignees => coassignees?.map(to(ClientUser)) ?? [])
  coassignees!: ClientUser[];

  @Rename('number')
  key?: string;

  @Map((input) => toNotifications(input.planDateNotifications, input.planDate))
  planDateNotifications!: TaskNotification[];

  @Map((input) => toNotifications(input.dueDateNotifications, input.dueDate))
  dueDateNotifications!: TaskNotification[];
}

export const getTaskDataFromHref = () => {
  const { taskId } = useParams();

  return { id: taskId };
};

export const toTaskHref = (task: ClientTask, source?: ClientItem) =>  {
  return `/${source?.id ?? task.project?.id ?? defaultProject.id}/${task.id}`;
};

export type TaskNotificationInit = [
  value: number,
  units: Exclude<Intl.RelativeTimeFormatUnit, `${string}s` | 'quarter'>
];

export class TaskNotification {
  value: TaskNotificationInit[0];
  format: TaskNotificationInit[1];

  constructor(...init: TaskNotificationInit) {
    [this.value, this.format] = init;
  }

  toMinutes(relativeTo: Date): number {
    const date = new Date(relativeTo);

    switch (this.format) {
      case 'year': {
        date.setFullYear(date.getFullYear() - this.value);

        return getMinutesFromSeconds();
      };

      case 'month': {
        date.setMonth(date.getMonth() - this.value);

        return getMinutesFromSeconds();
      };

      case 'week':
        return this.value * 60 * 24 * 7;
      case 'day':
        return this.value * 60 * 24;
      case 'hour':
        return this.value * 60;
      case 'minute':
        return this.value;
      case 'second':
        return this.value / 60;
    }

    function getMinutesFromSeconds(): number {
      return new TaskNotification(Math.floor((relativeTo.getTime() - date.getTime()) / 1000), 'second').toMinutes(relativeTo);
    }
  }

  equals(another: TaskNotification) {
    return this.format === another.format && this.value === another.value;
  }
}

export const defaultNotifications = ([
  new TaskNotification(0, 'minute'),
]);

export const availableNotifications = ([
  new TaskNotification(0, 'minute'),
  new TaskNotification(5, 'minute'),
  new TaskNotification(10, 'minute'),
  new TaskNotification(15, 'minute'),
  new TaskNotification(30, 'minute'),
  new TaskNotification(1, 'hour'),
  new TaskNotification(1, 'day'),
  new TaskNotification(2, 'day'),
  new TaskNotification(1, 'week'),
  new TaskNotification(1, 'month'),
]);

export const maximumNotifications = 2;

function filterNotifications(notifications: number[]) {
  return notifications.filter((n, i) => !(n < 0 || notifications.indexOf(n) !== i));
}

function toNotifications(minutes?: number[], date?: string | null): TaskNotification[] {
  const _date = pipe(toNullableDate, denormalizeDate)(date);

  return _date
    ? notificationsFromMinutes(filterNotifications(minutes ?? [0]), _date)
    : [];
}

function formNotifications(notifications?: TaskNotification[], date?: Date | null) {
  return date
    ? filterNotifications(notificationsToMinutes(notifications ?? defaultNotifications, date))
    : [];
}

function simplifyMinutes(minutes: number, relativeDate: Date | null): TaskNotificationInit {
  // Minutes
  if (minutes < 60) {
    return [minutes, 'minute'];
  }

  const days = minutes / (60 * 24);
  const daysRounded = Math.floor(days);

  // Hours
  if (minutes < 60 * 24 || days !== daysRounded) {
    return [minutes / 60, 'hour'];
  }

  // Days
  if (minutes < 60 * 24 * 7 || !relativeDate) {
    return [days, 'day'];
  }

  const weeks = days / 7;

  // Weeks
  if (weeks < 4) {
    return days % 7 !== 0
      ? [days, 'day']
      : [weeks, 'week'];
  }

  // Other
  const notificationDate = new Date(relativeDate);
  notificationDate.setDate(notificationDate.getDate() - days);

  if (notificationDate.getDate() !== relativeDate.getDate()) {
    return [days, 'day'];
  }

  const months = toMonths(relativeDate) - toMonths(notificationDate);

  if (months % 12 !== 0) {
    return [months, 'month'];
  }

  return [months / 12, 'year'];
}

function notificationsFromMinutes(notifications: number[], relativeDate: Date): TaskNotification[] {
  return notifications.map(minutes => {
    return new TaskNotification(...simplifyMinutes(minutes, relativeDate));
  });
}

function notificationsToMinutes(notifications: TaskNotification[], relativeDate: Date) {
  return Array.from(notifications).map(notification => notification.toMinutes(relativeDate));
}

function toMonths(date: Date) {
  // count months in base 12 counting system
  return (date.getFullYear() * 12) + date.getMonth();
}