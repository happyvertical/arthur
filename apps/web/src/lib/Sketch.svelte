<script lang="ts">
  import { onMount } from 'svelte';

  const frames = [
    { id: 'empty', tab: 'Empty app', title: 'You start with an empty app' },
    { id: 'ask', tab: 'Ask', title: 'You pick or ask for building blocks' },
    { id: 'screens', tab: 'Screens', title: 'They appear as working lists and screens' },
    { id: 'approve', tab: 'Approve', title: 'You change one, and approve the risky part' },
  ] as const;

  const STEP_MS = 4600;

  // With reduced motion, or without scripting, CSS shows all four frames at once before any script runs.
  let mode = $state<'all' | 'player'>('player');
  let ready = $state(false);
  let step = $state(0);
  let paused = $state(false);
  let focused = $state(false);
  let timer: ReturnType<typeof setInterval> | undefined;

  function stop() {
    if (timer) clearInterval(timer);
    timer = undefined;
  }

  function start() {
    stop();
    timer = setInterval(() => {
      if (!paused && !focused) step = (step + 1) % frames.length;
    }, STEP_MS);
  }

  onMount(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => {
      if (query.matches) {
        stop();
        mode = 'all';
      } else {
        mode = 'player';
        start();
      }
    };
    apply();
    ready = true;
    query.addEventListener('change', apply);
    return () => {
      query.removeEventListener('change', apply);
      stop();
    };
  });

  function go(i: number) {
    step = i;
    paused = true;
  }
</script>

<section
  class="sketch"
  data-mode={mode}
  aria-label="Illustration: an empty app is built from building blocks"
  onfocusin={() => (focused = true)}
  onfocusout={(e) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) focused = false;
  }}
>
  <p class="note">
    An illustration of the idea, made of plain HTML. It is not a recording of the product. The
    building blocks and sample data shown are examples.
  </p>

  <div class="controls">
    {#if ready && mode === 'player'}
      <ol class="tabs">
        {#each frames as f, i (f.id)}
          <li>
            <button type="button" aria-pressed={step === i} onclick={() => go(i)}>
              <span class="n">{i + 1}</span>{f.tab}
            </button>
          </li>
        {/each}
      </ol>
      <button type="button" class="pause" onclick={() => (paused = !paused)}>
        {paused ? 'Play' : 'Pause'}
      </button>
    {/if}
  </div>

  <div class="stage">
    {#each frames as f, i (f.id)}
      <figure class="frame" data-active={mode === 'all' || step === i} aria-hidden={ready && mode === 'player' && step !== i ? true : undefined}>
        <figcaption>
          <span class="n">{i + 1}</span>
          {f.title}
        </figcaption>

        <!-- svelte-ignore a11y_no_noninteractive_tabindex (a sideways-scrolling region must be reachable by keyboard) -->
          <div class="window" role="region" aria-label={f.title} tabindex="0">
            {#if f.id === 'empty'}
              <div class="shell">
                <ul class="side" aria-label="Menu">
                  <li class="on">Home</li>
                </ul>
                <div class="main">
                  <p class="empty">Nothing here yet.</p>
                  <p class="hint">Ask the assistant, or pick building blocks:</p>
                  <ul class="chips">
                    <li>Customers</li>
                    <li>Invoices</li>
                    <li>Payments</li>
                  </ul>
                </div>
              </div>
            {:else if f.id === 'ask'}
              <div class="chat">
                <p class="bubble you"><span class="who">You</span>Add customers, invoices and payments.</p>
                <p class="bubble bot">
                  <span class="who">Assistant</span>Adding three building blocks. Each brings its own lists and screens.
                </p>
              </div>
              <ul class="chips picked">
                <li>Customers</li>
                <li>Invoices</li>
                <li>Payments</li>
              </ul>
            {:else if f.id === 'screens'}
              <div class="shell">
                <ul class="side" aria-label="Menu">
                  <li class="on">Customers</li>
                  <li>Invoices</li>
                  <li>Payments</li>
                </ul>
                <table class="grid">
                  <caption class="sr">A list of customers with sample data</caption>
                  <thead>
                    <tr><th scope="col">Name<span class="type">text</span></th><th scope="col">Notes<span class="type">text</span></th></tr>
                  </thead>
                  <tbody>
                    <tr><td>Acme Ltd</td><td>Net 30</td></tr>
                    <tr><td>Birch &amp; Co</td><td>VIP</td></tr>
                    <tr><td>Cole Farm</td><td>Weekly</td></tr>
                  </tbody>
                </table>
              </div>
              <p class="hint">Sample data. Each list and screen comes from a building block.</p>
            {:else}
              <div class="chat">
                <p class="bubble you"><span class="who">You</span>Remove the Notes field from Customers.</p>
              </div>
              <div class="approval">
                <p class="wait">Waiting for you</p>
                <p class="what">Remove the field Notes from Customers</p>
                <p class="map">The values stored in Notes would be lost.</p>
                <div class="actions" aria-hidden="true"><span class="btn go">Approve</span><span class="btn">Deny</span></div>
              </div>
              <p class="hint">Approved changes go into a version history and can usually be undone.</p>
            {/if}
          </div>
        </figure>
    {/each}
  </div>
</section>

<style>
  .sketch {
    display: grid;
    gap: 1rem;
  }
  .note {
    margin: 0;
    max-width: 62ch;
    color: var(--muted);
    font-size: 0.9rem;
  }
  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .controls {
    min-height: 2.5rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
    justify-content: space-between;
  }
  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  button {
    font: inherit;
    font-size: 0.9rem;
    color: var(--ink);
    background: transparent;
    border: 1px solid var(--control);
    border-radius: 999px;
    padding: 0.4rem 0.85rem;
    min-height: 2.5rem;
    cursor: pointer;
  }
  button:hover {
    border-color: var(--ink);
  }
  button[aria-pressed='true'] {
    background: var(--ink);
    color: var(--bg);
    border-color: var(--ink);
  }
  .n {
    display: inline-block;
    min-width: 1.2em;
    margin-right: 0.4em;
    font-variant-numeric: tabular-nums;
  }

  .stage {
    display: grid;
    gap: 1.25rem;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 19rem), 1fr));
  }
  .frame {
    margin: 0;
    display: grid;
    gap: 0.6rem;
    align-content: start;
  }
  figcaption {
    font-weight: 600;
  }
  .window {
    background: var(--paper);
    border: 1px solid var(--rule);
    border-radius: 0.5rem;
    padding: 1rem;
    display: grid;
    gap: 0.9rem;
    min-height: 12rem;
    align-content: start;
    overflow-x: auto;
  }

  .grid {
    border-collapse: collapse;
    font-family: var(--mono);
    font-size: 0.86rem;
    width: 100%;
  }
  .grid th,
  .grid td {
    border: 1px solid var(--rule);
    padding: 0.4rem 0.55rem;
    text-align: left;
    white-space: nowrap;
  }
  .grid thead th {
    background: var(--head);
    font-weight: 600;
  }
  .type {
    display: block;
    font-weight: 400;
    font-size: 0.74rem;
    color: var(--accent);
  }
  .shell {
    display: grid;
    grid-template-columns: 7.5rem minmax(0, 1fr);
    gap: 0.9rem;
    align-items: start;
  }
  .side {
    margin: 0;
    padding: 0;
    list-style: none;
    border-right: 1px solid var(--rule);
    padding-right: 0.6rem;
    font-size: 0.88rem;
    display: grid;
    gap: 0.25rem;
  }
  .side li {
    padding: 0.2rem 0.4rem;
    border-radius: 0.25rem;
  }
  .side .on {
    background: var(--head);
    font-weight: 600;
  }
  .main {
    display: grid;
    gap: 0.5rem;
  }
  .empty {
    margin: 0;
    font-weight: 600;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .chips li {
    border: 1px dashed var(--control);
    border-radius: 0.4rem;
    padding: 0.3rem 0.7rem;
    font-size: 0.9rem;
  }
  .picked li {
    border-style: solid;
    background: var(--head);
    font-weight: 600;
  }
  .hint {
    margin: 0;
    font-size: 0.88rem;
    color: var(--muted);
  }
  .chat {
    display: grid;
    gap: 0.5rem;
  }
  .bubble {
    margin: 0;
    padding: 0.55rem 0.75rem;
    border-radius: 0.5rem;
    font-size: 0.92rem;
    max-width: 34ch;
  }
  .who {
    display: block;
    font-size: 0.78rem;
    color: var(--muted);
  }
  .you {
    justify-self: end;
    background: var(--head);
  }
  .bot {
    border: 1px solid var(--rule);
  }
  .approval {
    border: 2px solid var(--mark-edge);
    background: var(--mark);
    color: var(--mark-ink);
    border-radius: 0.5rem;
    padding: 0.9rem 1rem;
    display: grid;
    gap: 0.4rem;
  }
  .approval p {
    margin: 0;
  }
  .wait {
    font-size: 0.82rem;
    font-weight: 600;
  }
  .what {
    font-weight: 600;
    font-size: 1.02rem;
  }
  .actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.4rem;
  }
  .btn {
    border: 1px solid var(--mark-ink);
    border-radius: 0.35rem;
    padding: 0.3rem 0.8rem;
    font-size: 0.9rem;
  }
  .btn.go {
    background: var(--mark-ink);
    color: var(--mark);
  }
  @media (prefers-reduced-motion: no-preference) and (scripting: enabled) {
  .stage {
    grid-template-columns: 1fr;
  }
  .frame {
    grid-area: 1 / 1;
    visibility: hidden;
    opacity: 0;
    transition:
      opacity 0.5s ease,
      visibility 0s linear 0.5s;
  }
  .frame[data-active='true'] {
    visibility: visible;
    opacity: 1;
    transition: opacity 0.5s ease;
  }
  }
</style>
