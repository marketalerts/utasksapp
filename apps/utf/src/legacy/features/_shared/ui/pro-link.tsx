import { ProjectType } from 'f/project/project.adapter';

import List from 'f/group/explorer-list.ui';


export function ProLink(props: {
  title: string;
  description: string;
}) {
  return <List wrapText each={[{
    id: 'pro-ad-card',
    name: props.title,
    description: props.description,
    href: '/subscribe',
    bold: true,
    icon: 'premium-star',
    type: ProjectType.Dynamic,
  }]} />;
}
