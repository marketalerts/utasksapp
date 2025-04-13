import { Copy, Immutable, Map, Mapable, Rename, to } from 'data-mapper';

import { getMessageLink } from 'shared/platform';
import type { Schema } from 'shared/network';

import { ClientUser } from 'f/project/users.adapter';

import { FullClientTask } from '../task.adapter';
import { fromDescription } from '#/task-editor/subtasks/features';

type CommentModel = Omit<Schema.TaskHistoryItemModel, 'comment'> & {
  comment: Schema.TaskHistoryCommentModel;
};

type UpdateModel = Schema.TaskHistoryItemModel;

function isCommentModel(item: Schema.TaskHistoryItemModel): item is CommentModel {
  return !!item.comment;
}

function isUpdateModel(item: Schema.TaskHistoryItemModel): item is UpdateModel {
  return !!item.update;
}

export type HistorySorting = 'new-first' | 'old-first';
export type HistoryFilter = 'update' | 'comment' | null;

export const toClientTaskHistory = (history: Schema.TaskHistoryItemModel[]) => (
  history.map(to(ClientTaskHistoryItem))
);

@Immutable
export class ClientTaskHistoryItem extends Mapable<Schema.TaskHistoryItemModel> {
  @Map(item => (
    isCommentModel(item as Required<typeof item>)
      ? new ClientTaskHistoryComment(item as Required<typeof item>)
      : undefined
  ))
  comment?: ClientTaskHistoryComment;

  @Map(item => (
    isUpdateModel(item as Required<typeof item>)
      ? new ClientTaskHistoryUpdate(item as Required<typeof item>)
      : undefined
  ))
  update?: ClientTaskHistoryUpdate;
}

@Immutable
export class ClientTaskHistoryComment extends Mapable<CommentModel> {
  @Copy(to(ClientUser))
  author!: ClientUser;

  @Copy(d => d ? new Date(d) : undefined)
  date?: Date;

  @Rename('comment', comment => comment.chatId)
  chatId?: number;

  @Rename('comment', comment => comment.messageId)
  messageId?: number;

  @Rename('comment', comment => comment.text)
  text!: string;

  @Rename('comment', comment => comment.replyToMessageId === 0 ? undefined : comment.replyToMessageId)
  replyToMessageId?: number;

  @Rename('comment', comment => getMessageLink({ chatId: comment.chatId, messageId: comment.replyToMessageId }))
  replyLink?: string;

  @Rename('comment', getMessageLink)
  link?: string;
}

@Immutable
export class ClientTaskHistoryUpdate extends Mapable<UpdateModel> {
  @Copy(to(ClientUser))
  author!: ClientUser;

  @Copy(d => new Date(d))
  date!: Date;

  /** @deprecated */
  @Rename('update', update => update?.field ?? '')
  field!: Exclude<keyof Schema.TaskModel, 'fromInline'> | '';

  @Rename('update', convertValue('oldValue'))
  oldValue?: Partial<FullClientTask>;

  @Rename('update', convertValue('newValue'))
  newValue?: Partial<FullClientTask>;
}

function convertValue(key: 'oldValue' | 'newValue'): (input?: Schema.TaskHistoryUpdateModel) => Partial<FullClientTask> | undefined {
  return function (update) {
    let converted = {};

    if (!update?.[key]) {
      return undefined;
    }

    for (const _field in update?.[key]) {
      const field = _field as Exclude<keyof Schema.TaskModel, 'fromInline' | 'key' | 'number'> | undefined;

      if (!field) {
        continue;
      }

      const value = update[key] as Partial<Schema.TaskModel>;
      const convert = FullClientTask.getConverter(field);

      converted = { ...converted, [field]: convert?.(value) ?? value[field] };

      if (_field === 'description') {
        const subtaskUpdate = fromDescription(value.description ?? '', true);

        if (!subtaskUpdate) continue;

        converted = { ...converted, subtasks: subtaskUpdate };
      }
    }

    return converted;
  };
}

export type ClientTaskHistoryCommentItem = ClientTaskHistoryItem & { comment: ClientTaskHistoryComment };
export type ClientTaskHistoryUpdateItem = ClientTaskHistoryItem & { update: ClientTaskHistoryUpdate };

export function isComment(item: ClientTaskHistoryItem): item is ClientTaskHistoryCommentItem {
  return item.comment instanceof ClientTaskHistoryComment;
}

export function filterComment(item: ClientTaskHistoryItem): ClientTaskHistoryCommentItem | undefined {
  if (isComment(item))
    return item;

  return undefined;
}

export function isUpdate(item: ClientTaskHistoryItem): item is ClientTaskHistoryUpdateItem {
  return item.update instanceof ClientTaskHistoryUpdate;
}

export function filterUpdate(item: ClientTaskHistoryItem): ClientTaskHistoryUpdateItem | undefined {
  // Do not count file updates with comments as updates
  if (isUpdate(item) && (!item.comment || !item.update.newValue?.files))
    return item;

  return undefined;
}
