// Erzeugt die App-Icons (braucht Playwright). Aufruf: node tools/make-icons.mjs
import { createRequire } from "node:module";
import fs from "node:fs";
const { chromium } = createRequire(import.meta.url)("playwright");
const svg = (s) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 100 100">
<rect width="100" height="100" fill="#0c2236"/>
<circle cx="50" cy="50" r="40" fill="#bfe3f4"/>
<path d="M36 20l12-4 10 3 9 8-3 9 5 8-5 10 2 9-9 8-12 2-8-7-9-1-3-9 4-8-4-8 5-9z" fill="#e3ecd0" stroke="#6d8159" stroke-width="1.5" stroke-linejoin="round"/>
<path d="M42 28l6 10 9-6" fill="none" stroke="#2678b5" stroke-width="2.4" stroke-linecap="round"/>
<path d="M44 40l-4 14 7 12" fill="none" stroke="#2678b5" stroke-width="2.4" stroke-linecap="round"/>
<circle cx="56" cy="58" r="3.4" fill="#ff6b6b"/>
<path d="M69 18l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill="#ffc533"/></svg>`;
const b = await chromium.launch();
for (const s of [180, 192, 512]) {
  const p = await b.newPage({ viewport: { width: s, height: s } });
  await p.setContent(`<body style="margin:0">${svg(s)}</body>`);
  await p.screenshot({ path: `public/icons/icon-${s}.png` });
}
await b.close();
console.log("icons ok");
