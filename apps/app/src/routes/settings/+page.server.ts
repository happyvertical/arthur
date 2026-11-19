import type { AssistantApprovalView } from '@happyvertical/smrt-chat/assistant-turn';
import type { UndatedHistoryEntry } from '@happyvertical/smrt-svelte';
import type { PluginModeState } from '@happyvertical/smrt-template-sveltekit/host/plugin-mode';
import { redirect } from '@sveltejs/kit';
import { host } from '$lib/server/smrt';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
  if (!event.locals.user) redirect(303, '/setup');
  const response = await host.prebuilt(event);
  if (!response.ok) throw new Error('Settings unavailable');
  const approvals = await host.assistant.GET({
    ...event,
    params: { ...event.params, path: 'approvals' },
  });
  if (!approvals.ok) throw new Error('Approvals unavailable');
  const pluginMode = await host.pluginMode(event);
  if (!pluginMode.ok && pluginMode.status !== 403) throw new Error('Plugin settings unavailable');
  const history = await host.history(event);
  if (!history.ok) throw new Error('Change history unavailable');
  return {
    history: (await history.json()) as {
      revision: number;
      entries: UndatedHistoryEntry[];
    },
    pluginMode: pluginMode.ok ? ((await pluginMode.json()) as PluginModeState) : null,
    approvals: (await approvals.json()).approvals as AssistantApprovalView[],
    prebuilt: (await response.json()) as {
      enabled: boolean;
      revision: string | null;
    },
  };
};
