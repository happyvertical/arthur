<script lang="ts">
import type {
  PluginClient,
  PluginModeState,
} from '@happyvertical/smrt-template-sveltekit/host/plugin-mode';
import { Toggle } from '@happyvertical/smrt-ui/forms';
import { defineMessages, useI18n } from '@happyvertical/smrt-ui/i18n';
import { Button, Card } from '@happyvertical/smrt-ui/ui';
import { invalidateAll } from '$app/navigation';

let { settings }: { settings: PluginModeState } = $props();
const M = defineMessages({
  'arthur.plugin.title': 'Use with your own AI',
  'arthur.plugin.authority':
    'Your AI can use your enabled app tools, including lists you add later. Destructive changes wait for your approval here in Settings.',
  'arthur.plugin.hide': 'Hide the in-app assistant',
  'arthur.plugin.connect': 'Generate setup',
  'arthur.plugin.reconnect': 'Replace connection',
  'arthur.plugin.revoke': 'Revoke',
  'arthur.plugin.copy': 'Copy setup',
  'arthur.plugin.copied': 'Copied.',
  'arthur.plugin.failed': 'Could not update the connection. Please try again.',
  'arthur.plugin.copy_failed':
    'Could not copy. Select the instructions and copy them.',
  'arthur.plugin.last_seen': 'Last seen',
  'arthur.plugin.never': 'Not seen yet',
  'arthur.plugin.active': 'Authorized',
  'arthur.plugin.expired': 'Expired',
  'arthur.plugin.revoked': 'Revoked',
  'arthur.plugin.not_connected': 'Not connected',
  'arthur.plugin.instructions':
    'Keep Arthur open. Paste this into the named client’s local configuration, then reconnect its MCP server. Credentials are saved privately on this machine; these instructions contain no token.',
});
const { t } = useI18n();
let busy = $state(false);
let message = $state('');
async function change(
  body:
    | { action: 'connect' | 'revoke'; client: PluginClient }
    | { action: 'embed'; enabled: boolean },
) {
  busy = true;
  message = '';
  try {
    const response = await fetch('/api/plugin-mode', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error('refused');
    await invalidateAll();
  } catch {
    message = t(M['arthur.plugin.failed']);
  } finally {
    busy = false;
  }
}
async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    message = t(M['arthur.plugin.copied']);
  } catch {
    message = t(M['arthur.plugin.copy_failed']);
  }
}
</script>
<section id="own-ai" aria-labelledby="own-ai-heading">
  <h2 id="own-ai-heading">{t(M['arthur.plugin.title'])}</h2>
  <p>{t(M['arthur.plugin.authority'])}</p>
  <Toggle label={t(M['arthur.plugin.hide'])} checked={settings.embed} disabled={busy} onchange={enabled => change({ action: 'embed', enabled })} />
  {#each settings.connections as connection (connection.client)}
    <Card>
      <h3>{connection.name}</h3>
      <p>{t(M[`arthur.plugin.${connection.status}`])}</p>
      <p>{t(M['arthur.plugin.last_seen'])}: {connection.lastSeen ? new Date(connection.lastSeen).toLocaleString() : t(M['arthur.plugin.never'])}</p>
      <Button disabled={busy} onclick={() => change({ action: 'connect', client: connection.client })}>{t(M[connection.status === 'active' ? 'arthur.plugin.reconnect' : 'arthur.plugin.connect'])}</Button>
      {#if connection.status === 'active'}
        <Button variant="secondary" disabled={busy} onclick={() => change({ action: 'revoke', client: connection.client })}>{t(M['arthur.plugin.revoke'])}</Button>
      {/if}
      {#if connection.setup}
        {@const instruction = connection.client === 'codex' ? connection.setup.codex : connection.client === 'claude-code' ? connection.setup.claudeCode : connection.setup.claudeDesktop}
        <p>{t(M['arthur.plugin.instructions'])}</p>
        <pre><code>{instruction}</code></pre>
        <Button variant="secondary" onclick={() => copy(instruction)}>{t(M['arthur.plugin.copy'])}</Button>
      {/if}
    </Card>
  {/each}
  <Card><h3>ChatGPT</h3><p>{settings.chatgpt}</p></Card>
  {#if message}<p role="status">{message}</p>{/if}
</section>
<style>
section { display: grid; gap: var(--smrt-spacing-4); }
pre { white-space: pre-wrap; overflow-wrap: anywhere; }
</style>
