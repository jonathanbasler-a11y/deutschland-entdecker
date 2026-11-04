"use strict";
(function () {
  const { judge, judgeNumber, gradeFor, sample, shuffle } = DELogic;
  const app = document.getElementById("app");
  const KEY = "deutschland-entdecker-v1";
  const TEST = window.__DE_TEST || {};

  /* ================= Speicher ================= */
  const defaults = () => ({
    name: "", askedName: false, xp: 0, items: {}, days: {}, mins: {}, badges: {}, probes: [], blitzBest: 0, topic: "all",
    sound: true, speak: false,
    // Einstellungen aus der Eltern-Übersicht
    roundLen: 8, calm: false, autoRead: false, showBlitz: true, lzkDate: LZK_DATE,
    mission: { day: "", step: 0 }, missionsDone: 0, blankMode: "write", ui: { more: false },
    subject: "de", // gewähltes Fach: "de" (Deutschland) oder eines aus DE_FAECHER
  });
  let S = defaults();
  try { const raw = JSON.parse(localStorage.getItem(KEY) || "null"); if (raw) S = Object.assign(defaults(), raw); } catch (e) { /* ohne Speicher weiter */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* egal */ } };

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
    { id: "laender", icon: "🏙️", name: "Länder-Kenner", desc: "Alle 16 Bundesländer mit 3 Sternen", ok: () => full("states") },
    { id: "nachbarn", icon: "🧭", name: "Nachbarn-Profi", desc: "Alle 9 Nachbarländer mit 3 Sternen", ok: () => full("neighbors") },
    { id: "fluss", icon: "🌊", name: "Flussprofi", desc: "Rhein, Donau, Elbe, Weser und Neckar mit 3 Sternen", ok: () => ["rhein", "donau", "elbe", "weser", "neckar"].every((k) => stars(BY_ID["w_" + k]) === 3) },
    { id: "wasser", icon: "⚓", name: "Wassermeister", desc: "Alle 8 Gewässer mit 3 Sternen", ok: () => full("water") },
    { id: "gipfel", icon: "⛰️", name: "Gipfelstürmer", desc: "Alle 7 Gebirge mit 3 Sternen", ok: () => full("mountains") },
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
  function tone(kind) {
    if (!S.sound) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === "suspended") ac.resume();
      const seq = { ok: [[660, 0], [880, 0.09]], bad: [[220, 0], [180, 0.1]], win: [[523, 0], [659, 0.1], [784, 0.2], [1047, 0.3]] }[kind];
      const vol = S.calm ? 0.08 : 0.18;
      for (const [f, t] of seq) {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = kind === "bad" ? "triangle" : "sine";
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, ac.currentTime + t);
        g.gain.exponentialRampToValueAtTime(vol, ac.currentTime + t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + t + 0.22);
        o.connect(g); g.connect(ac.destination);
        o.start(ac.currentTime + t); o.stop(ac.currentTime + t + 0.25);
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
      g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.globalAlpha = Math.min(1, p.life / 30);
      g.fillRect(-p.s / 2, -p.s / 3, p.s, p.s / 1.6); g.restore();
    }
    raf = parts.length ? requestAnimationFrame(stepConfetti) : 0;
    if (!raf) g.clearRect(0, 0, cv.width, cv.height);
  }
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
  const BIG_HIT = { s_hb: 30, s_hh: 28, s_be: 28 };
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
  function labels(items) {
    const l = $("#lab");
    l.innerHTML = items.map((it) => `<text class="${labelCls[it.cat]}" x="${it.label[0]}" y="${it.label[1]}" ${it.small ? 'style="font-size:15px"' : ""}>${esc(it.name)}</text>`).join("");
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
    m.innerHTML = `<div class="card"><h1>Willkommen!</h1><p>Wie heißt du? Der Name bleibt nur auf diesem iPad.</p><input type="text" id="nm" placeholder="Dein Vorname" autocapitalize="words" autocomplete="off" autocorrect="off" spellcheck="false" maxlength="20"><div class="row"><button class="btn" data-act="savename">Los geht's</button><button class="btn ghost" data-act="skipname">Überspringen</button></div></div>`;
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
      const kind = it.cat === "water" ? it.kind : it.cat === "states" ? "Bundesland" : it.cat === "neighbors" ? "Nachbarland" : "Gebirge";
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
  const weight = (it) => 1 + (it.skills.length - stars(it)) * 1.5 + (lastWrong(it) ? 3 : 0);
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
      add("general", 5); add("neighbors", 4); add("states", 6); add("water", 4); add("mountains", 3);
      return shuffle(q);
    }
    if (mode === "mission") {
      const sk = MISSION[Math.min(2, missionStep())].skill;
      return sample(poolFor("all", sk), MISSION_LEN, weight).map((it) => ({ it, skill: sk }));
    }
    if (mode === "blitz") return shuffle(poolFor(topic, "tap")).concat(shuffle(poolFor(topic, "tap"))).map((it) => ({ it, skill: "tap" }));
    if (mode === "mix") {
      return sample(poolFor(topic), roundLen(), weight).map((it) => {
        const min = Math.min(...it.skills.map((s) => lvl(it.id, s)));
        const c = it.skills.filter((s) => lvl(it.id, s) === min);
        return { it, skill: c[Math.floor(Math.random() * c.length)] };
      });
    }
    return sample(poolFor(topic, mode), roundLen(), weight).map((it) => ({ it, skill: mode }));
  }

  function gameShell(mode) {
    return `<div class="game">
      <div class="gbar"><button class="icon-btn" data-act="quit" aria-label="Beenden">✕</button>
        ${mode === "blitz" ? `<div class="timer" style="flex:1"><i id="tm"></i></div>` : `<div class="progress"><i id="pg"></i></div>`}<span class="count" id="cnt"></span>
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
    R = { tok: Math.random(), mode, topic, q, i: 0, results: [], xp: 0, hits: 0, t0: Date.now(), mstep: missionStep() };
    app.innerHTML = gameShell(mode);
    wireGame();
    if (mode === "blitz") blitzTimer();
    showQuestion();
  }

  function blitzTimer() {
    const tok = R.tok, end = Date.now() + (TEST.blitzMs || 60000);
    const tick = () => {
      if (!R || R.tok !== tok) return;
      const left = end - Date.now();
      const bar = $("#tm");
      if (bar) bar.style.width = Math.max(0, left / 600) + "%";
      if (left <= 0) { R.lock = true; return finish(); }
      setTimeout(tick, 100);
    };
    tick();
  }

  function updateBar() {
    let n = R.q.length, done = R.i;
    if (R.mode === "blank") done = R.q.filter((it) => R.status[it.id] === "ok" || R.status[it.id] === "bad").length;
    const pg = $("#pg"); if (pg) pg.style.width = (done / n) * 100 + "%";
    const c = $("#cnt");
    if (c) c.textContent = R.mode === "blitz" ? "✔ " + R.hits : R.mode === "blank" ? done + " / " + n : Math.min(R.i + 1, n) + " / " + n;
    const x = $("#xpv"); if (x) x.textContent = "+" + R.xp;
  }

  function showQuestion() {
    if (R.i >= R.q.length) return finish();
    const q = R.q[R.i];
    R.cur = q; R.lock = false; R.waitNext = false; R.attempt = 0; R.onMap = null; R.onPanel = null;
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
    const gain = (res === "first" ? 10 : res === "second" ? 5 : 0) + (ok && q.skill === "write" ? 5 : 0);
    S.xp += gain; R.xp += gain;
    if (ok) R.hits++;
    R.results.push({ q, res, ok });
    tone(ok ? "ok" : "bad");
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
    $("#panel").innerHTML = `<div class="prompt"><small>Auswählen</small><h2>${CATS[it.cat].ask}</h2></div><div class="opts">${opts.map((o) => `<button class="opt" data-a="opt" data-id="${o.id}">${esc(o.name)}</button>`).join("")}</div><div id="fb"></div><div id="act"></div>`;
    readAloud(CATS[it.cat].ask);
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
    const inp = writeForm(CATS[it.cat].ask + " Schreibe den Namen.", "Name eintippen");
    readAloud(CATS[it.cat].ask);
    $("#wf").onsubmit = (e) => {
      e.preventDefault();
      if (R.lock) { if (R.waitNext) next(); return; }
      const j = judge(inp.value, nameList(it));
      if (j.kind === "empty") return inp.focus();
      finishWrite(q, j, inp, it.name, () => { clearHL(); highlight(it, "ok"); labels([it]); }, wrongTip(it, j.kind));
    };
  }
  // gemeinsame Auswertung für Schreib-Aufgaben
  function finishWrite(q, j, inp, correct, reveal, tip) {
    if (j.ok) {
      R.lock = true; inp.classList.add("ok");
      reveal();
      const note = j.kind === "spelling" ? `<small>So schreibt man es richtig: ${esc(correct)}</small>` : j.kind === "case" ? `<small>Namen schreibt man groß: ${esc(correct)}</small>` : "";
      fb("ok", pr() + note);
      commit(q, R.attempt === 0 ? "first" : "second");
      return later(next, note ? 1800 : 1000);
    }
    R.attempt++;
    inp.classList.add("bad");
    setTimeout(() => inp.classList.remove("bad"), 600);
    if (probe() || R.attempt >= 2) {
      R.lock = true; R.waitNext = true;
      const ws = $("#ws"); ws.textContent = "Weiter"; ws.classList.add("next");
      reveal();
      fb("bad", `Richtig ist: ${esc(correct)}${j.kind === "close" ? "<small>Das war knapp daneben.</small>" : ""}`);
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
  function renderGenWrite(q) {
    const g = q.it.g, w = g.write;
    const inp = writeForm(esc(w.q), w.num ? "Zahl eintippen" : "Antwort eintippen");
    inp.setAttribute("autocapitalize", w.num ? "off" : "words");
    if (w.num) inp.setAttribute("inputmode", "numeric");
    readAloud(w.q);
    $("#wf").onsubmit = (e) => {
      e.preventDefault();
      if (R.lock) { if (R.waitNext) next(); return; }
      const j = w.num ? judgeNumber(inp.value, w.num, w.show) : judge(inp.value, w.answers);
      if (j.kind === "empty") return inp.focus();
      finishWrite(q, j, inp, w.show, () => {}, j.kind === "close" ? "Fast! Schau noch einmal genau auf die Buchstaben." : "Nicht ganz. Überlege noch einmal.");
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
    m.innerHTML = `<div class="card"><h2 style="color:var(--text)">Stumme Karte</h2><p class="muted">Auf der Karte stehen Nummern. Schreibe zu jeder Nummer den Namen, wie in der LZK.</p>
      <div class="choose">${MAP_CATS.map((c) => `<button class="mode" data-act="blank" data-v="${c}"><b>${CATS[c].name}</b><span>${catItems(c).length} Nummern</span></button>`).join("")}</div>
      <button class="btn ghost" data-act="closemodal">Abbrechen</button></div>`;
    document.body.appendChild(m);
  }
  function startBlank(cat, onlyIds) {
    closeModal();
    // Nummern von Nord nach Süd, wie auf einem Arbeitsblatt
    const all = catItems(cat).slice().sort((a, b) => a.label[1] - b.label[1] || a.label[0] - b.label[0]);
    const nums = {};
    all.forEach((it, i) => { nums[it.id] = i + 1; });
    const ask = onlyIds ? all.filter((it) => onlyIds.includes(it.id)) : all;
    view = "game";
    R = { tok: Math.random(), mode: "blank", cat, all, nums, q: ask, queue: ask.map((it) => it.id), status: {}, results: [], xp: 0, hits: 0, t0: Date.now(), i: 0, onlyIds };
    if (onlyIds) all.forEach((it) => { if (!onlyIds.includes(it.id)) R.status[it.id] = "known"; });
    app.innerHTML = gameShell("blank");
    wireGame();
    const svg = $(".stage .map");
    svg.classList.toggle("show-mtn", cat === "mountains");
    svg.classList.add("focus", "blankmap");
    $("#panel").innerHTML = `<div class="prompt"><small>Stumme Karte · ${CATS[cat].name}</small><h2>Wie heißt <span class="numbadge" id="bnum"></span>?</h2></div>
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
      if (st === "ok" || st === "bad" || st === "known") s += `<text class="numlab ${st}" x="${x}" y="${y + 36}">${esc(it.name)}</text>`;
      return s;
    }).join("");
    $("#bgrid").innerHTML = R.all.map((it) => `<button class="nb-cell ${it.id === R.cur && !blankDone(it.id) ? "cur" : R.status[it.id] || "open"}" data-a="jump" data-id="${it.id}" ${blankDone(it.id) ? "disabled" : ""}>${R.nums[it.id]}</button>`).join("");
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
    fb("ok", pr() + (kindNote || ""));
    commit({ it, skill }, R.attempt === 0 ? "first" : "second");
    drawNums();
    later(blankNext, kindNote ? 1500 : 800);
  }
  function blankFailed(it, skill) {
    R.lock = true; R.waitNext = true;
    R.status[it.id] = "bad";
    clearHL(); highlight(it, "ok");
    fb("bad", `Nummer ${R.nums[it.id]} ist: ${esc(it.name)}${S.blankMode === "bank" ? `<button class="btn" data-a="bnext" id="bnx" type="button" style="margin-top:10px;width:100%">Weiter</button>` : ""}`);
    commit({ it, skill }, "fail");
    drawNums();
    const bs = $("#bs");
    if (bs && S.blankMode !== "bank") { bs.textContent = "Weiter"; bs.classList.add("next"); }
  }
  function blankSubmit(e) {
    e.preventDefault();
    if (R.lock) { if (R.waitNext) blankNext(); return; }
    const it = BY_ID[R.cur], inp = $("#bi");
    const j = judge(inp.value, nameList(it));
    if (j.kind === "empty") return inp.focus();
    if (j.ok) {
      inp.classList.add("ok");
      const note = j.kind === "spelling" ? `<small>So schreibt man es richtig: ${esc(it.name)}</small>` : j.kind === "case" ? `<small>Namen schreibt man groß: ${esc(it.name)}</small>` : "";
      return blankSolved(it, "write", note);
    }
    R.attempt++;
    inp.classList.add("bad");
    setTimeout(() => inp.classList.remove("bad"), 600);
    if (R.attempt >= 2) return blankFailed(it, "write");
    tone("bad");
    fb("hint", wrongTip(it, j.kind));
    inp.select();
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
    if (r.mode === "blitz" && r.hits > S.blitzBest) { r.record = true; S.blitzBest = r.hits; }
    if (r.mode === "mission") {
      const step = Math.min(3, r.mstep + 1);
      S.mission = { day: dayKey(), step };
      if (step === 3) S.missionsDone = (S.missionsDone || 0) + 1;
      r.newStep = step;
    }
    if (r.mode === "blank" && n === r.all.length && ok === n) S.blankPerfect = true;
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
      sub = `${r.ok} von ${r.n} richtig (${r.pct} %). Das ist nur eine Orientierung, nicht die Note der Lehrerin.`;
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
    app.innerHTML = `<div class="results"><div class="card hero"><h1>${head}</h1><div class="score">${big}</div><p class="muted">${sub}</p>${extra}</div>
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
        return `<g class="num ${st}"><circle cx="${x}" cy="${y}" r="16"/><text x="${x}" y="${y + 6}">${r.nums[it.id]}</text></g><text class="numlab ${st}" x="${x}" y="${y + 36}">${esc(it.name)}</text>`;
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
          <label for="lzk">Datum der LZK</label><input type="date" id="lzk" value="${esc(S.lzkDate || LZK_DATE)}">
        </div>
        <p class="tip">Tipp bei Konzentrationsschwierigkeiten: lieber 2 bis 3 kurze Einheiten am Tag (eine Tagesmission dauert etwa 10 Minuten) als eine lange. Die Bewegungspause zwischen den Etappen hilft beim Weitermachen.</p>
        <button class="linkbtn" data-act="reset" id="rst">Alles zurücksetzen</button>
      </section></div>`;
    const bind = (id, fn) => { const el = $("#" + id); if (el) el.onchange = () => { fn(el); save(); applyCalm(); }; };
    bind("rl", (el) => { S.roundLen = +el.value; });
    bind("calm", (el) => { S.calm = el.checked; });
    bind("ar", (el) => { S.autoRead = el.checked; });
    bind("bz", (el) => { S.showBlitz = el.checked; });
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
      case "savename": S.name = ($("#nm").value || "").trim(); S.askedName = true; save(); closeModal(); renderHome(); break;
      case "skipname": S.askedName = true; save(); closeModal(); break;
      case "savesettings": S.name = ($("#nm2").value || "").trim(); S.sound = $("#snd").checked; S.speak = $("#spk").checked; save(); closeModal(); renderHome(); break;
      case "reset":
        if (b.dataset.sure) { S = defaults(); S.askedName = true; save(); go("home"); }
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
    // Pausen-Hinweis nach 15 Minuten Übungszeit (einmal pro Sitzung)
    pauseHint() { if (sessionMin >= (TEST.pauseAfterMin || 15) && !pauseHinted) { pauseHinted = true; return true; } return false; },
  };
  FAECH = (window.DE_FAECHER || []).map((make) => make(core));
  if (S.subject !== "de" && !fachOf(S.subject)) S.subject = "de";

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
  window.__DE = { get S() { return S; }, get R() { return R; }, ITEMS, get F() { return FAECH; } };
  render();
})();
