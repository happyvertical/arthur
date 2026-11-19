<script lang="ts">
import { defineMessages, useI18n } from '@happyvertical/smrt-ui/i18n';
import { EmptyState } from '@happyvertical/smrt-ui/layout';

const M = defineMessages({
  'arthur.fresh.title': 'What would you like to build?',
  'arthur.fresh.description':
    'Tell your assistant about your work to add your first lists, or choose a template in Settings.',
});
const { t } = useI18n();
</script>
<EmptyState title={t(M['arthur.fresh.title'])} description={t(M['arthur.fresh.description'])} />
