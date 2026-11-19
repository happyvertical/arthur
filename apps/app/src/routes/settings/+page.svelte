<script lang="ts">
import { createAssistantHttpTransport } from '@happyvertical/smrt-chat/svelte';
import { RecordHistory } from '@happyvertical/smrt-svelte';
import { ShellSettingsPage } from '@happyvertical/smrt-svelte/app';
import {
  ConnectAi,
  createConnectAiClient,
} from '@happyvertical/smrt-svelte/connect-ai';
import {
  OwnerApprovalsSettings,
  PrebuiltComponentsSettings,
} from '@happyvertical/smrt-svelte/settings';
import { signOut } from '@happyvertical/smrt-template-sveltekit/host/sveltekit-client';
import { defineMessages, useI18n } from '@happyvertical/smrt-ui/i18n';
import { invalidateAll } from '$app/navigation';
import PluginModeSettings from '$lib/PluginModeSettings.svelte';
import type { PageProps } from './$types';

let { data }: PageProps = $props();
const M = defineMessages({
  'arthur.settings.plugin_owner':
    'Connecting your own AI requires the sole local owner’s first-party session.',
});
const { t } = useI18n();
const client = createConnectAiClient({ endpoint: '/api/connect-ai' });
const transport = createAssistantHttpTransport({ endpoint: '/api/assistant' });
</script>

<svelte:head>
  <title>Settings · Arthur</title>
</svelte:head>

<!-- Appearance, account, and layout; preferences persist through the shell storageKey. -->
<ShellSettingsPage onSignOut={signOut}>
  <OwnerApprovalsSettings approvals={data.approvals} {transport} ondecided={invalidateAll} onsettled={invalidateAll} />
  <div>
    <h2 id="change-history-title">Change history</h2>
    <RecordHistory entries={data.history.entries} label="Change history" />
  </div>
  <ConnectAi {client} variant="settings" apiKeyHref="/settings/inference" />
  {#if data.pluginMode}
    <PluginModeSettings settings={data.pluginMode} />
  {:else}
    <p id="own-ai">{t(M['arthur.settings.plugin_owner'])}</p>
  {/if}
  <PrebuiltComponentsSettings enabled={data.prebuilt.enabled} onsave={async enabled => {
    const response = await fetch('/api/cookbook/prebuilt', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ enabled, revision: data.prebuilt.revision }) });
    if (!response.ok) throw new Error('The setting could not be saved.');
    await invalidateAll();
  }} />
</ShellSettingsPage>
