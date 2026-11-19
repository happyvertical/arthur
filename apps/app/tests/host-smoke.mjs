import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readAssistantTurnStream } from '@happyvertical/smrt-chat/assistant-turn';
import { buildSidecarEnv } from '@happyvertical/smrt-desktop';
import { createNodeMeasureSeams } from '@happyvertical/smrt-desktop/bundler';

// Reuse the desktop measurement seams for a disposable local runtime; no packaging.
const app = fileURLToPath(new URL('../', import.meta.url));
/** Shared test-only first-run fixture for the host smoke and size probe. */
export async function completeYogaFirstRun(request, headers) {
  let onboarding = await (await request('/api/onboarding', { headers })).json();
  const change = async (action, extra = {}) => {
    const result = await request('/api/onboarding', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action,
        revision: onboarding.revision,
        ...extra,
      }),
    });
    assert.equal(result.status, 200, `onboarding ${action}`);
    onboarding = await result.json();
  };
  assert.equal(onboarding.step, 'welcome');
  const welcome = await request('/', { headers });
  assert.equal(welcome.headers.get('location'), '/onboarding');
  await change('welcome');
  assert.equal(onboarding.step, 'ai');
  await change('skip');
  assert.equal(onboarding.step, 'template');
  assert.equal((await request('/onboarding', { headers })).status, 200);
  await change('preview', { id: 'yoga-studio' });
  assert.ok(onboarding.preview.after.includes('Members'));
  await change('apply');
  assert.equal(onboarding.approvalId, null, 'empty first run needs only the template confirmation');
  assert.equal(onboarding.approval, null);
  assert.equal(onboarding.step, 'done');
  assert.equal(onboarding.completed, true);
  return onboarding;
}

/** Existing smoke model fixture, shared with built-browser greeting checks. */
export function createHostModelFixture() {
  let calls = 0;
  const fixture = createServer(async (req, res) => {
    try {
      assert.equal(req.url, '/v1/chat/completions');
      let text = '';
      for await (const part of req) text += part;
      const body = JSON.parse(text);
      calls++;
      const answered = body.messages.some((m) => m.role === 'tool');
      const name = body.tools?.find((t) => /customers[-_]read$/.test(t.function.name))?.function
        .name;
      if (!answered) assert.ok(name, 'customer read tool must be offered');
      const message = answered
        ? { role: 'assistant', content: 'Customer list checked.' }
        : {
            role: 'assistant',
            content: null,
            tool_calls: [
              {
                id: 'fixture-read',
                type: 'function',
                function: { name, arguments: '{}' },
              },
            ],
          };
      const base = { id: 'fixture', created: 1, model: 'host-fixture' };
      const finish = answered ? 'stop' : 'tool_calls';
      if (body.stream) {
        res.writeHead(200, { 'content-type': 'text/event-stream' });
        const delta = answered
          ? message
          : {
              ...message,
              tool_calls: message.tool_calls.map((t) => ({ index: 0, ...t })),
            };
        res.write(
          `data: ${JSON.stringify({ ...base, object: 'chat.completion.chunk', choices: [{ index: 0, delta, finish_reason: null }] })}\n\n`,
        );
        res.write(
          `data: ${JSON.stringify({ ...base, object: 'chat.completion.chunk', choices: [{ index: 0, delta: {}, finish_reason: finish }] })}\n\n`,
        );
        res.end('data: [DONE]\n\n');
      } else {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(
          JSON.stringify({
            ...base,
            object: 'chat.completion',
            choices: [{ index: 0, message, finish_reason: finish }],
            usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
          }),
        );
      }
    } catch {
      res.writeHead(500);
      res.end('Fixture rejected the request');
    }
  });
  return {
    server: fixture,
    get calls() {
      return calls;
    },
  };
}

export async function runHostSmoke() {
  const entry = process.env.SMRT_DESKTOP_BUILD_DIR
    ? join(process.env.SMRT_DESKTOP_BUILD_DIR, 'index.js')
    : 'build/index.js';
  const measure = createNodeMeasureSeams();
  const scratch = await measure.makeDataDir();
  const port = await measure.freePort();
  assert.ok(port > 4900);
  const origin = `http://127.0.0.1:${port}`;
  const model = createHostModelFixture();
  const fixture = model.server;
  await new Promise((resolve) => fixture.listen(0, '127.0.0.1', resolve));
  assert.ok(fixture.address().port > 4900);
  const env = buildSidecarEnv(
    {
      version: 1,
      executable: 'node',
      args: ['build/index.js'],
      healthRoute: '/api/_runtime/health',
      dataDirectory: 'arthur-host-smoke',
    },
    {
      port,
      dataDirectory: join(scratch.path, 'data'),
      ownerLinkSecret: randomBytes(32).toString('hex'),
    },
    process.env,
  );
  for (const key of ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'CODEX_API_KEY', 'GEMINI_API_KEY'])
    delete env[key];
  Object.assign(env, {
    SMRT_AI_PROVIDER: 'openai',
    SMRT_AI_API_KEY: 'local-fixture-only',
    SMRT_AI_MODEL: 'host-fixture',
    SMRT_AI_BASE_URL: `http://127.0.0.1:${fixture.address().port}/v1`,
  });
  const child = spawn(process.execPath, [entry], {
    cwd: app,
    env,
    stdio: 'ignore',
  });
  let exited = false;
  const closed = new Promise((resolve) =>
    child.once('exit', () => {
      exited = true;
      resolve();
    }),
  );
  const request = (path, options = {}) =>
    fetch(`${origin}${path}`, {
      redirect: 'manual',
      signal: AbortSignal.timeout(120000),
      ...options,
    }).catch(() => {
      throw new Error(`HTTP probe failed at ${path.split('?')[0]}`);
    });
  try {
    const start = Date.now();
    let ready = false;
    while (Date.now() - start < 120000 && !exited) {
      try {
        ready = (await request('/api/_runtime/health')).ok;
      } catch {
        /* booting */
      }
      if (ready) break;
      await measure.sleep(50);
    }
    assert.ok(ready, 'runtime must become healthy');
    const anonymous = await request('/api/customers');
    // The live exposure gate hides model endpoints without an authenticated tenant.
    assert.equal(anonymous.status, 404);
    assert.equal((await request('/api/_runtime/owner-link?launch=invalid')).status, 403);
    const owner = await request(
      `/api/_runtime/owner-link?launch=${env.SMRT_DESKTOP_OWNER_LINK_SECRET}`,
    );
    assert.equal(owner.status, 302);
    const cookie = owner.headers
      .getSetCookie()
      .map((value) => value.split(';')[0])
      .join('; ');
    assert.ok(cookie);
    const headers = { cookie, origin, 'content-type': 'application/json' };
    assert.equal((await request('/api/customers', { headers })).status, 404);
    await completeYogaFirstRun(request, headers);
    assert.equal((await request('/api/customers', { headers })).status, 200);
    const sections = await request('/s/classes', { headers });
    assert.equal(sections.status, 200);
    assert.ok((await sections.text()).includes('Classes'));
    // The same generated endpoint used by New member owns linked contact creation.
    const customer = await request('/api/customers', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Maya First Run',
        email: 'maya@example.test',
        phone: '555-0101',
      }),
    });
    assert.equal(customer.status, 201, await customer.clone().text());
    const customerList = await request('/api/customers', { headers });
    assert.equal(customerList.status, 200);
    assert.ok(JSON.stringify(await customerList.json()).includes('Maya First Run'));
    const select = await request('/api/connect-ai', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'select', engine: 'api' }),
    });
    assert.equal(select.status, 200);
    assert.equal((await request('/api/estimates', { headers })).status, 404);
    const home = await request('/', { headers });
    assert.equal(home.status, 303);
    assert.equal((await request(home.headers.get('location'), { headers })).status, 200);
    for (const path of ['/settings', '/settings/inference', '/m/commerce/Customer'])
      assert.equal(
        (await request(path, { headers })).status,
        200,
        `Owner page must render: ${path}`,
      );
    const thread = await request('/api/assistant/threads', {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: 'Host smoke' }),
    });
    assert.equal(thread.status, 201);
    const id = (await thread.json()).thread.id;
    const turn = await request(`/api/assistant/threads/${id}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        content: 'List my customers',
        clientRequestId: randomUUID(),
      }),
    });
    assert.equal(turn.status, 200);
    const events = [];
    await readAssistantTurnStream(turn, (event) => events.push(event));
    assert.equal(
      events.some((e) => e.type === 'error'),
      false,
      JSON.stringify(events.filter((e) => e.type === 'error')),
    );
    assert.ok(events.some((e) => e.type === 'step' && e.step.kind === 'tool_result' && e.step.ok));
    assert.ok(events.some((e) => e.type === 'done'));
    assert.ok(JSON.stringify(events).includes('Customer list checked.'));
    assert.equal(model.calls, 2);
    console.log(
      'First run host checks passed: engine skip, yoga preview/one confirmation, sections, generated customer list and stub assistant turn.',
    );
    console.log(
      'First run smoke: 1 scenario passed (owner sign-in, engine skip, yoga preview/one confirmation, named customer CRUD, stubbed customer turn).',
    );
  } finally {
    child.kill('SIGTERM');
    await Promise.race([closed, measure.sleep(3000)]);
    if (!exited) {
      child.kill('SIGKILL');
      await closed;
    }
    fixture.closeAllConnections();
    await new Promise((resolve) => fixture.close(resolve));
    await scratch.dispose();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  execFileSync(process.execPath, [process.env.npm_execpath, 'build'], {
    cwd: app,
    env: process.env,
    stdio: 'inherit',
  });
  await runHostSmoke();
  console.log('Build and host smoke passed.');
}
