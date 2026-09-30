#!/usr/bin/env node
// Run many Jev tasks over ONE browser connection, so the browser asks "Allow remote debugging?" once per run.
// Reuses the jev-browser skill's own modules unchanged.
//
//   node tools/jev-run.mjs tasks/roles.json [--browser yours|host:port] [--pause 2000]
//
// tasks file: JSON array of
//   { "label": "...", "url": "...", "goal": "...", "texts": ["..."],
//     "secret": "..." | "secretEnv": "ENV_VAR_NAME", "maxSteps": 8,
//     "expect": { "titleStartsWith": "", "titleIncludes": "", "urlIncludes": "", "textIncludes": "" } }
// Tasks without "expect" pass when Jev answers DONE. Exit code is 1 if any task fails.

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";

const SKILL = process.env.JEV_SKILL_DIR || join(homedir(), ".claude/skills/jev-browser/scripts");
const { decide, fingerprint } = await import(pathToFileURL(join(SKILL, "core.mjs")));
const { Chrome, sleep } = await import(pathToFileURL(join(SKILL, "browser.mjs")));

const { values: args, positionals } = parseArgs({
  allowPositionals: true,
  options: { browser: { type: "string", default: "yours" }, pause: { type: "string", default: "2000" } },
});
if (!positionals[0]) { console.error("usage: node tools/jev-run.mjs <tasks.json> [--browser yours|host:port] [--pause ms]"); process.exit(2); }
const tasks = JSON.parse(readFileSync(positionals[0], "utf8"));

const API = "https://api.typesafe.ai/v1/systemone";
const KEY = process.env.TYPESAFE_API_KEY; // never printed
if (!KEY) { console.error("TYPESAFE_API_KEY is not set"); process.exit(2); }

async function ask(body) {
  const started = performance.now();
  let res;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(API, { method: "POST", headers: { authorization: `Bearer ${KEY}`, "content-type": "application/json" }, body: JSON.stringify(body) });
    if (![429, 503, 529].includes(res.status)) break;
    await sleep(500 * 2 ** attempt);
  }
  if (!res.ok) throw new Error(`Jev returned HTTP ${res.status}`);
  const { answers, usage } = await res.json();
  return { answers, usage, ms: Math.round(performance.now() - started) };
}

const chrome = await Chrome.open(args.browser, { headless: false });

async function run(task) {
  const secret = task.secretEnv ? process.env[task.secretEnv] ?? "" : task.secret ?? "";
  const texts = task.texts ?? [];
  const maxSteps = task.maxSteps ?? 8;
  const history = [];
  let status = "max_steps", page, stale = 0;
  await chrome.goto(task.url);
  while (history.length < maxSteps) {
    page = await chrome.observe();
    if (history.length) history.at(-1).page_changed ??= history.at(-1).fingerprint !== fingerprint(page);
    const stuck = history.slice(-3);
    if (stuck.length === 3 && stuck.every(h => h.page_changed === false)) { status = "blocked"; break; }
    const d = await decide(ask, { goal: task.goal, page, texts, secret, history });
    if (d.operation === "DONE" || d.operation === "BLOCKED") { status = d.operation.toLowerCase(); break; }
    const { e, option, text } = d;
    if (e) {
      const aims = d.operation !== "SELECT";
      let point = await chrome.locate(e.node, `Jev · ${d.operation} · ${Math.round(d.p * 100)}%`, aims);
      if (!point) { if (++stale > 5) { status = "blocked"; break; } await chrome.settle(); continue; }
      await sleep(300);
      point = (await chrome.locate(e.node, "", aims)) ?? point;
      if (d.operation === "SELECT") await chrome.select(e.node, option.value);
      else await chrome.click(point);
      if (d.operation === "TYPE") await chrome.type(e.node, text);
    } else await chrome.enter();
    history.push({ operation: d.operation, target: e && `${e.role} "${e.label}"`, text: d.secret ? "••••••" : text, url: page.url, fingerprint: fingerprint(page) });
    await chrome.settle();
  }
  page = await chrome.observe();
  await sleep(Number(args.pause));
  return { status, steps: history.length, title: page.title, url: page.url, text: page.text };
}

function check(task, r) {
  const x = task.expect;
  if (!x) return r.status === "done";
  return (!x.titleStartsWith || r.title.startsWith(x.titleStartsWith))
    && (!x.titleIncludes || r.title.includes(x.titleIncludes))
    && (!x.urlIncludes || r.url.includes(x.urlIncludes))
    && (!x.textIncludes || r.text.includes(x.textIncludes));
}

let failed = 0;
try {
  for (const [i, task] of tasks.entries()) {
    const r = await run(task);
    const ok = check(task, r);
    if (!ok) failed++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${String(i + 1).padStart(2)}. ${task.label ?? task.goal.slice(0, 50)}  [${r.status}, ${r.steps} steps] ${r.title}`);
  }
} finally {
  chrome.socket.close(); // leave the tab open
}
console.log(`\n${tasks.length - failed}/${tasks.length} passed`);
process.exit(failed ? 1 : 0);
