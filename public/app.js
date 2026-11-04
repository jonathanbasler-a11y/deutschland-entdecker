"use strict";
(function () {
  const { judge, judgeNumber, gradeFor, sample, shuffle } = DELogic;
  const app = document.getElementById("app");
  const KEY = "deutschland-entdecker-v1";

  /* ================= Speicher ================= */
  const defaults = () => ({ name: "", askedName: false, xp: 0, items: {}, days: {}, badges: {}, sound: true, speak: false, probes: [], blitzBest: 0, topic: "all" });
  let S = defaults();
  try { const raw = JSON.parse(localStorage.getItem(KEY) || "null"); if (raw) S = Object.assign(defaults(), raw); } catch (e) { /* ohne Speicher weiter */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* egal */ } };

  const pad = (n) => String(n).padStart(2, "0");
  const dayKey = (d = new Date()) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ================= Fortschritt ================= */
  const lvl = (id, sk) => (S.items[id] && S.items[id][sk]) || 0;
  const stars = (it) => it.skills.filter((sk) => lvl(it.id, sk) >= 1).length;
  const lastWrong = (it) => S.items[it.id] && S.items[it.id].last === "x";
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
    S.days[dayKey()] = (S.days[dayKey()] || 0) + 1;
  }
  function streak() {
    let n = 0;
    const d = new Date();
    if (!S.days[dayKey(d)]) d.setDate(d.getDate() - 1);
    while (S.days[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  const rankOf = (xp) => RANKS.reduce((r, x) => (xp >= x.xp ? x : r), RANKS[0]);
  const nextRank = (xp) => RANKS.find((r) => r.xp > xp);
  function daysToLZK() {
    const a = new Date(dayKey() + "T00:00:00"), b = new Date(LZK_DATE + "T00:00:00");
    return Math.round((b - a) / 864e5);
  }

  const full = (cat) => catItems(cat).every((i) => stars(i) === i.skills.length);
  const BADGES = [
    { id: "start", icon: "🚀", name: "Erster Schritt", desc: "10 Aufgaben gelöst", ok: () => total() >= 10 },
    { id: "laender", icon: "🗺️", name: "Länder-Kenner", desc: "Alle 16 Bundesländer mit 3 Sternen", ok: () => full("states") },
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
  function checkBadges() {
    for (const b of BADGES) {
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
      for (const [f, t] of seq) {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = kind === "bad" ? "triangle" : "sine";
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, ac.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.18, ac.currentTime + t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + t + 0.22);
        o.connect(g); g.connect(ac.destination);
        o.start(ac.currentTime + t); o.stop(ac.currentTime + t + 0.25);
      }
    } catch (e) { /* kein Ton */ }
  }
  function say(text) {
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "de-DE"; u.rate = 0.9;
      speechSynthesis.speak(u);
    } catch (e) { /* keine Sprachausgabe */ }
  }
  const cv = document.getElementById("confetti");
  let parts = [], raf = 0;
  function confetti(n = 70) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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

  /* ================= Karte ================= */
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
    s += `<g id="hlO"></g><g id="lab"></g></svg>`;
    return s;
  }
  const BIG_HIT = { s_hb: 30, s_hh: 28, s_be: 28 };
  const idsOf = (cat) => new Set(catItems(cat).map((i) => i.id));
  const $ = (sel, root = document) => root.querySelector(sel);

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
  const go = (v) => { view = v; R && (R.tok = -1); render(); window.scrollTo(0, 0); };

  function render() {
    if (view === "home") return renderHome();
    if (view === "discover") return renderDiscover();
    if (view === "badges") return renderBadges();
    if (view === "results") return renderResults();
  }

  function topChips() {
    const d = daysToLZK(), s = streak(), today = S.days[dayKey()] || 0;
    const lzk = d > 0 ? `<div class="chip lzk"><small>LZK in</small><b>${d} ${d === 1 ? "Tag" : "Tagen"}</b></div>` : d === 0 ? `<div class="chip lzk"><small>Heute</small><b>LZK! 🍀</b></div>` : "";
    return `<div class="chips">${lzk}<div class="chip"><small>Serie</small><b>🔥 ${s}</b></div><div class="chip"><small>Heute</small><b>${today}/20</b></div></div>`;
  }

  function renderHome() {
    const r = rankOf(S.xp), nr = nextRank(S.xp);
    const pct = nr ? Math.round(((S.xp - r.xp) / (nr.xp - r.xp)) * 100) : 100;
    const tp = S.topic;
    const canTap = tp !== "general";
    const topicBtn = (t) => {
      const c = catStars(t);
      const name = t === "all" ? "Alles" : CATS[t].name;
      const sub = t === "general" ? `${c.full}/${c.n} gemeistert` : t === "all" ? `${c.got}/${c.max} ★` : `${c.full}/${c.n} gemeistert`;
      return `<button class="topic" data-act="topic" data-v="${t}" aria-pressed="${tp === t}"><b>${name}</b><small>${sub}</small><span class="fill" style="width:${c.max ? Math.round((c.got / c.max) * 100) : 0}%"></span></button>`;
    };
    const weak = ITEMS.filter((i) => i.cat !== "general" && (tp === "all" || i.cat === tp)).sort((a, b) => stars(a) - stars(b) || (lastWrong(b) ? 1 : 0) - (lastWrong(a) ? 1 : 0)).slice(0, 4);
    app.innerHTML = `
      <div class="top">
        <div class="hello"><h1>${S.name ? "Hallo " + esc(S.name) + "!" : "Deutschland-Entdecker"}</h1>
          <div><span class="rank">${r.name}</span> · ${S.xp} Punkte${nr ? ` · noch ${nr.xp - S.xp} bis ${nr.name}` : ""}</div>
          <div class="xpbar"><i style="width:${pct}%"></i></div></div>
        ${topChips()}
        <button class="icon-btn" data-act="badges" aria-label="Abzeichen">🏅</button>
        <button class="icon-btn" data-act="settings" aria-label="Einstellungen">⚙️</button>
      </div>
      <div class="home">
        <section class="card"><h2>Meine Karte</h2><div class="minimap" id="mini">${mapMarkup()}</div>
          <div class="legend"><span>Je mehr Sterne, desto bunter die Karte.</span><span>★ Auswählen</span><span>★ Finden</span><span>★ Schreiben</span></div>
          ${weak.length ? `<h2 style="margin-top:14px">Das üben wir noch</h2><div class="weak">${weak.map((i) => `<span class="pill">${esc(i.name)} ${"★".repeat(stars(i))}${"☆".repeat(i.skills.length - stars(i))}</span>`).join("")}</div>` : ""}</section>
        <div class="right">
          <section class="card"><h2>Was möchtest du üben?</h2><div class="topics">${["states", "neighbors", "water", "mountains", "general", "all"].map(topicBtn).join("")}</div></section>
          <section class="card"><h2>Wie möchtest du üben?</h2><div class="modes">
            <button class="mode big" data-act="mode" data-v="mix"><span class="ico">🎯</span><div><b>Los geht's: Meine Schwächen üben</b><br><span>Die App sucht aus, was du noch nicht sicher kannst.</span></div></button>
            <button class="mode" data-act="discover"><span class="ico">👆</span><b>Entdecken</b><span>Tippe auf die Karte und lerne die Namen.</span></button>
            <button class="mode" data-act="mode" data-v="tap" ${canTap ? "" : "disabled"}><span class="ico">📍</span><b>Finden</b><span>Der Name steht da, du tippst auf die Karte.</span></button>
            <button class="mode" data-act="mode" data-v="choice"><span class="ico">🔤</span><b>Auswählen</b><span>Ein Gebiet leuchtet, du wählst den Namen.</span></button>
            <button class="mode" data-act="mode" data-v="write"><span class="ico">✏️</span><b>Schreiben</b><span>Ein Gebiet leuchtet, du schreibst den Namen.</span></button>
            <button class="mode" data-act="mode" data-v="blitz" ${canTap ? "" : "disabled"}><span class="ico">⚡</span><b>Blitzrunde</b><span>60 Sekunden, so viele Treffer wie möglich. Rekord: ${S.blitzBest}</span></button>
            <button class="mode" data-act="mode" data-v="probe"><span class="ico">🎓</span><b>Probe-LZK</b><span>Fragen aus allem, am Ende gibt es eine Note.</span></button>
          </div></section>
        </div>
      </div>`;
    paintProgress($("#mini"));
    $("#mini svg").style.pointerEvents = "none";
    if (!S.askedName) nameModal();
  }

  function nameModal() {
    const m = document.createElement("div");
    m.className = "modal";
    m.innerHTML = `<div class="card"><h1>Willkommen!</h1><p>Wie heißt du? Der Name bleibt nur auf diesem iPad.</p><input type="text" id="nm" placeholder="Dein Vorname" autocapitalize="words" autocomplete="off" autocorrect="off" spellcheck="false" maxlength="20"><div class="row"><button class="btn" data-act="savename">Los geht's</button><button class="btn ghost" data-act="skipname">Überspringen</button></div></div>`;
    document.body.appendChild(m);
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
      if (S.speak) say(it.name);
      tone("ok");
    };
  }

  /* ---------- Abzeichen ---------- */
  function renderBadges() {
    app.innerHTML = `<div class="results"><div class="gbar"><button class="icon-btn" data-act="home" aria-label="Zurück">←</button><h1 style="flex:1">Abzeichen</h1></div>
      <div class="badges">${BADGES.map((b) => `<div class="badge ${S.badges[b.id] ? "got" : ""}"><div class="medal">${b.icon}</div><div><b>${b.name}</b><small>${b.desc}</small></div></div>`).join("")}</div></div>`;
  }

  /* ================= Spielrunden ================= */
  const nameList = (it) => [it.name].concat(it.alts);
  const weight = (it) => 1 + (it.skills.length - stars(it)) * 1.5 + (lastWrong(it) ? 3 : 0);
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
    if (mode === "blitz") return shuffle(poolFor(topic, "tap")).concat(shuffle(poolFor(topic, "tap"))).map((it) => ({ it, skill: "tap" }));
    if (mode === "mix") {
      return sample(poolFor(topic), 12, weight).map((it) => {
        const min = Math.min(...it.skills.map((s) => lvl(it.id, s)));
        const c = it.skills.filter((s) => lvl(it.id, s) === min);
        return { it, skill: c[Math.floor(Math.random() * c.length)] };
      });
    }
    return sample(poolFor(topic, mode), 10, weight).map((it) => ({ it, skill: mode }));
  }

  function startRound(mode) {
    const topic = S.topic;
    const q = buildQueue(mode, topic);
    if (!q.length) return toast("Dazu gibt es hier keine Aufgaben. Wähle ein anderes Thema.");
    R = { tok: Math.random(), mode, topic, q, i: 0, results: [], xp: 0, hits: 0, t0: Date.now() };
    app.innerHTML = `<div class="game">
      <div class="gbar"><button class="icon-btn" data-act="quit" aria-label="Beenden">✕</button>
        ${mode === "blitz" ? `<div class="timer" style="flex:1"><i id="tm"></i></div><span class="count" id="cnt"></span>` : `<div class="progress"><i id="pg"></i></div><span class="count" id="cnt"></span>`}
        <span class="xp" id="xpv"></span></div>
      <div class="stage" id="stage"><div class="mapwrap" id="mapwrap">${mapMarkup()}</div><aside class="panel" id="panel"></aside></div></div>`;
    $("#mapwrap .map").onclick = (e) => R && R.onMap && R.onMap(e);
    $("#panel").onclick = (e) => { const b = e.target.closest("[data-a]"); if (b && R && R.onPanel) R.onPanel(b); };
    if (mode === "blitz") blitzTimer();
    showQuestion();
  }

  function blitzTimer() {
    const tok = R.tok, end = Date.now() + ((window.__DE_TEST && window.__DE_TEST.blitzMs) || 60000);
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
    const n = R.q.length;
    const pg = $("#pg"); if (pg) pg.style.width = (R.i / n) * 100 + "%";
    const c = $("#cnt"); if (c) c.textContent = R.mode === "blitz" ? "✔ " + R.hits : Math.min(R.i + 1, n) + " / " + n;
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
    if (!gen) { clearHL(); $(".map").classList.remove("show-mtn"); }
    if (gen) return q.skill === "write" ? renderGenWrite(q) : q.it.g.flag ? renderFlag(q) : renderGenChoice(q);
    if (q.skill === "tap") return renderTap(q);
    if (q.skill === "choice") return renderChoice(q);
    return renderWrite(q);
  }

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

  // --- Finden: Name steht da, Karte antippen ---
  function renderTap(q) {
    const it = q.it;
    $("#panel").innerHTML = `<div class="prompt"><small>${blitz() ? "Schnell!" : "Tippe auf die Karte"}</small><h2>Finde:<span class="big">${esc(it.name)}</span></h2></div>${blitz() ? "" : speakBtn(it.name)}<div id="fb"></div><div id="act"></div>`;
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
      const mw = $("#mapwrap"); mw.classList.remove("shake"); void mw.offsetWidth; mw.classList.add("shake");
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

  /* ================= Ende der Runde ================= */
  function finish() {
    if (!R) return;
    const r = R, ok = r.results.filter((x) => x.ok).length, n = r.results.length;
    r.tok = -1; // ausstehende Zeitgeber (Weiter nach Treffer) dürfen nichts mehr tun
    r.ok = ok; r.n = n;
    r.pct = n ? Math.round((ok / n) * 100) : 0;
    if (r.mode === "probe") {
      r.grade = gradeFor(r.pct);
      S.probes.push({ date: dayKey(), pct: r.pct, grade: r.grade });
    }
    if (r.mode === "blitz" && r.hits > S.blitzBest) { r.record = true; S.blitzBest = r.hits; }
    save();
    checkBadges();
    view = "results";
    render();
    if (r.pct >= 80 || r.record) { confetti(120); tone("win"); }
  }

  function renderResults() {
    const r = R;
    const good = [], todo = [];
    const seen = new Set();
    for (const x of r.results) { if (seen.has(x.q.it.id)) continue; seen.add(x.q.it.id); (x.ok ? good : todo).push(x.q.it); }
    let head, big, sub;
    if (r.mode === "probe") {
      head = "Probe-LZK geschafft!"; big = "Note " + r.grade;
      sub = `${r.ok} von ${r.n} richtig (${r.pct} %). Das ist nur eine Orientierung, nicht die Note der Lehrerin.`;
    } else if (r.mode === "blitz") {
      head = r.record ? "Neuer Rekord!" : "Zeit um!"; big = r.hits + " Treffer";
      sub = `${r.n - r.ok} daneben. Dein Rekord: ${S.blitzBest}.`;
    } else {
      head = r.pct >= 80 ? "Stark gemacht!" : r.pct >= 50 ? "Gut gemacht!" : "Weiter üben, du schaffst das!";
      big = `${r.ok} / ${r.n}`; sub = `+${r.xp} Punkte`;
    }
    const li = (it) => `<li>${esc(it.name)}${it.cat === "general" ? "" : ` <span class="muted">(${CATS[it.cat].short})</span>`}</li>`;
    app.innerHTML = `<div class="results"><div class="card hero"><h1>${head}</h1><div class="score">${big}</div><p class="muted">${sub}</p></div>
      <div class="listcols"><div class="card"><h2>Das kannst du schon</h2><ul>${good.map(li).join("") || "<li class='muted'>noch nichts</li>"}</ul></div>
      <div class="card"><h2>Das üben wir noch</h2><ul>${todo.map(li).join("") || "<li class='muted'>alles richtig 🎉</li>"}</ul></div></div>
      <div class="row"><button class="btn" data-act="again">Noch einmal</button><button class="btn ghost" data-act="home">Zur Startseite</button></div></div>`;
  }

  /* ================= Einstellungen ================= */
  function settingsModal() {
    const m = document.createElement("div");
    m.className = "modal";
    m.innerHTML = `<div class="card"><h2 style="color:var(--text)">Einstellungen</h2>
      <label class="muted" for="nm2">Name</label><input type="text" id="nm2" value="${esc(S.name)}" maxlength="20" autocapitalize="words" autocomplete="off" autocorrect="off" spellcheck="false">
      <label class="switch"><input type="checkbox" id="snd" ${S.sound ? "checked" : ""}> Töne</label>
      <label class="switch"><input type="checkbox" id="spk" ${S.speak ? "checked" : ""}> Namen beim Entdecken vorlesen</label>
      <div class="row"><button class="btn" data-act="savesettings">Fertig</button></div>
      <button class="linkbtn" data-act="reset" id="rst">Alles zurücksetzen</button></div>`;
    document.body.appendChild(m);
  }

  /* ================= Klicks ================= */
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const act = b.dataset.act, v = b.dataset.v;
    const modal = () => document.querySelector(".modal") && document.querySelector(".modal").remove();
    switch (act) {
      case "topic": S.topic = v; save(); renderHome(); break;
      case "mode": startRound(v); break;
      case "discover": D = null; go("discover"); break;
      case "layer": D.layer = v; D.sel = null; renderDiscover(); break;
      case "badges": go("badges"); break;
      case "home": case "quit": go("home"); break;
      case "again": startRound(R.mode); break;
      case "say": say(v); break;
      case "settings": settingsModal(); break;
      case "savename": S.name = ($("#nm").value || "").trim(); S.askedName = true; save(); modal(); renderHome(); break;
      case "skipname": S.askedName = true; save(); modal(); break;
      case "savesettings": S.name = ($("#nm2").value || "").trim(); S.sound = $("#snd").checked; S.speak = $("#spk").checked; save(); modal(); renderHome(); break;
      case "reset":
        if (b.dataset.sure) { S = defaults(); S.askedName = true; save(); modal(); renderHome(); }
        else { b.dataset.sure = "1"; b.textContent = "Wirklich alles löschen? Noch einmal tippen."; b.classList.add("danger"); }
        break;
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

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
  window.__DE = { get S() { return S; }, ITEMS };
  render();
})();
