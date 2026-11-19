<script lang="ts">
import { createAssistantHttpTransport } from '@happyvertical/smrt-chat/svelte';
import { createConnectAiClient } from '@happyvertical/smrt-svelte/connect-ai';
import {
  createOnboardingClient,
  FirstRunOnboarding,
} from '@happyvertical/smrt-svelte/onboarding';
import { defineMessages, useI18n } from '@happyvertical/smrt-ui/i18n';
import { goto, invalidateAll } from '$app/navigation';
import type { PageProps } from './$types';

let { data }: PageProps = $props();
const M = defineMessages({
  'arthur.onboarding.title': 'Welcome',
  'arthur.onboarding.plugin': 'Use with your own AI in Settings',
  'arthur.onboarding.description':
    'Your own app for the work and people that matter to you.',
});
const { t } = useI18n();
const client = createOnboardingClient({ endpoint: '/api/onboarding' });
const connectAi = createConnectAiClient({ endpoint: '/api/connect-ai' });
const approvalTransport = createAssistantHttpTransport({
  endpoint: '/api/assistant',
});
</script>
<svelte:head><title>{t(M['arthur.onboarding.title'])} · Arthur</title></svelte:head>
{#if data.onboarding}
  <FirstRunOnboarding {client} {connectAi} {approvalTransport} initialState={data.onboarding} appName="Arthur" description={t(M['arthur.onboarding.description'])} apiKeyHref="/settings/inference?returnTo=onboarding" aiAlternative={{href:'/settings#own-ai',label:t(M['arthur.onboarding.plugin'])}} oncomplete={async () => { await invalidateAll(); await goto('/'); }} />
{/if}
