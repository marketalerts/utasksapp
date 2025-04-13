import type { ClientItem } from 'f/project/project.adapter';

export enum GroupsExplorerMode {
  Links = 'links',
  Options = 'options'
}

export interface ModeOptions {
  mode: GroupsExplorerMode;
  onItemClick: (item: ClientItem) => void;
}

export const isLinks = (mode: GroupsExplorerMode): mode is GroupsExplorerMode.Links => mode === GroupsExplorerMode.Links;
