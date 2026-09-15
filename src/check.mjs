import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const pages = ['me', 'contact', 'work/red-letter', 'work/crucible', 'work/latent-diffusion'];
const files = ['index.html', 'app.js', 'style.css', ...pages.map((page) => `${page}/index.html`)];
const source = await Promise.all(files.map((file) => readFile(resolve(root, file), 'utf8')));
const combined = source.join('\n');

for (const term of ['sprite', 'typing-sprite', 'waving', 'open-studio', 'cafe-scribble', 'hatch-pet']) {
  if (combined.toLowerCase().includes(term)) throw new Error(`stale animation reference: ${term}`);
}

const html = source[0];
if (!html.includes('<title>anant jamuar</title>') || !html.includes('<link rel="icon" type="image/png" href="/assets/portrait-icon.png">')) throw new Error('Homepage title or round portrait icon is missing');
if (!html.includes('<aside class="desk"') || !html.includes('id="open-focus"') || !html.includes('id="focus"')) {
  throw new Error('main shell is missing the reserved stage or focus experiment');
}
if (html.includes('id="open-studio"') || html.includes('id="character"')) throw new Error('removed controls are still present');

for (const term of ['sample projects', 'illustrative portfolio content', 'contact details are being added', 'ready for your story']) {
  if (combined.toLowerCase().includes(term)) throw new Error(`placeholder content remains: ${term}`);
}

console.log('Portfolio checks passed: Anant’s content, project pages, focus dialog, and clean shell are present.');

for (const [i, page] of source.entries()) {
  if (!files[i].endsWith('.html')) continue;
  for (const marker of ['activity-card', 'square-playground', 'https://github.com/ActiveAngrily']) {
    if (!page.includes(marker)) throw new Error(`${files[i]} missing ${marker}`);
  }
}
for (const slug of ['red-letter', 'crucible']) {
  const page = await readFile(resolve(root, 'work', slug, 'index.html'), 'utf8');
  for (const marker of [`case-study ${slug}`, '<figure class="project-visual">', '<figcaption>', 'next-project', '← all work']) {
    if (!page.includes(marker)) throw new Error(`${slug} missing ${marker}`);
  }
  if (page.includes('A few useful details.')) throw new Error('Old generic preview remains');
}
const latentDiffusion = await readFile(resolve(root, 'work/latent-diffusion/index.html'), 'utf8');
for (const marker of ['case-study latent-diffusion', '<h2>abstract</h2>', '<h2>built with</h2>', 'tech-stack', 'next-project', '← all work']) {
  if (!latentDiffusion.includes(marker)) throw new Error(`latent-diffusion missing ${marker}`);
}
if (latentDiffusion.includes('<figure class="project-visual">') || latentDiffusion.includes('project-evidence')) {
  throw new Error('latent-diffusion still contains the removed project card');
}
console.log('Shared GitHub card and three editorial project pages passed.');

const redLetter = await readFile(resolve(root, 'work/red-letter/index.html'), 'utf8');
for (const heading of ['Why I built it', 'How it works', 'Getting the summaries right', 'A bug that took some digging', 'What came out of it', 'Built with']) {
  if (!redLetter.includes(`<h2>${heading.toLowerCase()}</h2>`)) throw new Error(`Red Letter missing section: ${heading}`);
}
for (const marker of ['99.8%', '1,000', 'https://redletter.cc.cd/', 'https://github.com/ActiveAngrily/red_letter', '/assets/red-letter-logo.svg']) {
  if (!redLetter.includes(marker)) throw new Error(`Red Letter missing content: ${marker}`);
}
await readFile(resolve(root, 'assets/red-letter-logo.svg'));
if (html.includes('class="rl-paper"') || !html.includes('red letter <img class="project-logo"')) throw new Error('Red Letter homepage must show title and logo without the cover');
console.log('Red Letter copy, cover, logo, and project links passed.');

for (const [slug, title] of [['red-letter', 'Red Letter'], ['crucible', 'Crucible']]) {
  const page = await readFile(resolve(root, 'work', slug, 'index.html'), 'utf8');
  const heading = page.match(/<h1 class="project-heading">(.*?)<\/h1>/)?.[1];
  if (!heading?.startsWith('<') || !heading.endsWith(title.toLowerCase())) throw new Error(`${slug}: logo must precede title`);
  if (!page.includes('class="project-links"')) throw new Error(`${slug}: shared action spacing missing`);
}
console.log('Both project headings use logo-first order and shared layout styles.');

// Check every generated route, including references outside the case-study fixtures.
for (const [i, page] of source.entries()) {
  if (!files[i].endsWith('.html')) continue;
  const ids = [...page.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  if (new Set(ids).size !== ids.length) throw new Error(`${files[i]} has duplicate IDs`);
  if ((page.match(/<h1\b/g) || []).length !== 1) throw new Error(`${files[i]} needs one main heading`);
  if (!page.includes('aria-labelledby="focus-title"')) throw new Error('Focus dialog needs a name');
  for (const [, url] of page.matchAll(/(?:href|src)="(\/[^"#?]*)"/g)) {
    await readFile(resolve(root, '.' + url + (url.endsWith('/') ? 'index.html' : '')));
  }
}
if (!html.includes('<article class="project project-in-progress">') || html.includes('href="/work/curieon/"')) throw new Error('Curieon must remain an unlinked in-progress card');
console.log('All local links, assets, headings, dialog names, and IDs passed.');

// Exercise the browser script without adding a test dependency.
const { runInNewContext } = await import('node:vm');
const { strict: assert } = await import('node:assert');
const elements = new Map();
const element = id => {
  if (!elements.has(id)) elements.set(id, { textContent: '', handlers: {}, addEventListener(type, fn) { this.handlers[type] = fn; } });
  return elements.get(id);
};
const dialog = element('focus');
dialog.querySelector = () => element('close');
dialog.getBoundingClientRect = () => ({left:100, right:400, top:100, bottom:500});
dialog.close = () => { dialog.closed = true; };
let now = 0;
class Clock extends Date { static now() { return now; } }
runInNewContext(source[1], {document:{getElementById:element, querySelector:()=>null}, location:{href:'http://example.test/',pathname:'/',search:''}, history:{replaceState(){}}, Date:Clock, setInterval(){}, URL, URLSearchParams});
assert.ok(html.includes('<span id="graduation" hidden>'));
element('long-intro').handlers.change({target:{checked:true}});
assert.equal(element('graduation').hidden, false);
element('long-intro').handlers.change({target:{checked:false}});
assert.equal(element('graduation').hidden, true);
dialog.handlers.click({target:dialog,clientX:120,clientY:120});
assert.equal(dialog.closed, undefined, 'dialog padding must not dismiss it');
dialog.handlers.click({target:dialog,clientX:50,clientY:120});
assert.equal(dialog.closed, true, 'backdrop dismisses the dialog');
element('timer-toggle').handlers.click();
now = 61000;
element('timer-toggle').handlers.click();
assert.equal(element('timer').textContent, '23:59');
now += 10000;
element('timer-toggle').handlers.click();
now += 24 * 60000;
element('timer-toggle').handlers.click();
assert.equal(element('timer').textContent, '25:00');
element('timer-reset').handlers.click();
assert.equal(element('timer-toggle').textContent, 'start focusing');
console.log('Timer elapsed time, pause, restart, reset, and backdrop checks passed.');
