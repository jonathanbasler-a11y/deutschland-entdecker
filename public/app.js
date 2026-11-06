"use strict";
(function () {
  const { judge, judgeAll, judgeEach, splitAnswers, judgeNumber, gradeFor, sample, shuffle, diffMark, closest, genOthers } = DELogic;
  const B = window.DEBegleiter;
  const app = document.getElementById("app");
  const KEY = "deutschland-entdecker-v1";
  const TEST = window.__DE_TEST || {};

  /* ================= Speicher ================= */
  const defaults = () => ({
    name: "", askedName: false, xp: 0, items: {}, days: {}, mins: {}, badges: {}, probes: [], blitzBest: 0, topic: "all",
    sound: true, speak: false,
    // Einstellungen aus der Eltern-Übersicht
    roundLen: 8, calm: false, autoRead: false, showBlitz: true, lzkDate: LZK_DATE,
    mission: { day: "", step: 0 }, missionsDone: 0, blankMode: "write", blankStyle: "sheet", ui: { more: false },
    subject: "de", // gewähltes Fach: "de" (Deutschland) oder eines aus DE_FAECHER
    // Begleiter-Hund (für alle Fächer), Boss-Kämpfe, Geister-Lauf der Blitzrunde
    pet: { name: "Pixel", blocks: 0, bosses: {}, lastGreet: "", petted: 0, stage: 0, gear: 0 }, bossOn: true, blitzTrace: [],
  });
  let S = defaults();
  // Spielstand mehrfach sichern: Hauptschlüssel, zweite Kopie, IndexedDB-Spiegel, dazu Sicherungsdatei (Eltern-Übersicht)
  const BAK = KEY + "-bak";
  const readKey = (k) => { try { const t = localStorage.getItem(k); if (!t) return null; const o = JSON.parse(t); return o && typeof o === "object" && !Array.isArray(o) ? o : null; } catch (e) { try { localStorage.setItem(k + "-defekt", localStorage.getItem(k)); } catch (e2) { /* egal */ } return null; } };
  const primary = readKey(KEY), bak = readKey(BAK);
  { const raw = primary || bak; if (raw) { S = Object.assign(defaults(), raw); try { sessionStorage.removeItem("de-restored"); } catch (e) { /* egal */ } } }
  const idb = (fn) => { try { const q = indexedDB.open("de-entdecker-save", 1); q.onupgradeneeded = () => q.result.createObjectStore("s"); q.onsuccess = () => { try { fn(q.result); } catch (e) { /* egal */ } }; } catch (e) { /* ohne IndexedDB weiter */ } };
  // Aufholbonus: solange er läuft, zählen neue Punkte aus allen Fächern mehrfach (Zusatz steht in S.boost.extra)
  const rawXp = () => S.xp + FAECH.reduce((a, f) => a + (f.xp ? f.xp() : 0), 0);
  function accrue() {
    const b = S.boost;
    if (!b || typeof b !== "object") return;
    const raw = rawXp(), d = raw - (b.last == null ? raw : b.last);
    if (d > 0 && Date.now() <= b.until) b.extra = (b.extra || 0) + d * ((b.mult || 3) - 1);
    b.last = raw;
  }
  const boostLeft = () => (S.boost && Date.now() <= S.boost.until ? S.boost.until - Date.now() : 0);
  const save = () => {
    let t;
    try { accrue(); } catch (e) { /* vor dem Start egal */ }
    try { t = JSON.stringify(S); localStorage.setItem(KEY, t); localStorage.setItem(BAK, t); } catch (e) { /* egal */ }
    if (t) idb((db) => db.transaction("s", "readwrite").objectStore("s").put(t, "state"));
  };
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* egal */ }
  // Kein lesbarer Stand in localStorage (fehlt oder kaputt), aber IndexedDB hat noch einen: wiederherstellen.
  // Flag nur gegen Endlos-Neuladen; nach erfolgreichem Lesen wird es wieder gelöscht (siehe oben).
  if (!primary && !bak && !sessionStorage.getItem("de-restored")) {
    idb((db) => { const g = db.transaction("s").objectStore("s").get("state"); g.onsuccess = () => { if (g.result) { try { localStorage.setItem(KEY, g.result); localStorage.setItem(BAK, g.result); sessionStorage.setItem("de-restored", "1"); location.reload(); } catch (e) { /* egal */ } } }; });
  }
  // Sicherungsdatei laden und speichern
  const backupDownload = () => {
    const blob = new Blob([JSON.stringify(S)], { type: "application/json" }), a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `entdecker-sicherung-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };
  const backupLoad = (file) => {
    const fr = new FileReader();
    fr.onload = () => {
      try { const o = JSON.parse(fr.result); if (!o || typeof o !== "object" || Array.isArray(o) || !("xp" in o || "pet" in o || "kompass" in o)) throw new Error("kein Spielstand"); localStorage.setItem(KEY, JSON.stringify(o)); localStorage.setItem(BAK, JSON.stringify(o)); location.reload(); }
      catch (e) { toast("Diese Datei ist keine Sicherung."); }
    };
    fr.readAsText(file);
  };

  // Weitere Fächer (z. B. Kopfrechnen) melden sich über window.DE_FAECHER an, siehe unten "Fächer".
  let FAECH = [];
  const fachOf = (id) => FAECH.find((f) => f.id === id);
  const fachFor = (name) => FAECH.find((f) => name && name.startsWith(f.prefix));

  const pad = (n) => String(n).padStart(2, "0");
  const dayKey = (d = new Date()) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const $ = (sel, root = document) => root.querySelector(sel);

  /* ================= Fortschritt ================= */
  const lvl = (id, sk) => (S.items[id] && S.items[id][sk]) || 0;
  const stars = (it) => it.skills.filter((sk) => lvl(it.id, sk) >= 1).length;
  const lastWrong = (it) => S.items[it.id] && S.items[it.id].last === "x";
  const wrongs = (it) => (S.items[it.id] && S.items[it.id].w) || 0;
  const catItems = (cat) => ITEMS.filter((i) => i.cat === cat);
  const catStars = (cat) => {
    const l = cat === "all" ? ITEMS : catItems(cat);
    return { got: l.reduce((a, i) => a + stars(i), 0), max: l.reduce((a, i) => a + i.skills.length, 0), full: l.filter((i) => stars(i) === i.skills.length).length, n: l.length };
  };
  const total = () => Object.values(S.days).reduce((a, b) => a + b, 0);
  function record(it, skill, res) {
    const e = S.items[it.id] || (S.items[it.id] = {});
    let l = e[skill] || 0;
    if (res === "first") l = Math.min(2, l + 1);
    else if (res === "fail") l = Math.max(0, l - 1);
    e[skill] = l;
    e.last = res === "fail" ? "x" : "o";
    e.n = (e.n || 0) + 1;
    if (res === "fail") e.w = (e.w || 0) + 1;
    e.t = dayKey();
    S.days[dayKey()] = (S.days[dayKey()] || 0) + 1;
  }
  // Die Serie zählt Tage, an denen in irgendeinem Fach geübt wurde.
  const active = (k) => !!S.days[k] || FAECH.some((f) => f.activeOn && f.activeOn(k));
  function streak() {
    let n = 0;
    const d = new Date();
    if (!active(dayKey(d))) d.setDate(d.getDate() - 1);
    while (active(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function daysToLZK() {
    const a = new Date(dayKey() + "T00:00:00"), b = new Date((S.lzkDate || LZK_DATE) + "T00:00:00");
    return Math.round((b - a) / 864e5);
  }
  // Übungszeit pro Tag (Minuten), je Runde höchstens 20 Minuten gezählt
  let sessionMin = 0, pauseHinted = false;
  function addTime(r) {
    if (!r || r.timed) return;
    r.timed = true;
    const m = Math.min(20, (Date.now() - r.t0) / 60000);
    S.mins[dayKey()] = Math.round(((S.mins[dayKey()] || 0) + m) * 10) / 10;
    sessionMin += m;
    save();
  }

  const full = (cat) => catItems(cat).every((i) => stars(i) === i.skills.length);
  const BADGES = [
    { id: "start", icon: "🚀", name: "Erster Schritt", desc: "10 Aufgaben gelöst", ok: () => total() >= 10 },
    { id: "mission1", icon: "🎯", name: "Mission erfüllt", desc: "Die erste Tagesmission geschafft", ok: () => S.missionsDone >= 1 },
    { id: "mission3", icon: "🏅", name: "Dranbleiber", desc: "3 Tagesmissionen geschafft", ok: () => S.missionsDone >= 3 },
    { id: "stumm", icon: "🗺️", name: "Kartenzeichner", desc: "Eine stumme Karte ganz ohne Fehler", ok: () => !!S.blankPerfect },
    { id: "laender", icon: "🏙️", name: "Länder-Kenner", desc: `Alle ${catItems("states").length} Bundesländer mit 3 Sternen`, ok: () => full("states") },
    { id: "nachbarn", icon: "🧭", name: "Nachbarn-Profi", desc: `Alle ${catItems("neighbors").length} Nachbarländer mit 3 Sternen`, ok: () => full("neighbors") },
    { id: "fluss", icon: "🌊", name: "Flussprofi", desc: "Alle Flüsse mit 3 Sternen", ok: () => catItems("water").filter((i) => i.kind === "Fluss").every((i) => stars(i) === 3) },
    { id: "wasser", icon: "⚓", name: "Wassermeister", desc: `Alle ${catItems("water").length} Flüsse, Seen und Meere mit 3 Sternen`, ok: () => full("water") },
    { id: "gipfel", icon: "⛰️", name: "Gipfelstürmer", desc: `Alle ${catItems("mountains").length} Gebirge und Berge mit 3 Sternen`, ok: () => full("mountains") },
    { id: "allg", icon: "💡", name: "Allgemeinwissen", desc: "Alle Fragen zu Allgemeines gemeistert", ok: () => full("general") },
    { id: "serie3", icon: "🔥", name: "3 Tage in Folge", desc: "Drei Tage hintereinander geübt", ok: () => streak() >= 3 },
    { id: "serie5", icon: "🌟", name: "5 Tage in Folge", desc: "Fünf Tage hintereinander geübt", ok: () => streak() >= 5 },
    { id: "blitz", icon: "⚡", name: "Blitzmeister", desc: "15 Treffer in einer Blitzrunde", ok: () => S.blitzBest >= 15 },
    { id: "probe2", icon: "🎓", name: "Probe bestanden", desc: "Probe-LZK mit Note 2 oder besser", ok: () => S.probes.some((p) => p.grade <= 2) },
    { id: "probe1", icon: "🏆", name: "Fehlerfrei", desc: "Probe-LZK ohne einen Fehler", ok: () => S.probes.some((p) => p.pct === 100) },
    { id: "alles", icon: "👑", name: "Deutschland-Profi", desc: "Alles mit 3 Sternen", ok: () => ITEMS.every((i) => stars(i) === i.skills.length) },
  ];
  const allBadges = () => BADGES.concat(...FAECH.map((f) => f.badges || []));
  function checkBadges() {
    petCheck();
    for (const b of allBadges()) {
      if (!S.badges[b.id] && b.ok()) {
        S.badges[b.id] = dayKey();
        save();
        toast(b.icon + " Neues Abzeichen: " + b.name);
        confetti(90);
        tone("win");
      }
    }
  }

  /* ================= Ton, Sprache, Konfetti ================= */
  let ac;
  // [Frequenz, Start, Wellenform, Endfrequenz]
  const TONES = {
    ok: [[660, 0], [880, 0.09]], bad: [[220, 0, "triangle"], [180, 0.1, "triangle"]], win: [[523, 0], [659, 0.1], [784, 0.2], [1047, 0.3]],
    wuff: [[560, 0, "sawtooth", 260], [500, 0.14, "sawtooth", 240]], hit: [[180, 0, "square", 55], [90, 0.05, "triangle", 40]],
    boss: [[196, 0, "triangle"], [185, 0.16, "triangle"], [147, 0.32, "triangle"]], pass: [[784, 0], [988, 0.08], [1319, 0.16]],
  };
  // combo: jede richtige Antwort in Folge einen Halbton höher (bis eine Oktave)
  function tone(kind, combo) {
    const mult = kind === "ok" && combo > 1 ? Math.pow(2, Math.min(12, combo - 1) / 12) : 1;
    window.__DE_TONE = { kind, mult };
    if (!S.sound) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === "suspended") ac.resume();
      const vol = S.calm ? 0.08 : kind === "wuff" || kind === "hit" ? 0.12 : 0.18;
      for (const [f, t, type, f2] of TONES[kind]) {
        const o = ac.createOscillator(), g = ac.createGain(), now = ac.currentTime + t;
        o.type = type || "sine";
        o.frequency.setValueAtTime(f * mult, now);
        if (f2) o.frequency.exponentialRampToValueAtTime(f2, now + 0.12);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(vol, now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        o.connect(g); g.connect(ac.destination);
        o.start(now); o.stop(now + 0.25);
      }
    } catch (e) { /* kein Ton */ }
  }
  function say(text, done) {
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "de-DE"; u.rate = 0.9;
      if (done) { u.onend = done; u.onerror = done; }
      speechSynthesis.speak(u);
    } catch (e) { if (done) done(); }
  }
  const cv = document.getElementById("confetti");
  let parts = [], raf = 0;
  function confetti(n = 70) {
    if (S.calm || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    cv.width = innerWidth; cv.height = innerHeight;
    const cols = ["#ffc533", "#34c98b", "#52c1f5", "#ff6b6b", "#a98bff", "#ff9a5c"];
    for (let i = 0; i < n; i++) parts.push({ x: innerWidth / 2 + (Math.random() - 0.5) * 200, y: innerHeight * 0.4, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 14 - 4, s: 6 + Math.random() * 8, c: cols[i % cols.length], r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, life: 90 + Math.random() * 40 });
    if (!raf) raf = requestAnimationFrame(stepConfetti);
  }
  function stepConfetti() {
    const g = cv.getContext("2d");
    g.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter((p) => p.life-- > 0);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.45; p.vx *= 0.99; p.r += p.vr;
      g.save(); g.translate(p.x, p.y); if (!p.sq) g.rotate(p.r); g.fillStyle = p.c; g.globalAlpha = Math.min(1, p.life / 30);
      if (p.sq) g.fillRect(Math.round(-p.s / 2), Math.round(-p.s / 2), p.s, p.s); else g.fillRect(-p.s / 2, -p.s / 3, p.s, p.s / 1.6);
      g.restore();
    }
    raf = parts.length ? requestAnimationFrame(stepConfetti) : 0;
    if (!raf) g.clearRect(0, 0, cv.width, cv.height);
  }
  const quiet = () => S.calm || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fx = {
    // eckige Splitter in Blockfarben an einer Stelle des Bildschirms
    burst(x, y, n = 14, cols) {
      if (quiet()) return;
      if (cv.width !== innerWidth) { cv.width = innerWidth; cv.height = innerHeight; }
      cols = cols || ["#5aa64a", "#8a5a2b", "#ffd23f", "#8d9196", "#bfeaff", "#c47f3c"];
      for (let i = 0; i < n; i++) parts.push({ sq: true, x, y, vx: (Math.random() - 0.5) * 9, vy: -Math.random() * 8 - 2, s: 5 + Math.round(Math.random() * 4), c: cols[i % cols.length], r: 0, vr: 0, life: 40 + Math.random() * 20 });
      if (!raf) raf = requestAnimationFrame(stepConfetti);
    },
    burstAt(el, n, cols) { if (!el) return; const r = el.getBoundingClientRect(); fx.burst(r.left + r.width / 2, r.top + r.height / 2, n, cols); },
    // "+10" fliegt vom Antwortfeld zur Punktezahl
    plus(from, to, text) {
      if (quiet() || !from || !to || !from.getBoundingClientRect) return;
      const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
      const el = document.createElement("div");
      el.className = "flyplus"; el.textContent = text;
      el.style.left = a.left + a.width / 2 + "px"; el.style.top = a.top + "px";
      document.body.appendChild(el);
      const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top - a.top;
      try {
        el.animate([{ transform: "translate(-50%, 0) scale(1)", opacity: 1 }, { transform: "translate(-50%, -24px) scale(1.25)", opacity: 1, offset: 0.35 }, { transform: `translate(calc(-50% + ${dx}px), ${dy}px) scale(.6)`, opacity: 0.2 }], { duration: 800, easing: "ease-in" }).onfinish = () => el.remove();
      } catch (e) { setTimeout(() => el.remove(), 800); }
    },
  };

  let toastT;
  function toast(msg) {
    document.querySelectorAll(".toast").forEach((t) => t.remove());
    const t = document.createElement("div");
    t.className = "toast"; t.textContent = msg; t.setAttribute("role", "status");
    document.body.appendChild(t);
    clearTimeout(toastT);
    toastT = setTimeout(() => t.remove(), 3200);
  }
  const applyCalm = () => document.body.classList.toggle("calm", !!S.calm);

  /* ================= Karte ================= */
  const BIG_HIT = { s_hb: 30, s_hh: 28, s_be: 28, w_chiemsee: 24, w_starnberg: 22, w_mueritz: 24, m_zugspitze: 28 };
  function mapMarkup() {
    const M = MAP;
    let s = `<svg class="map" viewBox="0 0 ${M.W} ${M.H}" role="img" aria-label="Karte von Deutschland"><rect class="sea" width="${M.W}" height="${M.H}"/>`;
    s += `<g>` + M.water.filter((w) => w.kind === "Meer").map((w) => `<path class="seapoly" data-id="w_${w.id}" d="${w.d}"/>`).join("") + `</g><g id="hlU"></g>`;
    s += `<g>` + M.others.map((d) => `<path class="land other" d="${d}"/>`).join("") + `</g>`;
    s += `<g>` + M.neighbors.map((n) => `<path class="land nb" data-id="n_${n.id}" d="${n.d}"/>`).join("") + `</g>`;
    s += `<g>` + M.states.map((x) => `<path class="land st" data-id="s_${x.id}" d="${x.d}"/>`).join("") + `</g>`;
    s += `<g>` + M.mountains.map((m) => `<path class="mtn" data-id="m_${m.id}" d="${m.d}"/>`).join("") + `</g>`;
    const rivers = M.water.filter((w) => w.kind === "Fluss");
    s += `<g>` + rivers.map((w) => `<path class="river" d="${w.d}"/>`).join("") + `</g>`;
    s += M.water.filter((w) => w.kind === "See").map((w) => `<path class="lake" d="${w.d}"/>`).join("");
    s += `<g>` + rivers.map((w) => `<path class="hit" data-id="w_${w.id}" d="${w.d}"/>`).join("") + M.water.filter((w) => w.kind === "See").map((w) => `<path class="hit lakehit" data-id="w_${w.id}" d="${w.d}"/>`).join("") + `</g>`;
    // Kinderfinger: kleine Ziele bekommen einen unsichtbaren Trefferkreis
    s += `<g>` + Object.entries(BIG_HIT).map(([id, r]) => { const it = BY_ID[id]; return `<circle class="hit dot" data-id="${id}" cx="${it.label[0]}" cy="${it.label[1]}" r="${r}"/>`; }).join("") + `</g>`;
    s += `<g id="hlO"></g><g id="lab"></g><g id="nums"></g></svg>`;
    return s;
  }
  const idsOf = (cat) => new Set(catItems(cat).map((i) => i.id));
  const askOf = (it) => it.ask || CATS[it.cat].ask;
  // Namen der anderen Begriffe derselben Art: ein Tippfehler darf keinem anderen Begriff näher sein
  const othersOf = (it) => catItems(it.cat).filter((x) => x.id !== it.id).flatMap((x) => [x.name].concat(x.alts));

  // Welches Ding wurde getippt? Nicht gesuchte Flächen (Gebirge, Flüsse) sind durchlässig.
  function pick(evt, cand) {
    for (const el of document.elementsFromPoint(evt.clientX, evt.clientY)) {
      if (!(el instanceof SVGElement)) continue;
      const id = el.dataset && el.dataset.id;
      if (id && cand.has(id)) return { id };
      if (el.classList.contains("land")) return { miss: true, under: id || null };
    }
    return { miss: true, under: null };
  }

  function clearHL() { const u = $("#hlU"), o = $("#hlO"); if (u) u.innerHTML = ""; if (o) o.innerHTML = ""; const l = $("#lab"); if (l) l.innerHTML = ""; }
  function highlight(it, cls) {
    const c = cls ? " " + cls : "";
    const sea = it.cat === "water" && it.kind === "Meer";
    const line = it.kind === "Fluss";
    let h = `<path class="${line ? "hl-line" : "hl-poly"}${c}" d="${it.d}"/>`;
    if (it.small || it.kind === "See") h += `<circle class="ring${c}" cx="${it.label[0]}" cy="${it.label[1]}" r="30"/>`;
    $(sea ? "#hlU" : "#hlO").insertAdjacentHTML("beforeend", h);
  }
  // Fokus: alles außer dem markierten Gebiet abdunkeln
  const focusMap = (on) => { const m = $(".stage .map"); if (m) m.classList.toggle("focus", !!on); };
  const labelCls = { states: "", neighbors: "t-nb", water: "t-water", mountains: "t-mtn" };
  // Position der Beschriftung (manche kleinen Seen liegen dicht beieinander)
  const textAt = (it) => { const d = LABEL_SHIFT[it.id] || [0, 0]; return [it.label[0] + d[0], it.label[1] + d[1]]; };
  function labels(items) {
    const l = $("#lab");
    l.innerHTML = items.map((it) => { const [x, y] = textAt(it); return `<text class="${labelCls[it.cat]}" x="${x}" y="${y}" ${it.small ? 'style="font-size:15px"' : ""}>${esc(it.name)}</text>`; }).join("");
  }

  const blend = (a, b, t) => {
    const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const [x, y] = [p(a), p(b)];
    return "#" + x.map((v, i) => pad(Math.round(v + (y[i] - v) * t).toString(16))).join("");
  };
  // "Meine Karte": was er kann, bekommt Farbe.
  function paintProgress(root) {
    const T = [0, 0.3, 0.65, 1];
    for (const it of ITEMS) {
      if (it.cat === "general") continue;
      const el = root.querySelector(`[data-id="${it.id}"]:not(.hit)`);
      if (!el) continue;
      const st = stars(it), t = T[Math.min(3, st)];
      if (it.cat === "states") el.style.fill = blend("#e3ecd0", it.hue, t);
      else if (it.cat === "neighbors") el.style.fill = blend("#efe7cb", "#ffcf5c", t);
      else if (it.cat === "mountains") { if (st) { el.style.fill = `rgba(178,122,61,${0.25 + t * 0.55})`; el.style.stroke = "#7c501f"; } }
    }
    root.querySelectorAll(".seapoly").forEach((el) => { const it = BY_ID[el.dataset.id]; el.style.fill = blend("#bfe3f4", "#4fb0e8", [0, 0.3, 0.65, 1][stars(it)]); });
    root.querySelectorAll(".river").forEach((el, i) => { const it = BY_ID["w_" + MAP.water.filter((w) => w.kind === "Fluss")[i].id]; el.style.strokeWidth = 2.2 + stars(it) * 1.6; });
  }

  /* ================= Begleiter: Pixel-Hund, Bauprojekte ================= */
  const pet = () => S.pet || (S.pet = defaults().pet);
  // Futter = Punkte aus allen Fächern zusammen
  const totalXp = () => { accrue(); return rawXp() + (S.gift || 0) + ((S.boost && S.boost.extra) || 0); };
  // Hund gewachsen oder neue Ausrüstung? Einmal feiern.
  function petCheck() {
    const p = pet(), xp = totalXp(), st = B.stageOf(xp), gear = B.gearOf(xp).length;
    if (st > (p.stage || 0)) { p.stage = st; p.gear = Math.max(p.gear || 0, gear); save(); toast(`🐶 ${p.name} ist gewachsen: ${B.STAGES[st].name}!`); confetti(90); tone("wuff"); return; }
    if (gear > (p.gear || 0)) { p.gear = gear; save(); toast(`🎁 ${p.name} hat etwas Neues: ${B.GEAR[gear - 1].name}!`); confetti(60); tone("win"); }
  }
  // Blöcke für die Bauprojekte; gibt zurück, was sich getan hat
  function giveBlocks(n) {
    const p = pet(), before = B.building(p.blocks || 0);
    p.blocks = (p.blocks || 0) + n;
    const after = B.building(p.blocks);
    save();
    const fin = after.done.length > before.done.length ? B.PROJECTS.find((x) => x.id === after.done[after.done.length - 1]) : null;
    const where = after.cur ? `${after.cur.name}: ${after.placed} von ${after.cur.size}` : "Bonus-Blöcke";
    return { n, fin, text: `🧱 +${n} ${n === 1 ? "Block" : "Blöcke"} (${where})${fin ? ` · 🏠 ${fin.name} fertig gebaut!` : ""}` };
  }
  function petWidget() {
    const p = pet(), xp = totalXp(), g = B.growth(xp, p.kind), happy = active(dayKey());
    let bubble = "";
    if (S.askedName && p.lastGreet !== dayKey()) { p.lastGreet = dayKey(); save(); bubble = `<span class="bubble">Wuff! Da bist du ja${S.name ? ", " + esc(S.name) : ""}!</span>`; }
    else if (!happy) bubble = `<span class="bubble soft">Ich warte auf dich!</span>`;
    return `<button class="petw ${happy ? "happy" : "wait"}" data-act="pet" aria-label="Mein ${esc(B.kindOf(p.kind).word)} ${esc(p.name)}">${B.dog(xp, "", "", p.kind, p.worn)}<span class="pinfo"><b>${esc(p.name)}</b><small>${g.name}</small><span class="pbar"><i style="width:${g.pct}%"></i></span></span>${bubble}</button>`;
  }
  // kleiner Hund in der Leiste oben: hüpft, macht Salto, legt den Kopf schief
  function petReact(kind) {
    const d = $("#gdog");
    if (!d) return;
    if (S.calm && (kind === "flip" || kind === "attack")) kind = "hop";
    d.classList.remove("hop", "flip", "tilt", "attack");
    void d.offsetWidth;
    d.classList.add(kind);
  }
  const gdog = () => `<span class="gdog" id="gdog">${B.dog(totalXp(), "run", "", pet().kind, pet().worn)}</span>`;

  function renderPet() {
    const p = pet(), xp = totalXp(), g = B.growth(xp, p.kind), gear = B.gearOf(xp), bd = B.building(p.blocks || 0);
    const K = B.kindOf(p.kind), coins = B.coins(xp, p.spent), full = p.fullDay === dayKey() ? p.full || 0 : 0;
    const GI = { scarf: "🧣", helm: "⛑️", torch: "🔥", cape: "🦸" };
    const proj = bd.cur
      ? `<h2>Bauprojekt: ${bd.cur.name}</h2><div class="build">${B.projectSvg(bd.cur, bd.placed)}${gear.includes("torch") ? B.torch() : ""}</div><p class="bstat"><b>${bd.placed} von ${bd.cur.size} Blöcken</b>${bd.done.length ? ` · Fertig: ${bd.done.map((id) => B.PROJECTS.find((x) => x.id === id).name).join(", ")}` : ""}</p>`
      : `<h2>Alle Bauprojekte fertig! 🏆</h2><div class="build">${B.PROJECTS.map((x) => B.projectSvg(x, x.size, "small")).join("")}</div><p class="bstat"><b>Du bist Baumeister!</b> ${bd.bonus} Bonus-Blöcke</p>`;
    app.innerHTML = `<div class="results petview"><div class="gbar"><button class="icon-btn" data-act="home" aria-label="Zurück">←</button><h1 style="flex:1">Mein ${esc(K.word)}</h1></div>
      <section class="card petstage">
        <div class="room" style="background:${B.roomOf(p.room).bg}">
        <button class="bigdog ${active(dayKey()) ? "happy" : "wait"}" id="bigdog" data-act="petpet" aria-label="${esc(p.name)} streicheln">${B.dog(xp, "", "", p.kind, p.worn)}${(p.kind && p.kind !== "hund" ? [] : p.worn || []).map((id) => { const a = B.ACC.find((x) => x.id === id); return a ?`<span class="acc acc-${a.slot}" aria-hidden="true">${a.icon}</span>` : ""; }).join("")}</button>
        <div class="decor" aria-hidden="true">${(p.decor || []).map((id) => { const d = B.DECOR.find((x) => x.id === id); return d ? `<span>${d.icon}</span>` : ""; }).join("")}</div></div>
        <div class="petmeta"><h2>${esc(p.name)}</h2><div class="stage">${g.name}</div>
          <div class="pbar big"><i style="width:${g.pct}%"></i></div>
          <p class="muted">${g.next ? `Noch ${g.need} Punkte, dann wird ${esc(p.name)} zum ${g.next}. Punkte gibt es in jedem Fach.` : "Ganz groß geworden!"}</p>
          ${boostLeft() ? `<p class="boostline">🚀 Aufholbonus: dreifache Punkte, noch ${Math.ceil(boostLeft() / 3600000)} Std.</p>` : ""}
          <p class="muted">Tippe auf ${esc(p.name)} zum Streicheln.</p>
          <form class="rename" id="rnf" autocomplete="off"><input id="dogname" type="text" maxlength="14" value="${esc(p.name)}" aria-label="Name des Tiers" autocapitalize="words" autocorrect="off" spellcheck="false"><button class="btn ghost" type="submit">Umbenennen</button></form>
        </div>
      </section>
      <section class="card"><h2>Welches Tier möchtest du?</h2><div class="kinds">${B.KINDS.map((k) => `<button class="kind ${k.id === K.id ? "on" : ""}" data-act="petkind" data-v="${k.id}" aria-pressed="${k.id === K.id}">${B.dog(0, "", "", k.id)}<b>${k.name}</b></button>`).join("")}</div></section>
      <section class="card"><h2>Snacks <span class="coins" id="coins">🪙 ${coins}</span></h2>
        <div class="pbar big sat" aria-label="Satt: ${full} von 100"><i style="width:${full}%"></i></div>
        <div class="snacks">${B.SNACKS.map((x) => `<button class="snack" data-act="feed" data-v="${x.id}" ${coins < x.price ? "disabled" : ""}><span class="si">${x.icon}</span><b>${x.name}</b><small>🪙 ${x.price}</small></button>`).join("")}</div>
        <p class="muted">Münzen: für je 10 Punkte aus allen Fächern bekommst du eine. ${esc(p.name)} wird nie traurig, Snacks sind nur zum Freuen.</p></section>
      <section class="card"><h2>Zubehör <span class="coins">🪙 ${coins}</span></h2><div class="snacks">${B.ACC.map((x) => { const own = (p.acc || []).includes(x.id), on = (p.worn || []).includes(x.id); return `<button class="snack${on ? " on" : ""}" data-act="${own ? "wear" : "buy"}" data-v="${own ? "" : "acc:"}${x.id}" ${!own && coins < x.price ? "disabled" : ""} aria-pressed="${on}"><span class="si">${x.icon}</span><b>${x.name}</b><small>${own ? (on ? "an ✓" : "anziehen") : "🪙 " + x.price}</small></button>`; }).join("")}</div></section>
      <section class="card"><h2>Zimmer und Deko <span class="coins">🪙 ${coins}</span></h2><div class="snacks">${B.ROOMS.map((x) => { const own = x.price === 0 || (p.rooms || []).includes(x.id), on = B.roomOf(p.room).id === x.id; return `<button class="snack room-b${on ? " on" : ""}" data-act="${own ? "room" : "buy"}" data-v="${own ? "" : "room:"}${x.id}" ${!own && coins < x.price ? "disabled" : ""} aria-pressed="${on}"><span class="si rsw" style="background:${x.bg}"></span><b>${x.name}</b><small>${own ? (on ? "hier ✓" : "einziehen") : "🪙 " + x.price}</small></button>`; }).join("")}</div>
        <div class="snacks">${B.DECOR.map((x) => { const own = (p.decor || []).includes(x.id); return `<button class="snack${own ? " on" : ""}" data-act="buy" data-v="decor:${x.id}" ${own || coins < x.price ? "disabled" : ""}><span class="si">${x.icon}</span><b>${x.name}</b><small>${own ? "steht im Zimmer ✓" : "🪙 " + x.price}</small></button>`; }).join("")}</div></section>
      <section class="card"><h2>Ausrüstung</h2><div class="gear">${B.GEAR.map((x) => `<div class="gitem ${gear.includes(x.id) ? "got" : ""}"><span class="gi">${GI[x.id]}</span><b>${x.name}</b><small>${gear.includes(x.id) ? "freigeschaltet" : `ab ${x.xp} Punkten`}</small></div>`).join("")}</div></section>
      <section class="card">${proj}<p class="muted">Blöcke bekommst du so: Etappe geschafft +3 · Boss besiegt +2 (großer Boss +3) · Runde geschafft +1 · neuer Rekord oder Probe +2</p></section>
      <section class="card"><h2>Boss-Pokale</h2><div class="trophies">${B.BOSSES.map((b) => { const n = (p.bosses || {})[b.id] || 0; return `<div class="trophy ${n ? "got" : ""}">${B.bossSvg(b)}<b>${n ? b.name : "???"}</b><small>${n ? n + "× besiegt" : "noch nicht getroffen"}</small></div>`; }).join("")}</div></section>
    </div>`;
    $("#rnf").onsubmit = (e) => { e.preventDefault(); const v = ($("#dogname").value || "").trim(); if (v) { pet().name = v; save(); toast("🐶 Hallo " + v + "!"); renderPet(); } };
  }
  function petKind(id) {
    if (!B.KINDS.some((k) => k.id === id)) return;
    pet().kind = id; save(); toast(`${B.kindOf(id).name} ausgewählt!`); tone("win"); renderPet();
  }
  // Kaufen (acc:, room:, decor:), Anziehen, Einziehen
  function petShop(kind, id) {
    const p = pet(), list = { acc: B.ACC, room: B.ROOMS, decor: B.DECOR }[kind], it = list && list.find((x) => x.id === id);
    if (!it) return;
    const key = { acc: "acc", room: "rooms", decor: "decor" }[kind];
    p[key] = p[key] || [];
    if (!p[key].includes(id)) {
      if (B.coins(totalXp(), p.spent) < it.price) return;
      p.spent = (p.spent || 0) + it.price; p[key].push(id);
      if (kind === "acc") { p.worn = (p.worn || []).filter((w) => { const a = B.ACC.find((x) => x.id === w); return a && a.slot !== it.slot; }).concat(id); }
      if (kind === "room") p.room = id;
      toast(`${it.icon || "✨"} ${it.name}!`); tone("win");
    }
    save(); renderPet();
  }
  function petWear(id) {
    const p = pet(), it = B.ACC.find((x) => x.id === id);
    if (!it || !(p.acc || []).includes(id)) return;
    const on = (p.worn || []).includes(id);
    p.worn = (p.worn || []).filter((w) => { if (w === id) return false; const a = B.ACC.find((x) => x.id === w); return a && a.slot !== it.slot; });
    if (!on) p.worn.push(id);
    save(); renderPet();
  }
  function petFeed(id) {
    const p = pet(), sn = B.SNACKS.find((x) => x.id === id);
    if (!sn || B.coins(totalXp(), p.spent) < sn.price) return;
    p.spent = (p.spent || 0) + sn.price;
    p.fed = p.fed || {}; p.fed[id] = (p.fed[id] || 0) + 1;
    p.full = Math.min(100, (p.fullDay === dayKey() ? p.full || 0 : 0) + sn.full); p.fullDay = dayKey();
    save(); tone("wuff"); renderPet();
    const d = $("#bigdog");
    if (d && !quiet()) { d.classList.add("pat"); for (let i = 0; i < 3; i++) { const h = document.createElement("span"); h.className = "heart"; h.textContent = sn.icon; h.style.left = 25 + i * 22 + "%"; h.style.animationDelay = i * 0.12 + "s"; d.appendChild(h); setTimeout(() => h.remove(), 1600); } }
    toast(`${sn.icon} ${p.name} mampft ${sn.name}. Lecker!`);
  }
  function petPet() {
    const d = $("#bigdog");
    if (!d) return;
    pet().petted = (pet().petted || 0) + 1; save();
    tone("wuff");
    d.classList.remove("pat"); void d.offsetWidth; d.classList.add("pat");
    for (let i = 0; i < 4; i++) {
      const h = document.createElement("span");
      h.className = "heart"; h.textContent = "❤";
      h.style.left = 20 + Math.random() * 60 + "%"; h.style.animationDelay = i * 0.12 + "s";
      d.appendChild(h);
      setTimeout(() => h.remove(), 1600);
    }
  }

  /* ================= Boss am Ende einer Etappe (für alle Fächer) ================= */
  const bossOn = () => S.bossOn !== false;
  const bossUI = {
    // r.boss anlegen; die Aufgaben hängt das Fach selbst an
    start(r, step) {
      const def = B.bossFor(dayKey(), step), max = B.bossHp(step);
      r.boss = { def, hp: max, max, step };
      r.bossAt = r.q.length;
      toast(`⚔️ Ein Boss erscheint: ${def.name}!`);
      tone("boss");
      bossUI.draw(r);
      const bb = $("#bossbar"); if (bb && !quiet()) bb.classList.add("enter");
    },
    draw(r) {
      const bar = $(".gbar"), bb = $("#bossbar"), b = r.boss;
      if (!bb || !b) return;
      bar.classList.add("bossmode");
      bb.hidden = false;
      bb.innerHTML = `${B.bossSvg(b.def, b.hp <= 0 ? "dead" : "")}<span class="bname">${b.def.name}</span><span class="hearts" aria-label="${b.hp} von ${b.max} Herzen">${Array.from({ length: b.max }, (_, i) => `<i class="h ${i < b.hp ? "on" : "off"}"></i>`).join("")}</span>`;
      // Zähler: Nummer der Boss-Aufgabe (ändert sich erst mit der nächsten Aufgabe)
      const c = $("#cnt"); if (c) c.textContent = "⚔️ " + Math.max(1, r.i - r.bossAt + 1);
    },
    // Treffer; gibt true zurück, wenn der Boss besiegt ist
    hit(r) {
      const b = r.boss;
      b.hp = Math.max(0, b.hp - 1);
      petReact("attack");
      tone("hit");
      bossUI.draw(r);
      const svgEl = $("#bossbar .boss");
      if (svgEl && !quiet()) { svgEl.classList.add("hurt"); fx.burstAt(svgEl, 18, ["#ff6b6b", "#ffd23f", "#ffffff", "#ff8a1e"]); }
      if (b.hp > 0) return false;
      b.won = true;
      const p = pet();
      p.bosses = p.bosses || {};
      p.bosses[b.def.id] = (p.bosses[b.def.id] || 0) + 1;
      b.loot = giveBlocks(b.step >= 2 ? 3 : 2);
      setTimeout(() => { confetti(110); tone("win"); }, 250);
      toast(`🏆 ${b.def.name} besiegt!`);
      return true;
    },
    block() {
      const svgEl = $("#bossbar .boss");
      if (svgEl && !quiet()) { svgEl.classList.remove("laugh"); void svgEl.getBoundingClientRect(); svgEl.classList.add("laugh"); }
      petReact("tilt");
    },
    line: (b) => (b && b.won ? `⚔️ Boss besiegt: <b>${b.def.name}</b>! ${b.loot ? b.loot.text : ""}` : ""),
  };

  /* ================= Rennen gegen den eigenen Rekord (Blitzrunde) ================= */
  const race = {
    html: () => B.raceHTML(totalXp(), pet().kind),
    setup(r, trace, ms) { r.ghost = B.ghostTrace(trace, ms); r.goal = B.raceGoal(r.ghost); r.trace = []; r.ahead = false; r.raceMs = ms; },
    hit(r) { (r.trace = r.trace || []).push(Date.now() - r.t0); },
    update(r) {
      const t = Date.now() - r.t0, g = B.ghostAt(r.ghost, t), me = (r.trace || []).length;
      const a = $("#rme"), b = $("#rghost");
      // Läufer bleiben in der Bahn: links 0 bis rechts (Breite 34 px + Flagge)
      const at = (p) => `calc(${p}% - ${p * 0.6}px)`;
      if (a) a.style.left = at(B.pos(me, r.goal));
      if (b) b.style.left = at(B.pos(g, r.goal));
      if (me > g && !r.ahead) { r.ahead = true; r.passed = (r.passed || 0) + 1; toast("💨 Du hast deinen Geist überholt!"); tone("pass"); }
      else if (me < g) r.ahead = false;
    },
  };

  /* ================= Bildschirme ================= */
  let view = "home", R = null, D = null;
  // Bildschirmwechsel: Zeitgeber stoppen, Konfetti wegräumen (lenkt sonst ab)
  const go = (v) => { view = v; if (R) R.tok = -1; parts = []; closeModal(); render(); window.scrollTo(0, 0); };
  const closeModal = () => document.querySelectorAll(".modal").forEach((m) => m.remove());

  function render() {
    applyCalm();
    const f = fachFor(view);
    if (f) return f.render(view);
    if (view === "home") return renderHome();
    if (view === "discover") return renderDiscover();
    if (view === "badges") return renderBadges();
    if (view === "results") return renderResults();
    if (view === "parents") return renderParents();
    if (view === "pause") return renderPause();
    if (view === "pet") return renderPet();
  }

  function topChips() {
    const d = daysToLZK(), s = streak();
    const lzk = d > 0 ? `<div class="chip lzk"><small>LZK in</small><b>${d} ${d === 1 ? "Tag" : "Tagen"}</b></div>` : d === 0 ? `<div class="chip lzk"><small>Heute</small><b>LZK! 🍀</b></div>` : "";
    return `<div class="chips">${lzk}<div class="chip"><small>Serie</small><b>🔥 ${s}</b></div></div>`;
  }

  /* ---------- Tagesmission: 3 kurze Etappen ---------- */
  const MISSION = [
    { skill: "choice", name: "Aufwärmen", icon: "🔤", text: "Ein Gebiet leuchtet, du wählst den Namen." },
    { skill: "tap", name: "Finden", icon: "📍", text: "Der Name steht da, du tippst auf die Karte." },
    { skill: "write", name: "Schreiben", icon: "✏️", text: "Ein Gebiet leuchtet, du schreibst den Namen." },
  ];
  const MISSION_LEN = 6;
  const missionStep = () => (S.mission && S.mission.day === dayKey() ? S.mission.step : 0);
  function missionPath(step) {
    return `<ol class="path">${MISSION.map((m, i) => `<li class="${i < step ? "done" : i === step ? "now" : ""}"><span class="dot">${i < step ? "✓" : m.icon}</span><span>${m.name}</span></li>`).join("")}<li class="${step >= 3 ? "done" : ""}"><span class="dot">🏆</span><span>Geschafft</span></li></ol>`;
  }

  /* ---------- Kopfzeile und Fach-Reiter (für alle Fächer) ---------- */
  function subjectTabs() {
    if (!FAECH.length) return "";
    const list = [{ id: "de", icon: "🗺️", name: "Deutschland" }].concat(FAECH);
    return `<nav class="subjects" aria-label="Fach">${list.map((f) => `<button class="subj" data-act="subject" data-v="${f.id}" aria-pressed="${S.subject === f.id}"><span class="ico">${f.icon}</span>${esc(f.name)}</button>`).join("")}</nav>`;
  }
  function header(o) {
    const r = o.ranks.reduce((a, x) => (o.xp >= x.xp ? x : a), o.ranks[0]), nr = o.ranks.find((x) => x.xp > o.xp);
    const pct = nr ? Math.round(((o.xp - r.xp) / (nr.xp - r.xp)) * 100) : 100;
    return `
      <div class="top">
        ${petWidget()}
        <div class="hello"><h1>${S.name ? "Hallo " + esc(S.name) + "!" : o.title}</h1>
          <div><span class="rank">${r.name}</span> · ${o.xp} Punkte${nr ? ` · noch ${nr.xp - o.xp} bis ${nr.name}` : ""}</div>
          <div class="xpbar"><i style="width:${pct}%"></i></div></div>
        ${o.chips}
        <button class="icon-btn" data-act="badges" aria-label="Abzeichen">🏅</button>
        <button class="icon-btn" data-act="settings" aria-label="Einstellungen">⚙️</button>
      </div>${subjectTabs()}`;
  }

  function renderHome() {
    const fach = S.subject !== "de" && fachOf(S.subject);
    if (fach) { fach.home(); if (!S.askedName) nameModal(); return; }
    const tp = S.topic;
    const canTap = tp !== "general";
    const step = missionStep();
    const topicBtn = (t) => {
      const c = catStars(t);
      const name = t === "all" ? "Alles" : CATS[t].name;
      const sub = t === "all" ? `${c.got}/${c.max} ★` : `${c.full}/${c.n} gemeistert`;
      return `<button class="topic" data-act="topic" data-v="${t}" aria-pressed="${tp === t}"><b>${name}</b><small>${sub}</small><span class="fill" style="width:${c.max ? Math.round((c.got / c.max) * 100) : 0}%"></span></button>`;
    };
    const weak = ITEMS.filter((i) => i.cat !== "general").sort((a, b) => stars(a) - stars(b) || wrongs(b) - wrongs(a)).slice(0, 4);
    const missionBtn = step < 3
      ? `<button class="mode big" data-act="mission"><span class="ico">${MISSION[step].icon}</span><div><b>${step === 0 ? "Los geht's" : "Weiter"}: Etappe ${step + 1} von 3</b><br><span>${MISSION[step].text} ${MISSION_LEN} Aufgaben, ca. 3 Minuten.</span></div></button>`
      : `<div class="done-msg"><b>Tagesmission geschafft! 🏆</b><span>Super! Du kannst für heute aufhören. Wenn du magst, übe die stumme Karte.</span></div>`;
    app.innerHTML = `${header({ title: "Deutschland-Entdecker", ranks: RANKS, xp: S.xp, chips: topChips() })}
      <div class="home">
        <section class="card"><h2>Meine Karte</h2><div class="minimap" id="mini">${mapMarkup()}</div>
          <div class="legend"><span>Je mehr Sterne, desto bunter die Karte.</span></div>
          ${weak.length ? `<h2 style="margin-top:14px">Das üben wir noch</h2><div class="weak">${weak.map((i) => `<span class="pill">${esc(i.name)} ${"★".repeat(stars(i))}${"☆".repeat(i.skills.length - stars(i))}</span>`).join("")}</div>` : ""}</section>
        <div class="right">
          <section class="card mission"><h2>Deine Tagesmission</h2>${missionPath(step)}${missionBtn}</section>
          <div class="modes two">
            <button class="mode" data-act="blankpick"><span class="ico">🗺️</span><b>Stumme Karte</b><span>Nummern auf der Karte, wie in der LZK.</span></button>
            <button class="mode" data-act="mode" data-v="probe"><span class="ico">🎓</span><b>Probe-LZK</b><span>Fragen aus allem, am Ende eine Note.</span></button>
          </div>
          <details class="card more" id="more" ${S.ui && S.ui.more ? "open" : ""}><summary>Selbst aussuchen</summary>
            <h2>Was möchtest du üben?</h2><div class="topics">${["states", "neighbors", "water", "mountains", "general", "all"].map(topicBtn).join("")}</div>
            <h2 style="margin-top:14px">Wie möchtest du üben?</h2><div class="modes">
              <button class="mode" data-act="mode" data-v="mix"><span class="ico">🎯</span><b>Meine Schwächen</b><span>Die App sucht aus, was noch wackelt.</span></button>
              <button class="mode" data-act="discover"><span class="ico">👆</span><b>Entdecken</b><span>Tippe auf die Karte und lerne die Namen.</span></button>
              <button class="mode" data-act="mode" data-v="tap" ${canTap ? "" : "disabled"}><span class="ico">📍</span><b>Finden</b><span>Der Name steht da, du tippst auf die Karte.</span></button>
              <button class="mode" data-act="mode" data-v="choice"><span class="ico">🔤</span><b>Auswählen</b><span>Ein Gebiet leuchtet, du wählst den Namen.</span></button>
              <button class="mode" data-act="mode" data-v="write"><span class="ico">✏️</span><b>Schreiben</b><span>Ein Gebiet leuchtet, du schreibst den Namen.</span></button>
              ${S.showBlitz ? `<button class="mode" data-act="mode" data-v="blitz" ${canTap ? "" : "disabled"}><span class="ico">⚡</span><b>Blitzrunde</b><span>60 Sekunden, so viele Treffer wie möglich. Rekord: ${S.blitzBest}</span></button>` : ""}
            </div>
          </details>
        </div>
      </div>`;
    paintProgress($("#mini"));
    $("#mini svg").style.pointerEvents = "none";
    $("#more").addEventListener("toggle", (e) => { S.ui = Object.assign({}, S.ui, { more: e.target.open }); save(); });
    if (!S.askedName) nameModal();
  }

  function nameModal() {
    const m = document.createElement("div");
    m.className = "modal";
    m.innerHTML = `<div class="card"><h1>Willkommen!</h1><p>Wie heißt du? Der Name bleibt nur auf diesem iPad.</p><input type="text" id="nm" placeholder="Dein Vorname" autocapitalize="words" autocomplete="off" autocorrect="off" spellcheck="false" maxlength="20">
      <div class="dogrow">${B.dog(0, "happy")}<label for="dn">Das ist dein Hund. Er wächst, wenn du übst. Wie soll er heißen?</label></div>
      <input type="text" id="dn" value="${esc(pet().name)}" autocapitalize="words" autocomplete="off" autocorrect="off" spellcheck="false" maxlength="14" aria-label="Name des Tiers">
      <div class="row"><button class="btn" data-act="savename">Los geht's</button><button class="btn ghost" data-act="skipname">Überspringen</button></div></div>`;
    document.body.appendChild(m);
  }

  /* ---------- Bewegungspause ---------- */
  const MOVES = [
    "Steh auf und mach 10 Hampelmänner.",
    "Streck dich ganz groß, so hoch du kannst. Dann mach dich ganz klein.",
    "Hüpfe 10-mal auf einem Bein, dann 10-mal auf dem anderen.",
    "Kreise 5-mal mit den Armen nach vorne und 5-mal nach hinten.",
    "Mach 5 Kniebeugen, ganz langsam.",
    "Schüttle Arme und Beine aus, wie ein nasser Hund.",
  ];
  let pauseNext = null;
  function startPause(after) {
    pauseNext = after || null;
    go("pause");
  }
  function renderPause() {
    const ms = TEST.pauseMs || 20000;
    const move = MOVES[Math.floor(Math.random() * MOVES.length)];
    app.innerHTML = `<div class="results pause"><div class="card hero"><h1>Bewegungspause</h1><p class="move">${move}</p>
      <div class="ring-timer"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="track"/><circle cx="60" cy="60" r="52" class="bar" id="pbar"/></svg><b id="psec">${Math.round(ms / 1000)}</b></div>
      <div class="row"><button class="btn" data-act="pausedone" id="pdone" disabled>Fertig</button><button class="btn ghost" data-act="pausedone">Überspringen</button></div></div></div>`;
    if (S.autoRead) say(move);
    const end = Date.now() + ms, tok = Math.random();
    renderPause.tok = tok;
    const tick = () => {
      if (renderPause.tok !== tok || view !== "pause") return;
      const left = Math.max(0, end - Date.now());
      const b = $("#pbar"), s = $("#psec");
      if (b) b.style.strokeDashoffset = String(327 * (1 - left / ms));
      if (s) s.textContent = Math.ceil(left / 1000);
      if (left <= 0) { const d = $("#pdone"); if (d) { d.disabled = false; d.textContent = "Fertig! Weiter"; } tone("ok"); return; }
      setTimeout(tick, 200);
    };
    tick();
  }

  /* ---------- Entdecken ---------- */
  function renderDiscover() {
    D = D || { layer: "states", names: true, sel: null };
    const layers = ["states", "neighbors", "water", "mountains"];
    app.innerHTML = `<div class="game">
      <div class="gbar"><button class="icon-btn" data-act="home" aria-label="Zurück">←</button><h2 style="flex:1">Entdecken</h2></div>
      <div class="stage"><div class="mapwrap" id="mapwrap">${mapMarkup()}</div>
      <aside class="panel"><div class="layers">${layers.map((l) => `<button class="layer" data-act="layer" data-v="${l}" aria-pressed="${D.layer === l}">${CATS[l].short}</button>`).join("")}</div>
        <label class="switch"><input type="checkbox" id="names" ${D.names ? "checked" : ""}> Namen anzeigen</label>
        <div class="infocard" id="info"><p class="muted">Tippe auf die Karte, um den Namen zu sehen. Mit „Namen anzeigen“ aus kannst du dich selbst testen.</p></div></aside></div></div>`;
    const svg = $("#mapwrap .map");
    svg.classList.toggle("show-mtn", D.layer === "mountains");
    const apply = () => { if (D.names) labels(catItems(D.layer)); else $("#lab").innerHTML = ""; };
    apply();
    $("#names").onchange = (e) => { D.names = e.target.checked; apply(); };
    svg.onclick = (e) => {
      const r = pick(e, idsOf(D.layer));
      if (!r.id) return;
      const it = BY_ID[r.id];
      D.sel = it.id;
      clearHL(); apply(); highlight(it);
      const kind = it.kind || (it.cat === "states" ? "Bundesland" : it.cat === "neighbors" ? "Nachbarland" : "Gebirge");
      $("#info").innerHTML = `<div class="kind">${kind}</div><h2>${esc(it.name)}</h2><p>${esc(it.info)}</p><button class="speak" data-act="say" data-v="${esc(it.name)}. ${esc(it.info)}" style="margin-top:10px">🔊 Vorlesen</button>`;
      if (S.speak || S.autoRead) say(it.name);
      tone("ok");
    };
  }

  /* ---------- Abzeichen ---------- */
  function renderBadges() {
    const grid = (list) => `<div class="badges">${list.map((b) => `<div class="badge ${S.badges[b.id] ? "got" : ""}"><div class="medal">${b.icon}</div><div><b>${b.name}</b><small>${b.desc}</small></div></div>`).join("")}</div>`;
    let groups = [{ id: "de", title: "🗺️ Deutschland", list: BADGES }].concat(FAECH.map((f) => ({ id: f.id, title: f.icon + " " + f.name, list: f.badges || [] })));
    groups = groups.filter((g) => g.id === S.subject).concat(groups.filter((g) => g.id !== S.subject));
    app.innerHTML = `<div class="results"><div class="gbar"><button class="icon-btn" data-act="home" aria-label="Zurück">←</button><h1 style="flex:1">Abzeichen</h1></div>
      ${FAECH.length ? groups.map((g) => `<h2 class="bgroup">${g.title}</h2>${grid(g.list)}`).join("") : grid(BADGES)}</div>`;
  }

  /* ================= Spielrunden ================= */
  const nameList = (it) => [it.name].concat(it.alts);
  // Schreibfallen aus dem Lapbook kommen beim Schreiben öfter dran, bis sie sicher sitzen
  const spellOpen = (it) => !!LAPBOOK_SPELLING[it.id] && (lvl(it.id, "write") < 2 || (S.items[it.id] && S.items[it.id].sp === false));
  const trap = (it, skill) => it.skills.includes("write") && (skill === "write" || !skill) && spellOpen(it);
  // Rechtschreibung zählt in der LZK nicht (nur erkennbar). Schreibfallen kommen trotzdem öfter dran,
  // bis sie einmal richtig geschrieben sind. Erkannt, aber anders geschrieben: sp = false.
  function noteSpelling(it, kinds) {
    if (!LAPBOOK_SPELLING[it.id]) return;
    const e = S.items[it.id] || (S.items[it.id] = {});
    e.sp = !kinds.some((k) => k === "typo");
  }
  const noteTypo = (kinds) => { if (R && kinds.some((k) => k === "typo")) R.typos = (R.typos || 0) + 1; };
  const focus = (it) => FOCUS.includes(it.id) && stars(it) < it.skills.length;
  const weightFor = (skill) => (it) => 1 + (it.skills.length - stars(it)) * 1.5 + (lastWrong(it) ? 3 : 0) + (trap(it, skill) ? 3 : 0) + (focus(it) ? 8 : 0);
  const weight = weightFor(null);
  const roundLen = () => [5, 8, 12].includes(+S.roundLen) ? +S.roundLen : 8;
  function poolFor(topic, skill) {
    let l = topic === "all" ? ITEMS : ITEMS.filter((i) => i.cat === topic);
    return skill ? l.filter((i) => i.skills.includes(skill)) : l;
  }
  function buildQueue(mode, topic) {
    if (mode === "probe") {
      const q = [], rnd = Math.random;
      const add = (cat, n) => sample(catItems(cat), n, () => 1).forEach((it) => {
        const skill = it.cat === "general" ? (it.skills.includes("write") && rnd() > 0.5 ? "write" : "choice") : rnd() > 0.4 ? "write" : "tap";
        q.push({ it, skill });
      });
      add("general", 6); add("neighbors", 4); add("states", 5); add("water", 4); add("mountains", 3);
      const out = shuffle(q);
      // Tests: bestimmte Frage zuerst (als Schreibfrage, wenn es eine gibt)
      if (TEST.forceFirst && BY_ID[TEST.forceFirst]) { const it = BY_ID[TEST.forceFirst]; return [{ it, skill: it.skills.includes("write") ? "write" : it.skills[0] }].concat(out.filter((x) => x.it.id !== it.id)).slice(0, out.length); }
      return out;
    }
    if (mode === "mission") {
      const sk = MISSION[Math.min(2, missionStep())].skill;
      return sample(poolFor("all", sk), MISSION_LEN, weightFor(sk)).map((it) => ({ it, skill: sk }));
    }
    if (mode === "blitz") return shuffle(poolFor(topic, "tap")).concat(shuffle(poolFor(topic, "tap"))).map((it) => ({ it, skill: "tap" }));
    if (mode === "mix") {
      return sample(poolFor(topic), roundLen(), weight).map((it) => {
        const min = Math.min(...it.skills.map((s) => lvl(it.id, s)));
        const c = it.skills.filter((s) => lvl(it.id, s) === min);
        return { it, skill: c[Math.floor(Math.random() * c.length)] };
      });
    }
    let pool = poolFor(topic, mode), n = roundLen(), first = [];
    if (TEST.forceFirst && pool.some((i) => i.id === TEST.forceFirst)) { first = [BY_ID[TEST.forceFirst]]; pool = pool.filter((i) => i.id !== TEST.forceFirst); n--; }
    return first.concat(sample(pool, n, weightFor(mode))).map((it) => ({ it, skill: mode }));
  }

  function gameShell(mode) {
    return `<div class="game">
      <div class="gbar"><button class="icon-btn" data-act="quit" aria-label="Beenden">✕</button>
        ${mode === "blitz" ? race.html() : `<div class="progress"><i id="pg"></i></div><div class="bossbar" id="bossbar" hidden></div>${gdog()}`}<span class="count" id="cnt"></span>
        <span class="xp" id="xpv"></span></div>
      <div class="stage" id="stage"><div class="mapwrap" id="mapwrap">${mapMarkup()}</div><aside class="panel" id="panel"></aside></div></div>`;
  }
  function wireGame() {
    $("#mapwrap .map").onclick = (e) => R && R.onMap && R.onMap(e);
    $("#panel").onclick = (e) => { const b = e.target.closest("[data-a]"); if (b && R && R.onPanel) R.onPanel(b); };
  }

  function startRound(mode) {
    closeModal();
    const topic = mode === "mission" ? "all" : S.topic;
    const q = buildQueue(mode, topic);
    if (!q.length) return toast("Dazu gibt es hier keine Aufgaben. Wähle ein anderes Thema.");
    view = "game";
    R = { tok: Math.random(), mode, topic, q, i: 0, results: [], xp: 0, hits: 0, combo: 0, t0: Date.now(), mstep: missionStep() };
    app.innerHTML = gameShell(mode);
    wireGame();
    if (mode === "blitz") { race.setup(R, S.blitzTrace, TEST.blitzMs || 60000); blitzTimer(); }
    showQuestion();
  }

  function blitzTimer() {
    const tok = R.tok, end = Date.now() + (TEST.blitzMs || 60000);
    const tick = () => {
      if (!R || R.tok !== tok) return;
      const left = end - Date.now();
      const bar = $("#tm");
      if (bar) bar.style.width = Math.max(0, (left / (TEST.blitzMs || 60000)) * 100) + "%";
      race.update(R);
      if (left <= 0) { R.lock = true; return finish(); }
      setTimeout(tick, 100);
    };
    tick();
  }

  function updateBar() {
    if (R.boss) return bossUI.draw(R);
    let n = R.q.length, done = R.i;
    if (R.mode === "blank") done = R.q.filter((it) => R.status[it.id] === "ok" || R.status[it.id] === "bad" || (R.sheet && sheetVal(it))).length;
    const pg = $("#pg"); if (pg) pg.style.width = (done / n) * 100 + "%";
    const c = $("#cnt");
    if (c) c.textContent = R.mode === "blitz" ? "✔ " + R.hits : R.mode === "blank" ? done + " / " + n : Math.min(R.i + 1, n) + " / " + n;
    const x = $("#xpv"); if (x) x.textContent = "+" + R.xp;
  }

  // Boss am Ende einer Etappe: zuerst die Fehler dieser Etappe, sonst Aufgaben aus dem Pool der Etappe
  function startBoss() {
    const step = Math.min(2, R.mstep), sk = MISSION[step].skill, max = B.bossHp(step);
    const seen = new Set();
    let items = R.results.filter((x) => !x.ok && !seen.has(x.q.it.id) && seen.add(x.q.it.id)).map((x) => x.q.it).slice(0, max);
    if (items.length < max) items = items.concat(sample(poolFor("all", sk).filter((it) => !items.includes(it)), max - items.length, weightFor(sk)));
    bossUI.start(R, step);
    R.q.push(...items.map((it) => ({ it, skill: sk, boss: true })));
    $("#stage").classList.add("bossfight");
    showQuestion();
  }
  function showQuestion() {
    if (R.i >= R.q.length) {
      if (R.mode === "mission" && bossOn() && !R.boss) return startBoss();
      return finish();
    }
    const q = R.q[R.i];
    R.cur = q; R.lock = false; R.waitNext = false; R.warned = false; R.attempt = 0; R.onMap = null; R.onPanel = null;
    updateBar();
    const gen = q.it.cat === "general";
    $("#stage").classList.toggle("general", gen);
    $("#stage").classList.toggle("writing", q.skill === "write" && !gen);
    fitMap();
    if (!gen) { clearHL(); $(".map").classList.remove("show-mtn"); focusMap(q.skill !== "tap"); }
    if (gen) return q.skill === "write" ? renderGenWrite(q) : q.it.g.flag ? renderFlag(q) : renderGenChoice(q);
    if (q.skill === "tap") return renderTap(q);
    if (q.skill === "choice") return renderChoice(q);
    return renderWrite(q);
  }
  const readAloud = (t) => { if (S.autoRead) say(t); };

  function commit(q, res) {
    const ok = res !== "fail";
    record(q.it, q.skill, res);
    let gain = (res === "first" ? 10 : res === "second" ? 5 : 0) + (ok && q.skill === "write" ? 5 : 0);
    R.combo = res === "first" ? (R.combo || 0) + 1 : 0;
    if (q.boss) {
      // Boss-Aufgaben zählen nicht zur Etappe; falsch: der Boss blockt, die Aufgabe kommt wieder
      if (ok) { gain += 5; if (bossUI.hit(R)) { gain += 20; R.q.length = R.i + 1; } }
      else { bossUI.block(R); R.q.push({ it: q.it, skill: q.skill, boss: true }); }
    } else {
      if (ok) R.hits++;
      R.results.push({ q, res, ok });
      if (R.mode === "blitz" && ok) race.hit(R);
    }
    S.xp += gain; R.xp += gain;
    tone(ok ? "ok" : "bad", R.combo);
    if (!q.boss) petReact(ok ? (R.combo && R.combo % 5 === 0 ? "flip" : "hop") : "tilt");
    if (ok && gain) fx.plus($("#fb") && $("#fb").firstChild ? $("#fb") : $("#panel"), $("#xpv"), "+" + gain);
    save();
    updateBar();
    checkBadges();
  }
  const next = () => { if (!R) return; R.i++; showQuestion(); };
  const later = (fn, ms) => { const tok = R.tok; setTimeout(() => R && R.tok === tok && fn(), ms); };
  const fb = (cls, html) => { const f = $("#fb"); if (f) f.innerHTML = html ? `<div class="feedback ${cls}" role="status">${html}</div>` : ""; };
  const weiter = (label = "Weiter") => { $("#act").innerHTML = `<button class="btn" data-a="next" id="nx">${label}</button>`; R.onPanel = (b) => { if (b.dataset.a === "next") next(); }; const b = $("#nx"); if (b && document.activeElement !== $("#wi")) b.focus({ preventScroll: true }); };
  const speakBtn = (t) => `<button class="speak" data-a="say" data-t="${esc(t)}" aria-label="Vorlesen">🔊</button>`;
  const sayHandler = (b) => { if (b.dataset.a === "say") { say(b.dataset.t); return true; } };
  const praise = ["Richtig!", "Super!", "Genau!", "Stark!", "Top!"];
  const pr = () => praise[Math.floor(Math.random() * praise.length)];
  const probe = () => R.mode === "probe", blitz = () => R.mode === "blitz";
  const shake = () => { if (S.calm) return; const mw = $("#mapwrap"); mw.classList.remove("shake"); void mw.offsetWidth; mw.classList.add("shake"); };

  // --- Finden: Name steht da, Karte antippen ---
  function renderTap(q) {
    const it = q.it;
    $("#panel").innerHTML = `<div class="prompt"><small>${blitz() ? "Schnell!" : "Tippe auf die Karte"}</small><h2>Finde:<span class="big">${esc(it.name)}</span></h2></div>${blitz() ? "" : speakBtn(it.name)}<div id="fb"></div><div id="act"></div>`;
    readAloud("Finde " + it.name);
    const cand = idsOf(it.cat);
    R.onPanel = sayHandler;
    R.onMap = (e) => {
      if (R.lock) return;
      const r = pick(e, cand);
      if (r.id === it.id) {
        R.lock = true;
        highlight(it, "ok"); labels([it]);
        fb("ok", `${pr()}${R.attempt ? "" : " ✔"}`);
        commit(q, R.attempt === 0 ? "first" : "second");
        if (R.xp > 0 && R.results.slice(-5).filter((x) => x.res === "first").length === 5) confetti(40);
        return later(next, blitz() ? 450 : 1000);
      }
      R.attempt++;
      const t = r.id ? BY_ID[r.id] : r.under ? BY_ID[r.under] : null;
      shake();
      if (probe() || blitz() || R.attempt >= 2) {
        R.lock = true;
        highlight(it, "ok"); labels([it]);
        commit(q, "fail");
        if (blitz()) return later(next, 600);
        fb("bad", `${t ? "Du hast " + esc(t.name) + " getippt." : "Da ist es nicht."}<small>Hier liegt ${esc(it.name)}.</small>`);
        return weiter();
      }
      tone("bad");
      fb("hint", `${t ? "Das ist " + esc(t.name) + "." : "Da ist es nicht."} Versuch es noch einmal!`);
    };
  }

  function distractors(it, n = 3) {
    return sample(catItems(it.cat).filter((x) => x.id !== it.id), n, () => 1);
  }
  // --- Auswählen: Gebiet leuchtet ---
  function renderChoice(q) {
    const it = q.it;
    highlight(it);
    const opts = shuffle([it, ...distractors(it)]);
    $("#panel").innerHTML = `<div class="prompt"><small>Auswählen</small><h2>${askOf(it)}</h2></div><div class="opts">${opts.map((o) => `<button class="opt" data-a="opt" data-id="${o.id}">${esc(o.name)}</button>`).join("")}</div><div id="fb"></div><div id="act"></div>`;
    readAloud(askOf(it));
    R.onPanel = (b) => {
      if (b.dataset.a !== "opt" || R.lock) return;
      R.lock = true;
      const ok = b.dataset.id === it.id;
      document.querySelectorAll(".opt").forEach((o) => { o.disabled = true; if (o.dataset.id === it.id) o.classList.add("ok"); });
      if (!ok) b.classList.add("bad");
      clearHL(); highlight(it, "ok"); labels([it]);
      commit(q, ok ? "first" : "fail");
      if (ok) { fb("ok", pr()); later(next, 1000); } else { fb("bad", `Richtig ist: ${esc(it.name)}.`); weiter(); }
    };
  }

  // --- Schreiben (Karte) ---
  function writeForm(prompt, hint) {
    const old = $("#wi");
    if (old && $("#wf")) {
      // gleiches Feld weiterverwenden: auf dem iPad bleibt so die Tastatur offen
      $("#wprompt").innerHTML = prompt;
      old.value = ""; old.className = ""; old.placeholder = hint;
      old.setAttribute("inputmode", "text"); old.setAttribute("autocapitalize", "words");
      const ws = $("#ws"); ws.textContent = "Prüfen"; ws.classList.remove("next"); fb(); $("#act").innerHTML = "";
      return old;
    }
    $("#panel").innerHTML = `<div class="prompt"><small>Schreiben</small><h2 id="wprompt">${prompt}</h2></div>
      <form class="write" id="wf" autocomplete="off"><input id="wi" type="text" inputmode="text" autocapitalize="words" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="done" aria-label="Antwort" placeholder="${hint}"><button class="btn" type="submit" id="ws">Prüfen</button></form><div id="fb"></div><div id="act"></div>`;
    const inp = $("#wi");
    setTimeout(() => { try { inp.focus({ preventScroll: true }); } catch (e) { /* */ } }, 60);
    return inp;
  }
  function wrongTip(it, kind) {
    const w = nameList(it)[0];
    return kind === "close" ? "Fast! Schau noch einmal genau auf die Buchstaben." : `Nicht ganz. Tipp: Es beginnt mit „${esc(w.slice(0, 2))}“.`;
  }
  function renderWrite(q) {
    const it = q.it;
    highlight(it);
    const inp = writeForm(askOf(it) + " Schreibe den Namen.", "Name eintippen");
    readAloud(askOf(it));
    $("#wf").onsubmit = (e) => {
      e.preventDefault();
      if (R.lock) { if (R.waitNext) next(); return; }
      const j = judge(inp.value, nameList(it), othersOf(it));
      if (j.kind === "empty") return inp.focus();
      finishWrite(q, j, inp, it.name, () => { clearHL(); highlight(it, "ok"); labels([it]); }, wrongTip(it, j.kind));
    };
  }
  // Deine Schreibweise und die richtige untereinander, falsche Buchstaben markiert
  function diffHtml(input, correct) {
    if (!String(input || "").trim() || !correct) return "";
    const d = diffMark(input, correct);
    const mine = d.mine.map(([c, ok]) => (ok ? esc(c) : `<del>${esc(c)}</del>`)).join("");
    const right = d.right.map(([c, ok]) => (ok ? esc(c) : `<mark>${esc(c)}</mark>`)).join("");
    return `<div class="diff"><div><small>Du:</small><span>${mine}</span></div><div><small>Richtig:</small><span>${right}</span></div></div>`;
  }
  // gemeinsame Auswertung für Schreib-Aufgaben (target: Schreibweise für den Buchstaben-Vergleich)
  function finishWrite(q, j, inp, correct, reveal, tip, target) {
    if (target === undefined) target = correct;
    if (j.ok) { noteSpelling(q.it, [j.kind]); noteTypo([j.kind]); }
    if (j.ok) {
      R.lock = true; inp.classList.add("ok");
      reveal();
      const note = j.kind === "spelling" || j.kind === "typo" ? `<small>Kleiner Schreibtipp, so schreibt man es:</small>${diffHtml(inp.value, j.canonical || target)}` : j.kind === "case" ? `<small>Namen schreibt man groß: ${esc(j.canonical || correct)}</small>` : "";
      fb("ok", pr() + (note ? " 👍" : "") + note);
      commit(q, R.attempt === 0 ? "first" : "second");
      return later(next, note ? 2200 : 1000);
    }
    R.attempt++;
    inp.classList.add("bad");
    setTimeout(() => inp.classList.remove("bad"), 600);
    if (probe() || R.attempt >= 2) {
      R.lock = true; R.waitNext = true;
      const ws = $("#ws"); ws.textContent = "Weiter"; ws.classList.add("next");
      reveal();
      fb("bad", `Richtig ist: ${esc(correct)}${target ? diffHtml(inp.value, target) : ""}`);
      commit(q, "fail");
      return;
    }
    tone("bad");
    fb("hint", tip);
    inp.select();
  }

  // --- Allgemeines: Auswahl ---
  function renderGenChoice(q) {
    const g = q.it.g;
    const opts = shuffle(g.options.map((o, i) => ({ o, ok: i === g.correct })));
    $("#panel").innerHTML = `<div class="prompt"><small>Allgemeines</small><h2>${esc(g.q)}</h2></div>${speakBtn(g.q)}<div class="opts">${opts.map((o, i) => `<button class="opt" data-a="opt" data-i="${i}">${esc(o.o)}</button>`).join("")}</div><div id="fb"></div><div id="act"></div>`;
    readAloud(g.q);
    R.onPanel = (b) => {
      if (sayHandler(b) || b.dataset.a !== "opt" || R.lock) return;
      R.lock = true;
      const i = +b.dataset.i, ok = opts[i].ok;
      document.querySelectorAll(".opt").forEach((o) => { o.disabled = true; if (opts[+o.dataset.i].ok) o.classList.add("ok"); });
      if (!ok) b.classList.add("bad");
      commit(q, ok ? "first" : "fail");
      if (ok) { fb("ok", pr()); later(next, 1000); } else { fb("bad", esc(g.info)); weiter(); }
    };
  }
  // --- Allgemeines: Schreiben ---
  // --- Mehrere Antworten: ein Feld pro Antwort, jedes wird für sich geprüft (wie bei ANTON) ---
  function renderGenMulti(q) {
    const w = q.it.g.write, need = w.all, n = need.length;
    $("#panel").innerHTML = `<div class="prompt"><small>Schreiben · ${n} Antworten</small><h2 id="wprompt">${esc(w.q)}</h2></div>${speakBtn(w.q)}
      <form class="multi" id="mf" autocomplete="off">
        ${need.map((_, k) => `<div class="mrow" id="mr${k}"><span class="mnum">${k + 1}</span><input id="${k ? "wi" + k : "wi"}" class="mi" type="text" autocapitalize="words" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="${k < n - 1 ? "next" : "done"}" aria-label="Antwort ${k + 1}" placeholder="${k + 1}. Antwort"><span class="mmark" aria-hidden="true"></span></div>`).join("")}
        <button class="btn" type="submit" id="ws">Prüfen</button>
      </form><div id="fb"></div><div id="act"></div>`;
    readAloud(w.q);
    R.onPanel = sayHandler;
    const ins = [...document.querySelectorAll("#mf .mi")];
    setTimeout(() => { try { ins[0].focus({ preventScroll: true }); } catch (e) { /* */ } }, 60);
    // alles in ein Feld geschrieben ("Nordsee und Ostsee")? Auf die freien Felder verteilen.
    const spread = () => ins.forEach((inp) => {
      if (inp.readOnly) return;
      const parts = splitAnswers(inp.value, need);
      const free = ins.filter((x) => x !== inp && !x.readOnly && !x.value.trim());
      if (parts.length < 2 || free.length < parts.length - 1) return;
      inp.value = parts[0];
      parts.slice(1).forEach((v, i) => { free[i].value = v; });
    });
    // Enter springt ins nächste leere Feld; erst wenn alle voll sind, wird geprüft
    ins.forEach((inp) => inp.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" || R.lock) return;
      spread();
      const empty = ins.find((x) => !x.readOnly && !x.value.trim());
      if (empty && empty !== inp) { e.preventDefault(); empty.focus(); }
    }));
    const mark = (k, cls, sym) => { const row = $("#mr" + k); row.classList.remove("ok", "bad"); if (cls) row.classList.add(cls); row.querySelector(".mmark").textContent = sym || ""; };
    $("#mf").onsubmit = (e) => {
      e.preventDefault();
      if (R.lock) { if (R.waitNext) next(); return; }
      spread();
      const vals = ins.map((x) => x.value);
      const empty = ins.filter((x) => !x.readOnly && !x.value.trim());
      if (empty.length && !R.warned && !probe()) {
        R.warned = true;
        fb("hint", `Es ${empty.length === 1 ? "fehlt noch eine Antwort" : `fehlen noch ${empty.length} Antworten`}. Weißt du sie nicht? Dann tippe noch einmal auf Prüfen.`);
        return empty[0].focus();
      }
      R.warned = false;
      const j = judgeEach(vals, need, genOthers(q.it.g));
      if (j.ok) { noteSpelling(q.it, j.fields.map((f) => f.kind)); noteTypo(j.fields.map((f) => f.kind)); }
      j.fields.forEach((f, k) => { if (f.ok) { mark(k, "ok", "✓"); ins[k].readOnly = true; } else mark(k, "bad", "✗"); });
      const notes = j.fields.map((f, k) => (f.ok && (f.kind === "typo" || f.kind === "spelling") ? diffHtml(vals[k], f.canonical) : "")).join("");
      if (j.ok) {
        R.lock = true;
        fb("ok", pr() + (notes ? ` 👍<small>Kleiner Schreibtipp, so schreibt man es:</small>${notes}` : ""));
        commit(q, R.attempt === 0 ? "first" : "second");
        return later(next, notes ? 2400 : 1200);
      }
      R.attempt++;
      const okN = j.fields.filter((f) => f.ok).length;
      if (probe() || R.attempt >= 2) {
        // Lösung in die roten Felder
        R.lock = true; R.waitNext = true;
        let mi = 0;
        j.fields.forEach((f, k) => { if (!f.ok) { ins[k].readOnly = true; $("#mr" + k).insertAdjacentHTML("beforeend", `<span class="msol">${esc(j.missing[mi++] || "")}</span>`); } });
        fb("bad", `${okN} von ${n} richtig. Richtig ist: ${esc(w.show)}`);
        const ws = $("#ws"); ws.textContent = "Weiter"; ws.classList.add("next");
        commit(q, "fail");
        return;
      }
      tone("bad");
      const dup = j.fields.some((f) => f.kind === "dup");
      fb("hint", `${okN ? `${okN} von ${n} richtig, super!` : "Noch nicht richtig."}${dup ? " Eine Antwort steht doppelt da." : ""} Verbessere ${n - okN === 1 ? "das rote Feld" : "die roten Felder"}.`);
      const bad = ins.find((x) => !x.readOnly);
      if (bad) { bad.focus(); bad.select(); }
    };
  }
  function renderGenWrite(q) {
    const g = q.it.g, w = g.write;
    if (w.all) return renderGenMulti(q);
    const inp = writeForm(esc(w.q), w.num ? "Zahl eintippen" : "Antwort eintippen");
    inp.setAttribute("autocapitalize", w.num ? "off" : "words");
    if (w.num) inp.setAttribute("inputmode", "numeric");
    readAloud(w.q);
    $("#wf").onsubmit = (e) => {
      e.preventDefault();
      if (R.lock) { if (R.waitNext) next(); return; }
      const j = w.num ? judgeNumber(inp.value, w.num, w.show) : w.all ? judgeAll(inp.value, w.all) : judge(inp.value, w.answers, genOthers(g));
      if (j.kind === "empty") return inp.focus();
      const tip = j.kind === "partial" ? `Gut, ${esc(j.found.join(" und "))} stimmt! Es fehlt noch ${j.missing.length === 1 ? "eins" : j.missing.length}.` : "Nicht ganz. Überlege noch einmal.";
      finishWrite(q, j, inp, w.show, () => {}, tip, w.num ? null : w.all ? (j.ok ? j.canonical : null) : closest(inp.value, w.answers));
    };
  }

  // --- Flagge bauen ---
  const FLAG = [{ n: "Schwarz", c: "#101010", t: "#fff" }, { n: "Rot", c: "#dd0000", t: "#fff" }, { n: "Gold", c: "#ffce00", t: "#3a2a00" }];
  function renderFlag(q) {
    const picked = [];
    const chips = shuffle(FLAG);
    const draw = () => {
      $("#panel").innerHTML = `<div class="prompt"><small>Allgemeines</small><h2>${esc(q.it.g.q)}</h2></div><div class="flagbox"><div class="flag">${[0, 1, 2].map((i) => `<div style="background:${picked[i] ? picked[i].c : ""};color:${picked[i] ? picked[i].t : ""}">${picked[i] ? picked[i].n : i + 1 + "."}</div>`).join("")}</div>
        <div class="flagchips">${chips.map((c) => `<button class="fchip" data-a="chip" data-n="${c.n}" style="background:${c.c};color:${c.t}" ${picked.includes(c) ? "disabled" : ""}>${c.n}</button>`).join("")}</div></div><div id="fb"></div><div id="act"></div>`;
    };
    draw();
    readAloud(q.it.g.q);
    R.onPanel = (b) => {
      if (b.dataset.a !== "chip" || R.lock) return;
      picked.push(FLAG.find((c) => c.n === b.dataset.n));
      draw();
      if (picked.length < 3) return;
      const ok = picked.every((c, i) => c === FLAG[i]);
      if (ok) { R.lock = true; fb("ok", pr() + "<small>Schwarz, Rot, Gold: von oben nach unten.</small>"); commit(q, R.attempt === 0 ? "first" : "second"); confetti(50); return later(next, 1600); }
      R.attempt++;
      if (probe() || R.attempt >= 2) {
        R.lock = true; picked.length = 0; FLAG.forEach((c) => picked.push(c)); draw();
        fb("bad", "So ist es richtig: Schwarz, Rot, Gold.");
        commit(q, "fail");
        return weiter();
      }
      tone("bad"); picked.length = 0; draw(); fb("hint", "Nicht ganz. Versuch es noch einmal!");
    };
  }

  /* ================= Stumme Karte ================= */
  function blankChooser() {
    closeModal();
    const m = document.createElement("div");
    m.className = "modal";
    const st = S.blankStyle === "single" ? "single" : "sheet";
    m.innerHTML = `<div class="card"><h2 style="color:var(--text)">Stumme Karte</h2><p class="muted">Auf der Karte stehen Nummern. Schreibe zu jeder Nummer den Namen, wie in der LZK.</p>
      <div class="seg" role="group" aria-label="Wie möchtest du üben?"><button class="segbtn" data-act="bstyle" data-v="sheet" aria-pressed="${st === "sheet"}">📋 Ganzes Blatt</button><button class="segbtn" data-act="bstyle" data-v="single" aria-pressed="${st === "single"}">1️⃣ Nummer für Nummer</button></div>
      <p class="muted bsthint">${st === "sheet" ? "Wie in der LZK: alle Nummern auf einmal ausfüllen, dann prüfen." : "Eine Nummer nach der anderen, mit Tipps."}</p>
      <div class="choose">${MAP_CATS.map((c) => `<button class="mode" data-act="blank" data-v="${c}"><b>${CATS[c].name}</b><span>${catItems(c).length} Nummern</span></button>`).join("")}</div>
      <button class="btn ghost" data-act="closemodal">Abbrechen</button></div>`;
    document.body.appendChild(m);
  }
  // Nummern wie im Lapbook (Gebirge, Gewässer), sonst von Nord nach Süd wie auf einem Arbeitsblatt
  function blankSetup(cat, onlyIds) {
    const items = catItems(cat);
    const lapbook = items.every((it) => BLANK_NUM[it.id]);
    const nums = {};
    if (lapbook) items.forEach((it) => { nums[it.id] = BLANK_NUM[it.id]; });
    else items.slice().sort((a, b) => a.label[1] - b.label[1] || a.label[0] - b.label[0]).forEach((it, i) => { nums[it.id] = i + 1; });
    const all = items.slice().sort((a, b) => nums[a.id] - nums[b.id]);
    return { lapbook, nums, all, ask: onlyIds ? all.filter((it) => onlyIds.includes(it.id)) : all };
  }
  function startBlank(cat, onlyIds) {
    closeModal();
    if (S.blankStyle !== "single") return startSheet(cat, onlyIds);
    const { lapbook, nums, all, ask } = blankSetup(cat, onlyIds);
    view = "game";
    R = { tok: Math.random(), mode: "blank", cat, all, nums, q: ask, queue: ask.map((it) => it.id), status: {}, results: [], xp: 0, hits: 0, t0: Date.now(), i: 0, onlyIds };
    if (onlyIds) all.forEach((it) => { if (!onlyIds.includes(it.id)) R.status[it.id] = "known"; });
    app.innerHTML = gameShell("blank");
    wireGame();
    const svg = $(".stage .map");
    svg.classList.toggle("show-mtn", cat === "mountains");
    svg.classList.add("focus", "blankmap");
    $("#panel").innerHTML = `<div class="prompt"><small>Stumme Karte · ${CATS[cat].name}${lapbook ? " · Nummern wie im Lapbook" : ""}</small><h2>Wie heißt <span class="numbadge" id="bnum"></span>?</h2></div>
      <div class="seg" role="group" aria-label="Antwortart"><button data-a="bm" data-v="write" class="segbtn" aria-pressed="false">✏️ Schreiben</button><button data-a="bm" data-v="bank" class="segbtn" aria-pressed="false">🔤 Wortkasten</button></div>
      <div id="bans"></div><div id="fb"></div><div class="numgrid" id="bgrid" aria-label="Alle Nummern"></div>`;
    R.onPanel = blankPanel;
    R.onMap = (e) => {
      const n = e.target.closest && e.target.closest("[data-num]");
      if (n) blankJump(n.dataset.num);
    };
    blankNext();
  }
  const blankDone = (id) => ["ok", "bad", "known"].includes(R.status[id]);
  function blankNext() {
    R.cur = R.queue.find((id) => !blankDone(id));
    if (!R.cur) return finish();
    R.attempt = 0; R.lock = false; R.waitNext = false;
    const it = BY_ID[R.cur];
    clearHL(); highlight(it);
    fb();
    $("#bnum").textContent = "Nummer " + R.nums[R.cur];
    $("#panel").dataset.cur = R.cur;
    drawNums(); renderBlankAnswer(); updateBar();
    readAloud("Wie heißt Nummer " + R.nums[R.cur] + "?");
  }
  function blankJump(id) {
    if (!R || R.mode !== "blank" || blankDone(id) || R.lock || id === R.cur) return;
    R.queue.splice(R.queue.indexOf(id), 1);
    R.queue.unshift(id);
    blankNext();
  }
  function drawNums() {
    const g = $("#nums");
    if (!g) return;
    g.innerHTML = R.all.map((it) => {
      const n = R.nums[it.id], st = R.status[it.id], cur = it.id === R.cur && !blankDone(it.id);
      const [x, y] = it.label;
      let s = `<g class="num ${cur ? "cur" : st || "open"}" data-num="${it.id}"><circle cx="${x}" cy="${y}" r="${cur ? 21 : 16}"/><text x="${x}" y="${y + 6}">${n}</text></g>`;
      const [tx, ty] = textAt(it), ly = (LABEL_SHIFT[it.id] ? ty : y) + 36;
      if (st === "ok" || st === "bad" || st === "known") s += `<text class="numlab ${st}" x="${tx}" y="${ly}">${esc(it.name)}</text>`;
      else if (R.sheet) { const v = sheetVal(it); if (v) s += `<text class="numlab typed" x="${tx}" y="${ly}">${esc(v)}</text>`; }
      return s;
    }).join("");
    if ($("#bgrid")) $("#bgrid").innerHTML = R.all.map((it) => `<button class="nb-cell ${it.id === R.cur && !blankDone(it.id) ? "cur" : R.status[it.id] || "open"}" data-a="jump" data-id="${it.id}" ${blankDone(it.id) ? "disabled" : ""}>${R.nums[it.id]}</button>`).join("");
  }
  function renderBlankAnswer() {
    const bank = S.blankMode === "bank";
    document.querySelectorAll(".segbtn").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === S.blankMode)));
    $("#stage").classList.toggle("writing", !bank);
    if (!bank) {
      let inp = $("#bi");
      if (!inp) {
        $("#bans").innerHTML = `<form class="write" id="bf" autocomplete="off"><input id="bi" type="text" autocapitalize="words" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="done" aria-label="Name" placeholder="Name eintippen"><button class="btn" type="submit" id="bs">Prüfen</button></form><button class="linkbtn skip" data-a="skip" type="button">Später</button>`;
        inp = $("#bi");
        $("#bf").onsubmit = blankSubmit;
        setTimeout(() => { try { inp.focus({ preventScroll: true }); } catch (e) { /* */ } }, 60);
      }
      inp.value = ""; inp.className = "";
      const bs = $("#bs"); bs.textContent = "Prüfen"; bs.classList.remove("next");
    } else {
      const words = R.all.slice().sort((a, b) => a.name.localeCompare(b.name, "de"));
      $("#bans").innerHTML = `<div class="wordbank">${words.map((it) => `<button class="wchip" data-a="word" data-id="${it.id}" ${blankDone(it.id) ? "disabled" : ""}>${esc(it.name)}</button>`).join("")}</div><button class="linkbtn skip" data-a="skip" type="button">Später</button>`;
    }
    fitMap();
  }
  function blankSolved(it, skill, kindNote) {
    R.lock = true;
    R.status[it.id] = "ok";
    clearHL(); highlight(it, "ok");
    fb("ok", pr() + (kindNote ? " 👍" + kindNote : ""));
    commit({ it, skill }, R.attempt === 0 ? "first" : "second");
    drawNums();
    later(blankNext, kindNote ? 2200 : 800);
  }
  function blankFailed(it, skill, typed) {
    R.lock = true; R.waitNext = true;
    R.status[it.id] = "bad";
    clearHL(); highlight(it, "ok");
    fb("bad", `Nummer ${R.nums[it.id]} ist: ${esc(it.name)}${typed ? diffHtml(typed, it.name) : ""}${S.blankMode === "bank" ? `<button class="btn" data-a="bnext" id="bnx" type="button" style="margin-top:10px;width:100%">Weiter</button>` : ""}`);
    commit({ it, skill }, "fail");
    drawNums();
    const bs = $("#bs");
    if (bs && S.blankMode !== "bank") { bs.textContent = "Weiter"; bs.classList.add("next"); }
  }
  function blankSubmit(e) {
    e.preventDefault();
    if (R.lock) { if (R.waitNext) blankNext(); return; }
    const it = BY_ID[R.cur], inp = $("#bi");
    const j = judge(inp.value, nameList(it), othersOf(it));
    if (j.kind === "empty") return inp.focus();
    if (j.ok) {
      noteSpelling(it, [j.kind]);
      inp.classList.add("ok");
      const note = j.kind === "spelling" || j.kind === "typo" ? `<small>Kleiner Schreibtipp, so schreibt man es:</small>${diffHtml(inp.value, j.canonical)}` : j.kind === "case" ? `<small>Namen schreibt man groß: ${esc(j.canonical)}</small>` : "";
      return blankSolved(it, "write", note);
    }
    R.attempt++;
    inp.classList.add("bad");
    setTimeout(() => inp.classList.remove("bad"), 600);
    if (R.attempt >= 2) return blankFailed(it, "write", inp.value);
    tone("bad");
    fb("hint", wrongTip(it, j.kind));
    inp.select();
  }
  /* ---------- Stumme Karte als ganzes Blatt: alle Nummern auf einmal, dann prüfen ---------- */
  const sheetIn = (id) => $("#si-" + id);
  const sheetVal = (it) => { const i = sheetIn(it.id); return i ? i.value.trim() : ""; };
  function startSheet(cat, onlyIds) {
    const { lapbook, nums, all, ask } = blankSetup(cat, onlyIds);
    view = "game";
    R = { tok: Math.random(), mode: "blank", sheet: true, cat, all, nums, q: ask, status: {}, results: [], xp: 0, hits: 0, combo: 0, t0: Date.now(), i: 0, onlyIds, attempt: 0, cur: null };
    if (onlyIds) all.forEach((it) => { if (!onlyIds.includes(it.id)) R.status[it.id] = "known"; });
    app.innerHTML = gameShell("blank");
    wireGame();
    $("#stage").classList.add("sheet");
    const svg = $(".stage .map");
    svg.classList.toggle("show-mtn", cat === "mountains");
    svg.classList.add("focus", "blankmap");
    $("#panel").innerHTML = `<div class="prompt"><small>Stumme Karte · Ganzes Blatt · ${CATS[cat].name}${lapbook ? " · Nummern wie im Lapbook" : ""}</small><h2>Schreibe zu jeder Nummer den Namen.</h2></div>
      <div class="seg" role="group" aria-label="Antwortart"><button data-a="sm" data-v="write" class="segbtn" aria-pressed="false">✏️ Schreiben</button><button data-a="sm" data-v="bank" class="segbtn" aria-pressed="false">🔤 Wortkasten</button></div>
      <div id="fb"></div>
      <form class="sheetlist" id="sf" autocomplete="off">
        <div class="srows">${ask.map((it) => `<div class="srow" id="sr-${it.id}"><button type="button" class="numbadge" data-a="srow" data-id="${it.id}" aria-label="Nummer ${nums[it.id]} auf der Karte zeigen">${nums[it.id]}</button><input id="si-${it.id}" data-id="${it.id}" type="text" autocapitalize="words" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="next" aria-label="Nummer ${nums[it.id]}"><span class="smark" aria-hidden="true"></span></div>`).join("")}</div>
        <div id="sbank"></div>
        <div class="sfoot"><button class="btn" type="submit" id="ss">Prüfen</button></div>
      </form>`;
    R.onPanel = sheetPanel;
    R.onMap = (e) => { const n = e.target.closest && e.target.closest("[data-num]"); if (n && sheetIn(n.dataset.num)) sheetIn(n.dataset.num).focus(); };
    ask.forEach((it) => {
      const inp = sheetIn(it.id);
      inp.addEventListener("focus", () => sheetCur(it.id));
      inp.addEventListener("input", () => { $("#sr-" + it.id).classList.remove("wrong"); drawNums(); updateBar(); });
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); sheetAdvance(it.id, true); } });
    });
    $("#sf").onsubmit = (e) => { e.preventDefault(); sheetCheck(); };
    sheetMode();
    R.cur = ask[0] && ask[0].id;
    drawNums(); updateBar();
    readAloud("Schreibe zu jeder Nummer den Namen.");
  }
  // gewählte Nummer: Gebiet leuchtet, Nummer pulsiert
  function sheetCur(id) {
    if (!R || !R.sheet) return;
    R.cur = id;
    clearHL(); highlight(BY_ID[id]);
    document.querySelectorAll(".srow").forEach((r) => r.classList.toggle("cur", r.id === "sr-" + id));
    drawNums();
  }
  // nächstes leeres Feld; sind alle voll, wird geprüft (Enter)
  function sheetAdvance(fromId, checkWhenFull) {
    const open = R.q.filter((it) => R.status[it.id] !== "ok" && R.status[it.id] !== "bad");
    const k = open.findIndex((it) => it.id === fromId);
    const order = open.slice(k + 1).concat(open.slice(0, Math.max(0, k)));
    const next = order.find((it) => !sheetVal(it));
    if (next) { sheetIn(next.id).focus(); sheetIn(next.id).scrollIntoView({ block: "nearest" }); return; }
    if (checkWhenFull) sheetCheck();
  }
  // Schreiben oder Wortkasten (Wortkasten: keine Tastatur, Namen antippen)
  function sheetMode() {
    const bank = S.blankMode === "bank";
    document.querySelectorAll('[data-a="sm"]').forEach((b) => b.setAttribute("aria-pressed", String((b.dataset.v === "bank") === bank)));
    R.q.forEach((it) => { const i = sheetIn(it.id); if (R.status[it.id] !== "ok" && R.status[it.id] !== "bad") i.readOnly = bank; i.inputMode = bank ? "none" : "text"; });
    const words = R.all.slice().sort((a, b) => a.name.localeCompare(b.name, "de"));
    $("#sbank").innerHTML = bank ? `<div class="wordbank">${words.map((it) => `<button type="button" class="wchip" data-a="sword" data-name="${esc(it.name)}">${esc(it.name)}</button>`).join("")}</div>` : "";
    sheetChips();
  }
  const sheetChips = () => {
    const used = new Set(R.q.map((it) => sheetVal(it)).filter(Boolean));
    document.querySelectorAll('[data-a="sword"]').forEach((c) => c.classList.toggle("used", used.has(c.dataset.name)));
  };
  function sheetRecord(it, res) {
    const ok = res !== "fail", skill = S.blankMode === "bank" ? "choice" : "write";
    record(it, skill, res);
    const gain = (res === "first" ? 10 : res === "second" ? 5 : 0) + (ok && skill === "write" ? 5 : 0);
    S.xp += gain; R.xp += gain;
    if (ok) R.hits++;
    R.results.push({ q: { it, skill }, res, ok });
    return gain;
  }
  function sheetCheck() {
    if (!R || !R.sheet) return;
    if (R.lock) return R.waitNext ? finish() : undefined;
    const rows = R.q.filter((it) => R.status[it.id] !== "ok");
    const empty = rows.filter((it) => !sheetVal(it));
    if (empty.length && !R.warned) {
      R.warned = true;
      fb("hint", `Noch ${empty.length} ${empty.length === 1 ? "Feld ist" : "Felder sind"} leer. Weißt du ${empty.length === 1 ? "es" : "sie"} nicht? Dann tippe noch einmal auf Prüfen.`);
      sheetIn(empty[0].id).focus();
      return;
    }
    R.warned = false;
    R.attempt++;
    const final = R.attempt >= 2;
    let gain = 0;
    const notes = [];
    for (const it of rows) {
      const inp = sheetIn(it.id), row = $("#sr-" + it.id), v = inp.value;
      const j = judge(v, nameList(it), othersOf(it));
      row.classList.remove("wrong", "bad");
      if (j.ok) {
        noteSpelling(it, [j.kind]);
        R.status[it.id] = "ok"; gain += sheetRecord(it, R.attempt === 1 ? "first" : "second");
        row.classList.add("ok"); inp.readOnly = true; row.querySelector(".smark").textContent = "✓";
        if (j.kind === "typo" || j.kind === "spelling") notes.push(`<b>${R.nums[it.id]}:</b>${diffHtml(v, j.canonical)}`);
      } else if (final) {
        R.status[it.id] = "bad"; sheetRecord(it, "fail");
        row.classList.add("bad"); inp.readOnly = true; row.querySelector(".smark").textContent = "✗";
        row.insertAdjacentHTML("beforeend", `<span class="ssol">${esc(it.name)}</span>`);
      } else { row.classList.add("wrong"); row.querySelector(".smark").textContent = "✗"; }
    }
    const n = R.q.length, okN = R.q.filter((it) => R.status[it.id] === "ok").length;
    clearHL(); drawNums(); updateBar(); save(); checkBadges();
    if (gain) fx.plus($("#ss"), $("#xpv"), "+" + gain);
    const tip = notes.length ? `<small>Kleiner Schreibtipp:</small>${notes.join("")}` : "";
    if (okN === n) {
      R.lock = true; R.waitNext = true;
      fb("ok", `Alles richtig! 🎉${tip}`);
      tone("win"); confetti(60);
      $("#ss").textContent = "Zur Auswertung";
      return;
    }
    if (final) {
      R.lock = true; R.waitNext = true;
      fb("bad", `${okN} von ${n} richtig. Bei den roten Nummern steht jetzt die Lösung.${tip}`);
      tone("bad");
      $("#ss").textContent = "Zur Auswertung";
      return;
    }
    tone(okN ? "ok" : "bad");
    fb("hint", `${okN} von ${n} richtig${okN ? ", super" : ""}! Verbessere die roten Felder und prüfe noch einmal.${tip}`);
    const firstBad = R.q.find((it) => R.status[it.id] !== "ok");
    if (firstBad) { sheetIn(firstBad.id).focus(); if (S.blankMode !== "bank") sheetIn(firstBad.id).select(); }
  }
  function sheetPanel(b) {
    const a = b.dataset.a;
    if (a === "sm") { S.blankMode = b.dataset.v; save(); sheetMode(); if (R.cur && sheetIn(R.cur)) sheetIn(R.cur).focus(); return; }
    if (a === "srow") { const i = sheetIn(b.dataset.id); if (i) i.focus(); return; }
    if (a === "sword") {
      if (R.lock || !R.cur || R.status[R.cur] === "ok") return;
      const i = sheetIn(R.cur);
      // den Namen aus einem anderen (noch offenen) Feld wegnehmen: jeder Name nur einmal
      R.q.forEach((it) => { const o = sheetIn(it.id); if (o !== i && R.status[it.id] !== "ok" && o.value === b.dataset.name) o.value = ""; });
      i.value = b.dataset.name;
      $("#sr-" + R.cur).classList.remove("wrong");
      sheetChips(); drawNums(); updateBar();
      sheetAdvance(R.cur, false);
    }
  }

  function blankPanel(b) {
    const a = b.dataset.a;
    if (a === "bm") { S.blankMode = b.dataset.v; save(); if (!R.lock) renderBlankAnswer(); else document.querySelectorAll(".segbtn").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.v === S.blankMode))); return; }
    if (a === "jump") return blankJump(b.dataset.id);
    if (a === "bnext") return blankNext();
    if (a === "skip") {
      if (R.lock) return;
      const rest = R.queue.filter((id) => !blankDone(id));
      if (rest.length < 2) return toast("Das ist die letzte Nummer.");
      R.queue.splice(R.queue.indexOf(R.cur), 1);
      R.queue.push(R.cur);
      return blankNext();
    }
    if (a === "word") {
      if (R.lock) return;
      const it = BY_ID[R.cur];
      if (b.dataset.id === it.id) return blankSolved(it, "choice");
      R.attempt++;
      b.classList.add("bad");
      if (R.attempt >= 2) return blankFailed(it, "choice");
      tone("bad");
      fb("hint", `Das passt nicht zu Nummer ${R.nums[it.id]}. Versuch es noch einmal!`);
    }
  }

  /* ================= Ende der Runde ================= */
  function finish() {
    if (!R) return;
    const r = R, ok = r.results.filter((x) => x.ok).length, n = r.results.length;
    r.tok = -1; // ausstehende Zeitgeber (Weiter nach Treffer) dürfen nichts mehr tun
    r.ok = ok; r.n = n;
    r.pct = n ? Math.round((ok / n) * 100) : 0;
    addTime(r);
    if (r.mode === "probe") {
      r.grade = gradeFor(r.pct);
      S.probes.push({ date: dayKey(), pct: r.pct, grade: r.grade });
    }
    if (r.mode === "blitz" && r.hits > S.blitzBest) { r.record = true; S.blitzBest = r.hits; S.blitzTrace = (r.trace || []).slice(); }
    if (r.mode === "mission") {
      const step = Math.min(3, r.mstep + 1);
      S.mission = { day: dayKey(), step };
      if (step === 3) S.missionsDone = (S.missionsDone || 0) + 1;
      r.newStep = step;
    }
    if (r.mode === "blank" && n === r.all.length && ok === n) S.blankPerfect = true;
    // Blöcke für die Bauprojekte des Hundes
    const blocks = r.mode === "mission" ? 3 : r.mode === "probe" || r.record ? 2 : r.mode === "blitz" ? 0 : n ? 1 : 0;
    r.loot = blocks ? giveBlocks(blocks) : null;
    save();
    checkBadges();
    view = "results";
    render();
    if (r.pct >= 80 || r.record || r.newStep === 3) { confetti(120); tone("win"); }
  }

  function renderResults() {
    const r = R;
    const good = [], todo = [];
    const seen = new Set();
    for (const x of r.results) { if (seen.has(x.q.it.id)) continue; seen.add(x.q.it.id); (x.ok ? good : todo).push(x.q.it); }
    let head, big, sub, extra = "", buttons;
    const restart = `<button class="btn" data-act="again">Noch einmal</button>`;
    const home = `<button class="btn ghost" data-act="home">Zur Startseite</button>`;
    buttons = restart + home;
    if (r.mode === "probe") {
      head = "Probe-LZK geschafft!"; big = "Note " + r.grade;
      sub = `${r.ok} von ${r.n} richtig (${r.pct} %).${r.typos ? ` ${r.typos} Schreibfehler markiert, aber wie in der LZK nicht bewertet.` : ""} Das ist nur eine Orientierung, nicht die Note aus der Schule.`;
    } else if (r.mode === "blitz") {
      head = r.record ? "Neuer Rekord!" : "Zeit um!"; big = r.hits + " Treffer";
      sub = `${r.n - r.ok} daneben. Dein Rekord: ${S.blitzBest}.`;
    } else if (r.mode === "mission") {
      const step = r.newStep;
      head = step >= 3 ? "Tagesmission geschafft! 🏆" : `Etappe ${step} geschafft!`;
      big = `${r.ok} / ${r.n}`;
      sub = step >= 3 ? "Super gemacht! Für heute kannst du aufhören." : `+${r.xp} Punkte. Noch ${3 - step} ${3 - step === 1 ? "Etappe" : "Etappen"}.`;
      extra = missionPath(step);
      buttons = step >= 3
        ? `<button class="btn" data-act="home">Fertig für heute</button>`
        : `<button class="btn" data-act="mission">Weiter zu Etappe ${step + 1}</button><button class="btn ghost" data-act="pause">Erst Bewegungspause (20 s)</button><button class="btn ghost" data-act="home">Für heute aufhören</button>`;
    } else if (r.mode === "blank") {
      const asked = r.q.length;
      head = r.ok === asked ? "Alles richtig! 🗺️" : "Deine stumme Karte";
      big = `${r.ok} / ${asked}`;
      sub = r.ok === asked ? "Die ganze Karte ohne Fehler. Stark!" : "Grün ist richtig, rot üben wir noch einmal.";
      extra = `<div class="mapwrap resultmap">${mapMarkup()}</div>`;
      const wrong = r.q.filter((it) => r.status[it.id] === "bad").map((it) => it.id);
      buttons = (wrong.length ? `<button class="btn" data-act="blankwrong">Nur die Fehler nochmal (${wrong.length})</button>` : "") + `<button class="btn ${wrong.length ? "ghost" : ""}" data-act="again">Ganze Karte nochmal</button>` + home;
    } else {
      head = r.pct >= 80 ? "Stark gemacht!" : r.pct >= 50 ? "Gut gemacht!" : "Weiter üben, du schaffst das!";
      big = `${r.ok} / ${r.n}`; sub = `+${r.xp} Punkte`;
    }
    // Pausen-Hinweis nach 15 Minuten
    let hint = "";
    if (sessionMin >= (TEST.pauseAfterMin || 15) && !pauseHinted && r.mode !== "mission") {
      pauseHinted = true;
      hint = `<div class="card pausehint"><b>Du übst schon eine Weile, super!</b><span>Zeit für eine kurze Pause?</span><button class="btn ghost" data-act="pause">Bewegungspause (20 s)</button></div>`;
    }
    const li = (it) => `<li>${esc(it.name)}${it.cat === "general" ? "" : ` <span class="muted">(${CATS[it.cat].short})</span>`}</li>`;
    const gains = [bossUI.line(r.boss), r.loot ? r.loot.text : ""].filter(Boolean);
    app.innerHTML = `<div class="results"><div class="card hero"><h1>${head}</h1><div class="score">${big}</div><p class="muted">${sub}</p>${gains.length ? `<div class="gains">${gains.map((g) => `<div>${g}</div>`).join("")}</div>` : ""}${extra}</div>
      ${hint}
      ${r.mode === "blank" ? "" : `<div class="listcols"><div class="card"><h2>Das kannst du schon</h2><ul>${good.map(li).join("") || "<li class='muted'>noch nichts</li>"}</ul></div>
      <div class="card"><h2>Das üben wir noch</h2><ul>${todo.map(li).join("") || "<li class='muted'>alles richtig 🎉</li>"}</ul></div></div>`}
      <div class="row">${buttons}</div></div>`;
    if (r.mode === "blank") {
      const svg = $(".resultmap .map");
      svg.classList.toggle("show-mtn", r.cat === "mountains");
      svg.style.pointerEvents = "none";
      const g = svg.querySelector("#nums");
      g.innerHTML = r.all.map((it) => {
        const st = r.status[it.id] || "open", [x, y] = it.label;
        const [tx, ty] = textAt(it);
        return `<g class="num ${st}"><circle cx="${x}" cy="${y}" r="16"/><text x="${x}" y="${y + 6}">${r.nums[it.id]}</text></g><text class="numlab ${st}" x="${tx}" y="${(LABEL_SHIFT[it.id] ? ty : y) + 36}">${esc(it.name)}</text>`;
      }).join("");
    }
  }

  /* ================= Eltern-Übersicht ================= */
  let ptab = "de";
  const parentTabs = () => FAECH.length ? `<div class="seg ptabs" role="group" aria-label="Fach">${[{ id: "de", icon: "🗺️", name: "Deutschland" }].concat(FAECH).map((f) => `<button class="segbtn" data-act="ptab" data-v="${f.id}" aria-pressed="${ptab === f.id}">${f.icon} ${esc(f.name)}</button>`).join("")}</div>` : "";
  function renderParents() {
    const fach = ptab !== "de" && fachOf(ptab);
    if (fach) {
      app.innerHTML = `<div class="results parents"><div class="gbar"><button class="icon-btn" data-act="home" aria-label="Zurück">←</button><h1 style="flex:1">Eltern-Übersicht</h1></div>${parentTabs()}${fach.parents()}</div>`;
      fach.bindParents();
      return;
    }
    const cats = ["states", "neighbors", "water", "mountains", "general"];
    const all = catStars("all");
    const ready = all.max ? Math.round((all.got / all.max) * 100) : 0;
    const days = [];
    for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(dayKey(d)); }
    const maxMin = Math.max(5, ...days.map((d) => S.mins[d] || 0));
    const wd = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
    // nur Geübtes, das noch nicht sicher sitzt; meiste Fehler zuerst
    const practiced = (it) => S.items[it.id] && S.items[it.id].n > 0;
    const weak = ITEMS.filter((it) => practiced(it) && (stars(it) < it.skills.length || lastWrong(it)))
      .sort((a, b) => wrongs(b) - wrongs(a) || (stars(a) / a.skills.length) - (stars(b) / b.skills.length)).slice(0, 10);
    const never = ITEMS.filter((it) => !practiced(it)).length;
    const miss = (it) => it.skills.filter((sk) => lvl(it.id, sk) < 1).map((sk) => SKILL_NAME[sk]).join(", ");
    const cell = (it, sk) => it.skills.includes(sk) ? (lvl(it.id, sk) >= 1 ? `<td class="yes">✓</td>` : `<td class="no">–</td>`) : `<td class="na"></td>`;
    const totalMin = Object.values(S.mins).reduce((a, b) => a + b, 0);
    app.innerHTML = `<div class="results parents"><div class="gbar"><button class="icon-btn" data-act="home" aria-label="Zurück">←</button><h1 style="flex:1">Eltern-Übersicht</h1></div>${parentTabs()}
      <section class="card"><h2>Bereit für die LZK</h2>
        <div class="ready"><div class="big-pct">${ready} %</div><p class="muted">Anteil aller Sterne. Ein Begriff sitzt sicher, wenn er ihn auswählen, auf der Karte finden und schreiben kann (3 Sterne).</p></div>
        <div class="bars">${cats.map((c) => { const s = catStars(c); const p = s.max ? Math.round((s.got / s.max) * 100) : 0; return `<div class="barrow"><span>${CATS[c].name}</span><div class="bar"><i style="width:${p}%"></i></div><b>${s.full}/${s.n} sicher</b></div>`; }).join("")}</div>
      </section>
      <section class="card"><h2>Wackelt noch</h2>${never ? `<p class="muted" style="margin-bottom:8px">${never} von ${ITEMS.length} Begriffen wurden noch nie geübt.</p>` : ""}${weak.length ? `<table class="tbl"><thead><tr><th>Begriff</th><th>Sterne</th><th>Fehler</th><th>Fehlt noch</th></tr></thead><tbody>${weak.map((it) => `<tr><td>${esc(it.name)}</td><td>${"★".repeat(stars(it))}${"☆".repeat(it.skills.length - stars(it))}</td><td>${wrongs(it)}</td><td>${miss(it) || "–"}</td></tr>`).join("")}</tbody></table>` : `<p class="muted">Bisher wackelt nichts von dem, was schon geübt wurde.</p>`}</section>
      <section class="card"><h2>Schreibfallen aus dem Lapbook</h2><p class="muted" style="margin-bottom:8px">So stand es im Lapbook. Diese Wörter kommen beim Schreiben öfter dran, bis sie sicher sitzen.</p>
        <table class="tbl"><thead><tr><th>Richtig</th><th>Im Lapbook</th><th>Schreiben</th></tr></thead><tbody>${Object.entries(LAPBOOK_SPELLING).map(([id, seen]) => { const it = BY_ID[id]; const l = lvl(id, "write"); const label = it.cat === "general" ? (it.g.write ? it.g.write.show : it.name) : it.name; return `<tr><td>${esc(label)}</td><td class="muted">${esc(seen)}</td>${(() => { const sp = S.items[id] && S.items[id].sp; return sp === false ? `<td class="no">erkannt, Schreibweise übt er noch</td>` : `<td class="${l >= 2 ? "yes" : "no"}">${l >= 2 ? "✓ sicher" : l === 1 ? "fast" : "–"}</td>`; })()}</tr>`; }).join("")}</tbody></table></section>
      <section class="card"><h2>Übungszeit, letzte 7 Tage</h2>
        <div class="days">${days.map((d) => { const m = S.mins[d] || 0; const dt = new Date(d + "T12:00:00"); return `<div class="day"><div class="col"><i style="height:${Math.round((m / maxMin) * 100)}%"></i></div><b>${Math.round(m)}</b><small>${wd[dt.getDay()]}</small></div>`; }).join("")}</div>
        <p class="muted">Minuten pro Tag. Insgesamt ${Math.round(totalMin)} Minuten, ${total()} Aufgaben, ${S.missionsDone || 0} Tagesmissionen, Serie ${streak()} ${streak() === 1 ? "Tag" : "Tage"}.</p>
      </section>
      <section class="card"><h2>Probe-LZK</h2>${S.probes.length ? `<table class="tbl"><thead><tr><th>Datum</th><th>Richtig</th><th>Note (Orientierung)</th></tr></thead><tbody>${S.probes.slice(-8).reverse().map((p) => `<tr><td>${p.date.split("-").reverse().join(".")}</td><td>${p.pct} %</td><td>${p.grade}</td></tr>`).join("")}</tbody></table>` : `<p class="muted">Noch keine Probe-LZK gemacht.</p>`}</section>
      <section class="card"><h2>Alle Begriffe</h2>${cats.map((c) => `<details><summary>${CATS[c].name} (${catStars(c).full}/${catItems(c).length} sicher)</summary><table class="tbl"><thead><tr><th>Begriff</th><th>Auswählen</th><th>Finden</th><th>Schreiben</th><th>Fehler</th></tr></thead><tbody>${catItems(c).map((it) => `<tr><td>${esc(it.name)}</td>${cell(it, "choice")}${cell(it, "tap")}${cell(it, "write")}<td>${wrongs(it)}</td></tr>`).join("")}</tbody></table></details>`).join("")}</section>
      <section class="card"><h2>Einstellungen</h2>
        <div class="setgrid">
          <label for="rl">Fragen pro Runde</label><select id="rl">${[5, 8, 12].map((n) => `<option value="${n}" ${roundLen() === n ? "selected" : ""}>${n}</option>`).join("")}</select>
          <label for="calm">Ruhiger Modus (kein Konfetti, kein Blinken, leisere Töne)</label><input type="checkbox" id="calm" ${S.calm ? "checked" : ""}>
          <label for="ar">Fragen automatisch vorlesen</label><input type="checkbox" id="ar" ${S.autoRead ? "checked" : ""}>
          <label for="bz">Blitzrunde (mit Zeitdruck) anbieten</label><input type="checkbox" id="bz" ${S.showBlitz ? "checked" : ""}>
          <label for="boss">Boss-Kampf am Ende jeder Etappe (gilt für alle Fächer)</label><input type="checkbox" id="boss" ${bossOn() ? "checked" : ""}>
          <label for="lzk">Datum der LZK</label><input type="date" id="lzk" value="${esc(S.lzkDate || LZK_DATE)}">
        </div>
        <p class="tip">Tipp bei Konzentrationsschwierigkeiten: lieber 2 bis 3 kurze Einheiten am Tag (eine Tagesmission dauert etwa 10 Minuten) als eine lange. Die Bewegungspause zwischen den Etappen hilft beim Weitermachen.</p>
        <h2 style="margin-top:14px">Sicherung</h2>
        <p class="muted">Der Spielstand liegt auf diesem Gerät im Browser und wird zusätzlich doppelt gesichert. Speichere ab und zu eine Sicherungsdatei (landet in „Dateien“). Mit „Sicherung laden“ kommt alles zurück, auch auf einem anderen Gerät.</p>
        <div class="row"><button class="btn" data-act="backup">Sicherung speichern</button><label class="btn ghost" for="bkfile" role="button" tabindex="0">Sicherung laden</label><input type="file" id="bkfile" accept=".json,application/json" hidden></div>
        <button class="linkbtn" data-act="reset" id="rst">Alles zurücksetzen</button>
      </section></div>`;
    const bk = $("#bkfile"); if (bk) bk.onchange = () => { if (bk.files && bk.files[0]) backupLoad(bk.files[0]); };
    const bind = (id, fn) => { const el = $("#" + id); if (el) el.onchange = () => { fn(el); save(); applyCalm(); }; };
    bind("rl", (el) => { S.roundLen = +el.value; });
    bind("calm", (el) => { S.calm = el.checked; });
    bind("ar", (el) => { S.autoRead = el.checked; });
    bind("bz", (el) => { S.showBlitz = el.checked; });
    bind("boss", (el) => { S.bossOn = el.checked; });
    bind("lzk", (el) => { if (/^\d{4}-\d{2}-\d{2}$/.test(el.value)) S.lzkDate = el.value; });
  }

  /* ================= Einstellungen (Kind) ================= */
  function settingsModal() {
    closeModal();
    const m = document.createElement("div");
    m.className = "modal";
    m.innerHTML = `<div class="card"><h2 style="color:var(--text)">Einstellungen</h2>
      <label class="muted" for="nm2">Name</label><input type="text" id="nm2" value="${esc(S.name)}" maxlength="20" autocapitalize="words" autocomplete="off" autocorrect="off" spellcheck="false">
      <label class="switch"><input type="checkbox" id="snd" ${S.sound ? "checked" : ""}> Töne</label>
      <label class="switch"><input type="checkbox" id="spk" ${S.speak ? "checked" : ""}> Namen beim Entdecken vorlesen</label>
      <div class="row"><button class="btn" data-act="savesettings">Fertig</button></div>
      <button class="gate" id="gate" type="button"><span class="gfill" id="gfill"></span><span class="glabel">Für Eltern: gedrückt halten</span></button></div>`;
    document.body.appendChild(m);
    // Eltern-Tür: 2 Sekunden gedrückt halten
    const gate = $("#gate"), ms = TEST.gateMs || 2000;
    let t = null, t0 = 0, raf2 = 0;
    const stop = () => { clearTimeout(t); cancelAnimationFrame(raf2); t = null; $("#gfill").style.width = "0"; };
    const grow = () => { $("#gfill").style.width = Math.min(100, ((Date.now() - t0) / ms) * 100) + "%"; if (t) raf2 = requestAnimationFrame(grow); };
    gate.addEventListener("pointerdown", (e) => { e.preventDefault(); t0 = Date.now(); t = setTimeout(() => { stop(); S.name = ($("#nm2").value || "").trim(); save(); ptab = fachOf(S.subject) ? S.subject : "de"; go("parents"); }, ms); grow(); });
    ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => gate.addEventListener(ev, stop));
  }

  /* ================= Klicks ================= */
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const act = b.dataset.act, v = b.dataset.v;
    switch (act) {
      case "topic": S.topic = v; save(); renderHome(); break;
      case "mode": startRound(v); break;
      case "mission": if (missionStep() < 3) startRound("mission"); else go("home"); break;
      case "blankpick": blankChooser(); break;
      case "bstyle": S.blankStyle = v === "single" ? "single" : "sheet"; save(); blankChooser(); break;
      case "blank": startBlank(v); break;
      case "blankwrong": startBlank(R.cat, R.q.filter((it) => R.status[it.id] === "bad").map((it) => it.id)); break;
      case "closemodal": closeModal(); break;
      case "pause": startPause(R && R.mode === "mission" ? "mission" : null); break;
      case "pausedone":
        if (typeof pauseNext === "function") { const fn = pauseNext; pauseNext = null; fn(); }
        else if (pauseNext === "mission" && missionStep() < 3) startRound("mission"); else go("home");
        break;
      case "discover": D = null; go("discover"); break;
      case "layer": D.layer = v; D.sel = null; renderDiscover(); break;
      case "badges": go("badges"); break;
      case "home": go("home"); break;
      case "quit": if (R) addTime(R); go("home"); break;
      case "again": if (R.mode === "blank") startBlank(R.cat); else if (R.mode === "mission") startRound(missionStep() < 3 ? "mission" : "mix"); else startRound(R.mode); break;
      case "say": say(v); break;
      case "settings": settingsModal(); break;
      case "savename": S.name = ($("#nm").value || "").trim(); pet().name = ($("#dn") && $("#dn").value || "").trim() || pet().name; S.askedName = true; save(); closeModal(); renderHome(); break;
      case "pet": go("pet"); break;
      case "petpet": petPet(); break;
      case "petkind": petKind(v); break;
      case "feed": petFeed(v); break;
      case "buy": petShop(...v.split(":")); break;
      case "wear": petWear(v); break;
      case "room": if (B.ROOMS.some((x) => x.id === v) && (B.roomOf(v).price === 0 || (pet().rooms || []).includes(v))) { pet().room = v; save(); renderPet(); } break;
      case "backup": backupDownload(); toast("Sicherung gespeichert."); break;
      case "skipname": S.askedName = true; save(); closeModal(); break;
      case "savesettings": S.name = ($("#nm2").value || "").trim(); S.sound = $("#snd").checked; S.speak = $("#spk").checked; save(); closeModal(); renderHome(); break;
      case "reset":
        if (b.dataset.sure) { S = defaults(); S.askedName = true; S.gift2 = true; save(); go("home"); }
        else { b.dataset.sure = "1"; b.textContent = "Wirklich alles löschen? Noch einmal tippen."; b.classList.add("danger"); }
        break;
      case "subject": if (v === "de" || fachOf(v)) { S.subject = v; save(); go("home"); } break;
      case "ptab": ptab = v; renderParents(); window.scrollTo(0, 0); break;
      default: { const f = fachFor(act); if (f) f.act(act, v, b); }
    }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.id === "nm") document.querySelector('[data-act="savename"]').click(); });

  // Beim Schreiben passt die Karte in den Bereich über der Bildschirmtastatur.
  // Sichtbare Höhe kommt aus visualViewport (Tests können --vvh setzen).
  const vv = window.visualViewport;
  function visibleHeight() {
    const forced = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--vvh"));
    return forced || (vv ? vv.height : innerHeight);
  }
  function fitMap() {
    const mw = $(".stage .mapwrap");
    if (!mw) return;
    if (!$(".stage.writing")) { mw.style.height = ""; mw.style.width = ""; return; }
    const top = mw.getBoundingClientRect().top + window.scrollY;
    const hgt = Math.max(200, Math.floor(visibleHeight() - top - 12));
    mw.style.height = hgt + "px";
    mw.style.width = "auto";
  }
  if (vv) vv.addEventListener("resize", () => { if ($(".stage.writing")) { window.scrollTo(0, 0); fitMap(); } });
  addEventListener("resize", fitMap);
  window.__DE_fit = fitMap;

  /* ================= Fächer ================= */
  // Ein Fach ist eine Fabrik in window.DE_FAECHER: (core) => ({ id, prefix, name, icon, home, render, act, badges, activeOn, parents, bindParents }).
  // Ansichten und data-act des Fachs beginnen mit seinem prefix (z. B. "m-").
  const core = {
    get S() { return S; }, get view() { return view; }, app, TEST,
    save, go, $, esc, tone, say, confetti, toast, dayKey, streak, startPause, addTime, checkBadges, header, closeModal, gradeFor, sample, shuffle,
    // Begleiter, Boss, Rennen, Effekte: für alle Fächer gleich
    fx, bossUI, bossOn, race, gdog, petReact, giveBlocks, totalXp,
    // Pausen-Hinweis nach 15 Minuten Übungszeit (einmal pro Sitzung)
    pauseHint() { if (sessionMin >= (TEST.pauseAfterMin || 15) && !pauseHinted) { pauseHinted = true; return true; } return false; },
  };
  FAECH = (window.DE_FAECHER || []).map((make) => make(core));
  if (S.subject !== "de" && !fachOf(S.subject)) S.subject = "de";

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
  window.__DE = { get S() { return S; }, get R() { return R; }, ITEMS, get F() { return FAECH; }, totalXp };
  // Einmaliges Geschenk nach dem verlorenen Spielstand: 5000 Punkte und 24 Stunden dreifache Punkte zum Aufholen
  if (!S.gift2 && (!window.__DE_TEST || TEST.gift)) {
    S.gift = (S.gift || 0) + 5000; S.gift2 = true;
    S.boost = { until: Date.now() + 24 * 3600000, mult: 3, extra: 0, last: rawXp() };
    save();
    setTimeout(() => toast("🎁 5000 Geschenk-Punkte! Und einen Tag lang dreifache Punkte zum Aufholen 🚀"), 600);
  }
  render();
})();
