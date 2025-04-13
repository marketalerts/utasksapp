import { FilesList } from 'f/task/editor.ui/files';

import { waterfall } from 'ui/composables/use-waterfall';

export default function Files() {
  const fd = new FormData();

  return <div class="[&>div>div>*:first-child]:(bg-section! rounded-3)" >
    <FilesList formData={fd} />
  </div>;
}