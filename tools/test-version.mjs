// Versionsnummer passt zum Cache-Namen, und jede Datei der Seite ist offline im Cache.
import fs from "node:fs";
const sw = fs.readFileSync("public/sw.js", "utf8"), ver = fs.readFileSync("public/version.js", "utf8"), html = fs.readFileSync("public/index.html", "utf8");
let fails = 0;
const check = (c, m) => { if (!c) { fails++; console.log("FAIL", m); } else console.log("ok  ", m); };
const cache = +(sw.match(/CACHE = "de-entdecker-v(\d+)"/) || [])[1], n = +(ver.match(/n:\s*(\d+)/) || [])[1];
check(cache > 0 && cache === n, `Version ${n} passt zum Cache v${cache}`);
const files = (sw.match(/const FILES = \[([^\]]*)\]/) || [, ""])[1].match(/"[^"]+"/g).map((x) => x.slice(1, -1));
const used = [...html.matchAll(/(?:src|href)="([^"#?]+)"/g)].map((m) => m[1]).filter((x) => !/^https?:/.test(x));
for (const f of used) check(files.includes(f), `Offline-Cache enthält ${f}`);
for (const f of files) if (f !== "./") check(fs.existsSync("public/" + f), `Datei vorhanden: ${f}`);
console.log(fails ? `${fails} Fehler` : "Version und Cache ok");
process.exit(fails ? 1 : 0);
