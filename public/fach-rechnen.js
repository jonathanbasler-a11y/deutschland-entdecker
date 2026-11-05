"use strict";
// Fach Kopfrechnen: Rechen-Turm, Tagestraining, Blitzrunde, Test-Training (Ansage oder Blatt).
// Meldet sich bei app.js an (siehe "Fächer" dort). Ansichten und Aktionen beginnen mit "m-".
(window.DE_FAECHER = window.DE_FAECHER || []).push(function (core) {
  const RL = window.DERechnen;
  const { $, esc, tone, confetti, toast, dayKey, save, go, TEST } = core;
  const app = core.app;

  /* ================= Speicher (S.math) ================= */
  const SET = () => ({
    roundLen: 10, targetSec: 5, gross: true, unlockAll: false,
    testMode: "ansage", testN: 20, testSec: 8, sheetMin: 5, testRead: true, listenOnly: false, testLevels: "auto", testDate: "",
  });
  const mdefaults = () => ({ xp: 0, lv: {}, facts: {}, days: {}, blitzBest: 0, bestCombo: 0, fast: 0, total: 0, tests: [], mission: { day: "", step: 0 }, missionsDone: 0, set: SET() });
  let merged = null;
  function M() {
    const S = core.S;
    if (!S.math || typeof S.math !== "object") S.math = mdefaults();
    if (merged !== S.math) {
      const d = mdefaults(), m = Object.assign(d, S.math);
      // Felder mit falschem Typ (kaputter Spielstand) auf den Standardwert zurücksetzen
      const kind = (v) => (Array.isArray(v) ? "array" : v === null ? "null" : typeof v);
      const base = mdefaults();
      for (const k of Object.keys(base)) if (kind(m[k]) !== kind(base[k])) m[k] = base[k];
      m.set = Object.assign(SET(), m.set);
      const sb = SET();
      for (const k of Object.keys(sb)) if (kind(m.set[k]) !== kind(sb[k])) m.set[k] = sb[k];
      S.math = m; merged = m;
    }
    return S.math;
  }
  const target = () => (+M().set.targetSec || 5) * 1000;
  const roundLen = () => ([5, 10, 15].includes(+M().set.roundLen) ? +M().set.roundLen : 10);

  /* ================= Stufen ================= */
  const enabledLevels = () => RL.LEVELS.filter((l) => !l.extra || M().set.gross).map((l) => l.id);
  const lvStat = (id) => M().lv[id] || (M().lv[id] = { recent: [], stars: 0, n: 0 });
  const starsOf = (id) => (M().lv[id] && M().lv[id].stars) || 0;
  function unlocked(id) {
    if (M().set.unlockAll) return true;
    const en = enabledLevels(), i = en.indexOf(id);
    return i === 0 || (i > 0 && starsOf(en[i - 1]) >= 1);
  }
  const openLevels = () => enabledLevels().filter(unlocked);
  function currentLevel() {
    const open = openLevels();
    return open.find((id) => starsOf(id) < 1) || open.find((id) => starsOf(id) < 3) || open[open.length - 1];
  }
  const starStr = (n) => "★".repeat(n) + "☆".repeat(3 - n);
  const LV = (id) => RL.LEVEL[id];

  const RANKS = [
    { xp: 0, name: "Rechen-Lehrling" }, { xp: 150, name: "Zahlenfuchs" }, { xp: 400, name: "Kopfrechner" },
    { xp: 800, name: "Rechenblitz" }, { xp: 1400, name: "Zahlen-Ass" }, { xp: 2200, name: "Mathe-Meister" },
  ];

  /* ================= Auswertung ================= */
  let MR = null; // laufende Runde
  // nur der erste Versuch zählt; ms = null, wenn die Zeit unbekannt ist
  function record(t, ok, ms) {
    const m = M(), now = dayKey();
    const f = m.facts[t.key] || (m.facts[t.key] = { n: 0, w: 0 });
    f.n++; if (!ok) f.w++;
    f.last = ok ? "o" : "x"; f.d = now;
    if (t.core) f.c = t.core;
    if (ok && ms != null) f.ms = f.ms ? Math.round(f.ms * 0.6 + ms * 0.4) : Math.round(ms);
    const L = lvStat(t.level);
    L.recent.push([ok ? 1 : 0, Math.round(ms == null ? target() : ms)]);
    if (L.recent.length > 20) L.recent.splice(0, L.recent.length - 20);
    L.n = (L.n || 0) + 1;
    const st = RL.levelStars(L.recent, target());
    if (st > (L.stars || 0)) {
      const wasOpen = openLevels();
      L.stars = st;
      const nowOpen = openLevels().filter((id) => !wasOpen.includes(id));
      if (MR) MR.gains.push({ level: t.level, stars: st, unlock: nowOpen[0] || null });
      if (MR && MR.mode !== "test" && MR.mode !== "sheet") {
        toast(nowOpen[0] ? `🔓 Stufe ${LV(nowOpen[0]).n} ist frei: ${LV(nowOpen[0]).name}!` : `⭐ Neuer Stern auf Stufe ${LV(t.level).n}!`);
        tone("win");
      }
    }
    m.days[now] = (m.days[now] || 0) + 1;
    m.total++;
  }

  /* ================= Tagestraining ================= */
  const ETAPPEN = [
    { name: "Aufwärmen", icon: "🔥", text: () => "Leichte Aufgaben zum Warmwerden." },
    { name: "Neue Stufe", icon: "🧗", text: () => `Stufe ${LV(currentLevel()).n}: ${LV(currentLevel()).name}.` },
    { name: "Tempo", icon: "⚡", text: () => "Gemischt. Schnell sein gibt Blitz-Bonus." },
  ];
  const mstep = () => (M().mission.day === dayKey() ? M().mission.step : 0);
  function missionPath(step) {
    return `<ol class="path">${ETAPPEN.map((m, i) => `<li class="${i < step ? "done" : i === step ? "now" : ""}"><span class="dot">${i < step ? "✓" : m.icon}</span><span>${m.name}</span></li>`).join("")}<li class="${step >= 3 ? "done" : ""}"><span class="dot">🏆</span><span>Geschafft</span></li></ol>`;
  }
  function missionLevels(step) {
    const cur = currentLevel();
    if (step === 1) return [cur];
    if (step === 2) return openLevels();
    const warm = openLevels().filter((id) => id !== cur && starsOf(id) >= 1);
    return warm.length ? warm : [cur];
  }

  /* ================= Startseite ================= */
  function daysUntil(s) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s || "")) return null;
    return Math.round((new Date(s + "T00:00:00") - new Date(dayKey() + "T00:00:00")) / 864e5);
  }
  function chips() {
    const d = daysUntil(M().set.testDate);
    const t = d > 0 ? `<div class="chip lzk"><small>Test in</small><b>${d} ${d === 1 ? "Tag" : "Tagen"}</b></div>` : d === 0 ? `<div class="chip lzk"><small>Heute</small><b>Test! 🍀</b></div>` : "";
    return `<div class="chips">${t}<div class="chip"><small>Serie</small><b>🔥 ${core.streak()}</b></div></div>`;
  }
  function weakFacts(n) {
    const en = enabledLevels();
    return Object.entries(M().facts)
      .filter(([k, f]) => f.last === "x" || f.w > 0)
      .map(([k, f]) => ({ t: RL.fromKey(k), f }))
      .filter((x) => x.t && en.includes(x.t.level))
      .sort((a, b) => RL.weight(b.f, target()) - RL.weight(a.f, target()) || b.f.w - a.f.w)
      .slice(0, n);
  }
  function home() {
    const m = M(), step = mstep(), cur = currentLevel(), en = enabledLevels();
    const rung = (id) => {
      const l = LV(id), open = unlocked(id), st = starsOf(id);
      const cls = !open ? "locked" : id === cur ? "cur" : st >= 3 ? "top" : "";
      return `<li><button class="rung ${cls}" data-act="m-level" data-v="${id}" ${open ? "" : "disabled"} aria-label="Stufe ${l.n}: ${esc(l.name)}">
        <span class="rn">${open ? l.n : "🔒"}</span><span class="rt"><b>${esc(l.name)}${l.extra ? ' <i class="tag">Zusatz</i>' : ""}</b><small>${esc(l.ex)}</small></span>
        <span class="rs" aria-label="${st} von 3 Sternen">${starStr(st)}</span>${id === cur ? '<span class="here">Du bist hier</span>' : ""}</button></li>`;
    };
    const btn = step < 3
      ? `<button class="mode big" data-act="m-mission"><span class="ico">${ETAPPEN[step].icon}</span><div><b>${step === 0 ? "Los geht's" : "Weiter"}: Etappe ${step + 1} von 3</b><br><span>${ETAPPEN[step].text()} ${roundLen()} Aufgaben, ca. 2 Minuten.</span></div></button>`
      : `<div class="done-msg"><b>Tagestraining geschafft! 🏆</b><span>Super! Du kannst für heute aufhören. Wenn du magst: Blitzrunde oder Turm.</span></div>`;
    const weak = weakFacts(4);
    const s = m.set;
    app.innerHTML = `${core.header({ title: "Kopfrechnen", ranks: RANKS, xp: m.xp, chips: chips() })}
      <div class="home mhome">
        <section class="card tower"><h2>Rechen-Turm</h2><ol class="ladder">${en.slice().reverse().map(rung).join("")}</ol>
          <p class="legend">Ein Stern auf einer Stufe öffnet die nächste. Tippe auf eine Stufe zum Üben.</p></section>
        <div class="right">
          <section class="card mission"><h2>Dein Tagestraining</h2>${missionPath(step)}${btn}</section>
          <div class="modes two">
            <button class="mode" data-act="m-blitz"><span class="ico">⚡</span><b>Blitzrunde</b><span>60 Sekunden, so viele wie möglich. Rekord: ${m.blitzBest}</span></button>
            <button class="mode" data-act="m-test"><span class="ico">📝</span><b>Test-Training</b><span>Wie in der Schule: ${s.testN} Aufgaben auf Zeit.</span></button>
          </div>
          ${weak.length ? `<section class="card"><h2>Das üben wir noch</h2><div class="weak">${weak.map((x) => `<span class="pill">${esc(RL.show(x.t))}</span>`).join("")}</div></section>` : ""}
        </div>
      </div>`;
  }

  /* ================= Runden starten ================= */
  function newRound(mode, tasks, extra) {
    MR = Object.assign({ tok: Math.random(), mode, q: tasks.map((t) => ({ t })), i: 0, results: [], xp: 0, hits: 0, combo: 0, gains: [], t0: Date.now() }, extra || {});
    go(mode === "sheet" ? "m-sheet" : "m-game");
  }
  const facts = () => M().facts;
  function startPractice(level) {
    if (!unlocked(level)) return;
    newRound("practice", RL.buildRound([level], roundLen(), facts(), { targetMs: target() }), { level, label: `Stufe ${LV(level).n} · ${LV(level).name}` });
  }
  function startMission() {
    const step = mstep();
    if (step >= 3) return go("home");
    const lv = missionLevels(step);
    const label = `Etappe ${step + 1} · ${ETAPPEN[step].name}` + (step === 1 ? ` · Stufe ${LV(lv[0]).n}` : "");
    newRound("mission", RL.buildRound(lv, roundLen(), facts(), { targetMs: target() }), { mstep: step, label });
  }
  function startBlitz() {
    newRound("blitz", RL.buildRound(openLevels(), 30, facts(), { targetMs: target() }), { label: "Blitzrunde" });
    core.race.setup(MR, M().blitzTrace, TEST.blitzMs || 60000);
    blitzTimer();
  }
  function testLevels() {
    const t = M().set.testLevels, en = enabledLevels();
    if (t === "all8") return en;
    if (t === "all7") return en.filter((id) => !LV(id).extra);
    const open = openLevels().filter((id) => !LV(id).extra);
    return open.length ? open : [en[0]];
  }
  function startTest(kind) {
    const s = M().set, n = [10, 20, 30, 40].includes(+s.testN) ? +s.testN : 20;
    const tasks = RL.buildRound(testLevels(), n, facts(), { flat: true });
    if (kind === "sheet") {
      const ms = TEST.sheetMs || (+s.sheetMin || 5) * 60000;
      newRound("sheet", tasks, { label: "Test-Training · Blatt", answers: tasks.map(() => ""), sel: 0, end: Date.now() + ms, limit: ms });
      return sheetTimer();
    }
    newRound("test", tasks, { label: "Test-Training" });
  }
  function startList(tasks, label) {
    if (!tasks.length) return;
    newRound("practice", core.shuffle(tasks), { label });
  }
  function testIntro() {
    core.closeModal();
    const s = M().set, n = s.testN, sec = +s.testSec;
    const m = document.createElement("div");
    m.className = "modal";
    m.innerHTML = `<div class="card"><h2 style="color:var(--text)">Test-Training 📝</h2>
      <p class="muted">Wie im echten Test: ${n} Aufgaben. Es gibt erst am Ende eine Auswertung. Atme einmal tief durch, dann los!</p>
      <div class="choose">
        <button class="mode ${s.testMode === "ansage" ? "pick" : ""}" data-act="m-teststart" data-v="ansage"><b>🔊 Einzeln</b><span>${s.testRead ? "Jede Aufgabe wird vorgelesen. " : ""}${sec ? sec + " Sekunden pro Aufgabe." : "Ohne Zeitlimit."}</span></button>
        <button class="mode ${s.testMode === "sheet" ? "pick" : ""}" data-act="m-teststart" data-v="sheet"><b>📄 Blatt</b><span>Alle Aufgaben auf einem Blatt, ${s.sheetMin} Minuten.</span></button>
      </div>
      <button class="btn ghost" data-act="closemodal">Abbrechen</button></div>`;
    document.body.appendChild(m);
  }

  /* ================= Spielbildschirm ================= */
  const numpad = () => `<div class="numpad" role="group" aria-label="Ziffern">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button class="key" data-act="m-key" data-v="${d}">${d}</button>`).join("")}<button class="key del" data-act="m-key" data-v="del" aria-label="Löschen">⌫</button><button class="key" data-act="m-key" data-v="0">0</button><button class="key ok" data-act="m-key" data-v="ok" id="kok" aria-label="Fertig">✓</button></div>`;
  function drawGame() {
    const r = MR;
    if (!r) return go("home");
    const timed = r.mode === "blitz";
    app.innerHTML = `<div class="game mgame">
      <div class="gbar"><button class="icon-btn" data-act="m-quit" aria-label="Beenden">✕</button>
        ${timed ? core.race.html() : `<div class="progress"><i id="pg"></i></div><div class="bossbar" id="bossbar" hidden></div>${core.gdog()}`}
        <span class="count" id="cnt"></span><span class="combo" id="combo"></span><span class="xp" id="xpv"></span></div>
      <div class="mstage">
        <div class="mcard" id="mcard">
          <small class="mlabel">${esc(r.label || "")}</small>
          <div class="mtask" id="mtask"></div>
          <div class="tbar" id="tbar" hidden><i id="tbi"></i></div>
          <div class="mtools" id="mtools"></div>
          <div id="fb" class="mfb" aria-live="polite"></div>
        </div>
        ${numpad()}
      </div></div>`;
    showTask();
  }
  const praise = ["Richtig!", "Super!", "Genau!", "Stark!", "Klasse!"];
  const pr = () => praise[Math.floor(Math.random() * praise.length)];
  const later = (fn, ms) => { const r = MR, tok = r.tok; setTimeout(() => { if (MR === r && r.tok === tok && !r.done && core.view === "m-game") fn(); }, ms); };
  const fb = (cls, html) => { const f = $("#fb"); if (f) f.innerHTML = html ? `<div class="feedback ${cls}">${html}</div>` : ""; };
  const listenOnly = () => MR.mode === "test" && M().set.listenOnly && M().set.testRead && "speechSynthesis" in window;

  function updateBar() {
    const r = MR;
    const pg = $("#pg"); if (pg) pg.style.width = (r.i / r.q.length) * 100 + "%";
    const c = $("#cnt"); if (c) c.textContent = r.mode === "blitz" ? "✔ " + r.hits : Math.min(r.i + 1, r.q.length) + " / " + r.q.length;
    if (r.boss) core.bossUI.draw(r);
    const x = $("#xpv"); if (x) x.textContent = r.mode === "test" ? "" : "+" + r.xp;
    const cb = $("#combo");
    if (cb) { cb.textContent = r.combo >= 2 && r.mode !== "test" ? "🔥 " + r.combo : ""; cb.classList.toggle("hot", r.combo >= 5); }
  }
  function drawInput() {
    const r = MR, el = $("#mans");
    if (!el) return;
    el.textContent = r.input || "";
    el.classList.toggle("empty", !r.input);
  }
  // Boss am Ende einer Etappe: zuerst die Fehler dieser Etappe, sonst Aufgaben aus den Stufen der Etappe
  function startBoss() {
    const r = MR, step = Math.min(2, r.mstep), max = window.DEBegleiter.bossHp(step);
    const seen = new Set();
    let tasks = r.results.filter((x) => !x.ok && !seen.has(x.t.key) && seen.add(x.t.key)).map((x) => x.t).slice(0, max);
    if (tasks.length < max) tasks = tasks.concat(RL.buildRound(missionLevels(step), max * 3, facts(), { targetMs: target() }).filter((t) => !seen.has(t.key)).slice(0, max - tasks.length));
    core.bossUI.start(r, step);
    r.q.push(...tasks.map((t) => ({ t, boss: true })));
    const lab = $(".mlabel"); if (lab) lab.textContent = "⚔️ Boss: " + r.boss.def.name;
    $("#mcard").classList.add("bossfight");
    showTask();
  }
  function showTask() {
    const r = MR;
    if (r.mode === "blitz" && r.i >= r.q.length - 2) r.q.push(...RL.buildRound(openLevels(), 30, facts(), { targetMs: target() }).map((t) => ({ t })));
    if (r.i >= r.q.length) {
      if (r.mode === "mission" && core.bossOn() && !r.boss) return startBoss();
      return finish();
    }
    const it = r.q[r.i], t = it.t;
    r.cur = t; r.input = ""; r.attempt = 0; r.lock = false; r.wait = false; r.shown = Date.now();
    const hide = listenOnly();
    $("#mtask").innerHTML = hide
      ? `<span class="mq listen">🔊 Hör gut zu!</span><span class="eq">=</span><span class="mans empty" id="mans"></span>`
      : `<span class="mq">${esc(RL.show(t))}</span><span class="eq">=</span><span class="mans empty" id="mans"></span>`;
    const card = $("#mcard"); card.classList.remove("good", "badc");
    $("#kok").textContent = "✓";
    const tools = [];
    if (r.mode === "practice" || r.mode === "mission") tools.push(`<button class="speak" data-act="m-tip">💡 Tipp</button>`);
    if ((r.mode !== "blitz" && core.S.autoRead) || r.mode === "test") tools.push(`<button class="speak" data-act="m-say" aria-label="Vorlesen">🔊</button>`);
    $("#mtools").innerHTML = tools.join("");
    if (it.repeat) fb("hint", "Die kennst du schon von eben. Jetzt klappt's!");
    else if (it.boss && r.bossTries && r.bossTries[t.key]) fb("hint", "Die hat der Boss eben geblockt. Jetzt triffst du!");
    else fb();
    updateBar();
    $("#tbar").hidden = true;
    if (r.mode === "test") return testTaskStart();
    if (core.S.autoRead && r.mode !== "blitz") core.say(RL.speech(t));
  }

  /* ---------- Eingabe ---------- */
  function key(v) {
    const r = MR;
    if (!r || r.done) return;
    if (core.view === "m-sheet") return sheetKey(v);
    if (core.view !== "m-game") return;
    if (r.lock) { if (r.wait && v === "ok") next(); return; }
    if (v === "del") r.input = (r.input || "").slice(0, -1);
    else if (v === "ok") return submit();
    else if ((r.input || "").length < 5) r.input = (r.input || "") + v;
    const a = $("#mans"); if (a) a.classList.remove("bad");
    drawInput();
  }
  function submit() {
    const r = MR, t = r.cur;
    if (!r.input) return;
    const ok = RL.parseNum(r.input) === t.ans, ms = Date.now() - r.shown;
    if (r.mode === "test") return testAnswer(ok, ms, r.input);
    if (ok) right(ms); else wrong(ms);
  }
  const next = () => { if (!MR) return; MR.i++; showTask(); };

  function right(ms) {
    const r = MR, t = r.cur, m = M(), it = r.q[r.i], first = r.attempt === 0;
    r.lock = true;
    if (first && !it.repeat && !it.boss) record(t, true, ms);
    const fast = first && ms <= target();
    let gain = r.mode === "blitz" ? 5 : first ? 10 : 5;
    if (first) {
      r.combo++;
      if (r.combo > m.bestCombo) m.bestCombo = r.combo;
      if (r.combo >= 3) gain += Math.min(5, r.combo - 2);
    }
    if (fast && r.mode !== "blitz") { gain += 2; m.fast++; }
    let won = false;
    if (it.boss) { won = core.bossUI.hit(r); if (won) { gain += 20; r.q.length = r.i + 1; } }
    m.xp += gain; r.xp += gain;
    if (!it.boss) r.hits++;
    if (r.mode === "blitz") core.race.hit(r);
    if (!it.repeat && !it.boss) r.results.push({ t, ok: first });
    $("#mans").classList.add("ok"); $("#mcard").classList.add("good");
    const praiseText = it.boss ? (won ? "Boss besiegt! 🏆" : "Treffer! 💥") : pr();
    fb("ok", `${praiseText}${fast && r.mode !== "blitz" ? " ⚡ Blitzschnell!" : ""}${r.combo >= 3 ? `<small>🔥 ${r.combo} richtig hintereinander</small>` : ""}`);
    tone("ok", r.combo);
    if (!it.boss) core.petReact(r.combo && r.combo % 5 === 0 ? "flip" : "hop");
    core.fx.plus($("#mans"), $("#xpv"), "+" + gain);
    core.fx.burstAt($("#mans"), 10);
    if (r.combo > 0 && r.combo % 5 === 0) confetti(r.combo >= 10 ? 70 : 40);
    save(); updateBar(); core.checkBadges();
    later(next, r.mode === "blitz" ? 350 : won ? 1300 : 850);
  }
  function shake() {
    if (core.S.calm) return;
    const c = $("#mcard"); c.classList.remove("shake"); void c.offsetWidth; c.classList.add("shake");
  }
  function wrong(ms) {
    const r = MR, t = r.cur, it = r.q[r.i], h = RL.help(t);
    r.attempt++;
    shake();
    $("#mans").classList.add("bad");
    if (r.attempt === 1) { r.combo = 0; if (!it.repeat && !it.boss) record(t, false, ms); }
    if (it.boss) core.bossUI.block(r); else core.petReact("tilt");
    if (r.mode === "blitz") {
      r.lock = true;
      r.results.push({ t, ok: false });
      $("#mans").textContent = t.ans; $("#mans").classList.add("sol");
      fb("bad", `Richtig ist ${t.ans}.`);
      tone("bad"); save(); updateBar();
      return later(next, 1100);
    }
    if (r.attempt === 1) {
      tone("bad"); save(); updateBar();
      fb("hint", `${it.boss ? "Der Boss blockt!" : "Nicht ganz."} ${esc(h.tip)}`);
      // die falsche Zahl kurz rot stehen lassen; wer schon weitertippt, verliert nichts
      const tok = r.tok, i = r.i;
      r.input = "";
      setTimeout(() => { if (MR === r && r.tok === tok && r.i === i && !r.lock && !r.input) { const a = $("#mans"); if (a) a.classList.remove("bad"); drawInput(); } }, 600);
      return;
    }
    // zweiter Fehler: Lösung zeigen, Aufgabe kommt später noch einmal (beim Boss: hinten an, er gewinnt nie)
    r.lock = true; r.wait = true;
    if (it.boss) {
      r.q.push({ t, boss: true });
      (r.bossTries = r.bossTries || {})[t.key] = 1;
    } else if (!it.repeat) {
      r.results.push({ t, ok: false });
      r.q.splice(Math.min(r.i + 4, r.q.length), 0, { t, repeat: true });
    }
    const a = $("#mans"); a.textContent = t.ans; a.classList.remove("bad"); a.classList.add("sol");
    $("#mcard").classList.add("badc");
    $("#mtools").innerHTML = "";
    fb("bad", `So geht's: ${esc(h.explain)}${it.repeat ? "" : `<small>${it.boss ? "Der Boss blockt. Die Aufgabe kommt gleich noch einmal." : "Die Aufgabe kommt gleich noch einmal."}</small>`}`);
    $("#kok").textContent = "Weiter";
    tone("bad"); save(); updateBar();
  }

  /* ---------- Blitzrunde ---------- */
  function blitzTimer() {
    const r = MR, tok = r.tok, ms = TEST.blitzMs || 60000, end = Date.now() + ms;
    const tick = () => {
      if (MR !== r || r.tok !== tok || r.done) return;
      const left = end - Date.now();
      const bar = $("#tm"); if (bar) bar.style.width = Math.max(0, (left / ms) * 100) + "%";
      core.race.update(r);
      if (left <= 0) { r.lock = true; return finish(); }
      setTimeout(tick, 100);
    };
    tick();
  }

  /* ---------- Test: Ansage ---------- */
  function testTaskStart() {
    const r = MR, t = r.cur, s = M().set, tok = r.tok, idx = r.i;
    const lim = TEST.testSecMs || (+s.testSec || 0) * 1000;
    let started = false;
    const start = () => {
      if (started || MR !== r || r.tok !== tok || r.i !== idx || r.done) return;
      started = true;
      r.shown = Date.now();
      if (!lim) return;
      const end = r.shown + lim, bar = $("#tbar");
      bar.hidden = false;
      const tick = () => {
        if (MR !== r || r.tok !== tok || r.i !== idx || r.done || r.lock) return;
        const left = end - Date.now();
        const i = $("#tbi"); if (i) i.style.width = Math.max(0, (left / lim) * 100) + "%";
        if (left <= 0) return testAnswer(false, lim, "");
        setTimeout(tick, 100);
      };
      tick();
    };
    if (s.testRead) {
      core.say(RL.speech(t), start);
      setTimeout(start, TEST.speakWaitMs || 4000); // falls das iPad nicht meldet, dass es fertig ist
    } else start();
  }
  function testAnswer(ok, ms, given) {
    const r = MR, t = r.cur;
    if (r.lock) return;
    r.lock = true;
    record(t, ok, ms);
    r.results.push({ t, ok, given });
    if (ok) { r.hits++; r.xp += 5; M().xp += 5; }
    fb("hint", given ? "Notiert ✓" : "Zeit um, weiter geht's.");
    save(); updateBar();
    later(next, given ? 300 : 700);
  }

  /* ---------- Test: Blatt ---------- */
  function drawSheet() {
    const r = MR;
    if (!r) return go("home");
    app.innerHTML = `<div class="game mgame">
      <div class="gbar"><button class="icon-btn" data-act="m-quit" aria-label="Beenden">✕</button>
        <div class="timer" style="flex:1"><i id="tm"></i></div><span class="count" id="clock"></span>
        <button class="btn hand" data-act="m-hand">Abgeben</button></div>
      <div class="msheet"><div class="sgrid" id="sgrid">${r.q.map((it, i) => `<button class="scell" data-act="m-cell" data-v="${i}" id="sc${i}"><span class="sn">${i + 1}</span><span class="sq">${esc(RL.show(it.t))} =</span><span class="sa" id="sa${i}"></span></button>`).join("")}</div>
        <div class="spad">${numpad()}</div></div></div>`;
    sheetSel(r.sel || 0);
  }
  function sheetSel(i) {
    const r = MR;
    r.sel = i;
    document.querySelectorAll(".scell").forEach((c, k) => c.classList.toggle("sel", k === i));
    const c = $("#sc" + i);
    if (c && c.scrollIntoView) { try { c.scrollIntoView({ block: "nearest" }); } catch (e) { /* */ } }
  }
  function sheetKey(v) {
    const r = MR, i = r.sel;
    if (r.lock) return;
    if (v === "del") r.answers[i] = r.answers[i].slice(0, -1);
    else if (v === "ok") {
      const n = r.q.length;
      for (let k = 1; k <= n; k++) { const j = (i + k) % n; if (!r.answers[j]) return sheetSel(j); }
      return toast("Alles ausgefüllt. Tippe auf „Abgeben“.");
    } else if (r.answers[i].length < 5) r.answers[i] += v;
    const a = $("#sa" + i); if (a) a.textContent = r.answers[i];
    $("#sc" + i).classList.toggle("filled", !!r.answers[i]);
  }
  function sheetTimer() {
    const r = MR, tok = r.tok;
    const tick = () => {
      if (MR !== r || r.tok !== tok || r.done) return;
      const left = Math.max(0, r.end - Date.now());
      const bar = $("#tm"); if (bar) bar.style.width = (left / r.limit) * 100 + "%";
      const c = $("#clock"); if (c) { const s = Math.ceil(left / 1000); c.textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
      if (left <= 0) return handIn();
      setTimeout(tick, 250);
    };
    tick();
  }
  function handIn() {
    const r = MR;
    if (r.done || r.lock) return;
    r.lock = true;
    const filled = r.answers.filter((a) => a).length || 1;
    const per = Math.min(r.limit, Date.now() - r.t0) / filled;
    r.q.forEach((it, i) => {
      const given = r.answers[i], ok = RL.parseNum(given) === it.t.ans;
      record(it.t, ok, given ? per : r.limit);
      r.results.push({ t: it.t, ok, given });
      if (ok) { r.hits++; r.xp += 5; M().xp += 5; }
    });
    finish();
  }

  /* ================= Ende der Runde ================= */
  function finish() {
    const r = MR;
    if (!r || r.done) return;
    r.done = true; r.tok = -1;
    const m = M(), ok = r.results.filter((x) => x.ok).length, n = r.results.length;
    r.ok = ok; r.n = n; r.pct = n ? Math.round((ok / n) * 100) : 0;
    core.addTime(r);
    if (r.mode === "blitz" && r.hits > m.blitzBest) { r.record = true; m.blitzBest = r.hits; m.blitzTrace = (r.trace || []).slice(); }
    if (r.mode === "mission") {
      const step = Math.min(3, r.mstep + 1);
      m.mission = { day: dayKey(), step };
      if (step === 3) m.missionsDone = (m.missionsDone || 0) + 1;
      r.newStep = step;
    }
    if (r.mode === "test" || r.mode === "sheet") {
      r.grade = core.gradeFor(r.pct);
      r.secs = Math.round((Date.now() - r.t0) / 1000);
      if (r.pct === 100 && n >= 10) { r.xp += 20; m.xp += 20; }
      m.tests.push({ date: dayKey(), mode: r.mode === "sheet" ? "Blatt" : "Einzeln", n, ok, pct: r.pct, grade: r.grade, secs: r.secs });
      if (m.tests.length > 50) m.tests.splice(0, m.tests.length - 50);
    }
    // Blöcke für die Bauprojekte des Hundes
    const blocks = r.mode === "mission" ? 3 : r.mode === "test" || r.mode === "sheet" || r.record ? 2 : r.mode === "blitz" ? 0 : n ? 1 : 0;
    r.loot = blocks ? core.giveBlocks(blocks) : null;
    save();
    core.checkBadges();
    go("m-results");
    if (r.pct >= 80 || r.record || r.newStep === 3) { confetti(120); tone("win"); }
  }

  const line = (x) => `<li>${esc(RL.show(x.t))} = <b>${x.t.ans}</b>${x.given != null && !x.ok ? ` <span class="muted">(${x.given ? "du: " + esc(x.given) : "keine Antwort"})</span>` : ""}</li>`;
  function renderResults() {
    const r = MR;
    if (!r) return go("home");
    const uniq = (list) => { const s = new Set(); return list.filter((x) => (s.has(x.t.key) ? false : s.add(x.t.key))); };
    const good = uniq(r.results.filter((x) => x.ok)), todo = uniq(r.results.filter((x) => !x.ok));
    let head, big = `${r.ok} / ${r.n}`, sub = `+${r.xp} Punkte`, extra = "", buttons;
    const home = `<button class="btn ghost" data-act="home">Zur Startseite</button>`;
    const wrongBtn = todo.length ? `<button class="btn" data-act="m-wrong">Nur die Fehler üben (${todo.length})</button>` : "";
    buttons = `<button class="btn ${todo.length ? "ghost" : ""}" data-act="m-again">Noch einmal</button>` + home;
    if (r.mode === "practice") {
      head = r.pct === 100 ? "Alles richtig! 🎉" : r.pct >= 80 ? "Stark gemacht!" : r.pct >= 50 ? "Gut gemacht!" : "Weiter üben, du schaffst das!";
      buttons = wrongBtn + buttons;
    } else if (r.mode === "mission") {
      const step = r.newStep;
      head = step >= 3 ? "Tagestraining geschafft! 🏆" : `Etappe ${step} geschafft!`;
      sub = step >= 3 ? `+${r.xp} Punkte. Super gemacht! Für heute kannst du aufhören.` : `+${r.xp} Punkte. Noch ${3 - step} ${3 - step === 1 ? "Etappe" : "Etappen"}.`;
      extra = `<div class="mission">${missionPath(step)}</div>`;
      buttons = step >= 3
        ? `<button class="btn" data-act="home">Fertig für heute</button>`
        : `<button class="btn" data-act="m-mission">Weiter zu Etappe ${step + 1}</button><button class="btn ghost" data-act="m-pause">Erst Bewegungspause (20 s)</button><button class="btn ghost" data-act="home">Für heute aufhören</button>`;
    } else if (r.mode === "blitz") {
      head = r.record ? "Neuer Rekord! ⚡" : "Zeit um!";
      big = r.hits + " richtig";
      sub = `${r.n - r.ok} daneben. Dein Rekord: ${M().blitzBest}. +${r.xp} Punkte`;
    } else {
      head = r.pct === 100 ? "Fehlerfrei! 🏆" : "Test-Training geschafft!";
      big = `${r.ok} von ${r.n}`;
      const mm = Math.floor(r.secs / 60), ss = r.secs % 60;
      sub = `Note ${r.grade} (nur zur Orientierung) · ${mm ? mm + " min " : ""}${ss} s`;
      buttons = wrongBtn + `<button class="btn ${todo.length ? "ghost" : ""}" data-act="m-again">Test nochmal</button>` + home;
      if (r.mode === "sheet") extra = `<div class="sgrid done">${r.results.map((x, i) => `<div class="scell ${x.ok ? "ok" : "bad"}"><span class="sn">${i + 1}</span><span class="sq">${esc(RL.show(x.t))} =</span><span class="sa">${x.ok ? esc(x.given) : `<s>${esc(x.given || "–")}</s> ${x.t.ans}`}</span></div>`).join("")}</div>`;
    }
    const gains = r.gains.map((g) => g.unlock ? `🔓 Stufe ${LV(g.unlock).n} ist frei: <b>${esc(LV(g.unlock).name)}</b>` : `⭐ Stufe ${LV(g.level).n}: jetzt ${starStr(g.stars)}`)
      .concat([core.bossUI.line(r.boss), r.loot ? r.loot.text : ""].filter(Boolean));
    let hint = "";
    if (r.mode !== "mission" && core.pauseHint()) hint = `<div class="card pausehint"><b>Du übst schon eine Weile, super!</b><span>Zeit für eine kurze Pause?</span><button class="btn ghost" data-act="m-pausehome">Bewegungspause (20 s)</button></div>`;
    const lists = r.mode === "sheet" ? "" : `<div class="listcols"><div class="card"><h2>Das kannst du schon</h2><ul>${good.slice(0, 12).map(line).join("") || "<li class='muted'>noch nichts</li>"}</ul></div>
      <div class="card"><h2>Das üben wir noch</h2><ul>${todo.slice(0, 12).map(line).join("") || "<li class='muted'>alles richtig 🎉</li>"}</ul></div></div>`;
    app.innerHTML = `<div class="results mresults"><div class="card hero"><h1>${head}</h1><div class="score">${big}</div><p class="muted">${sub}</p>
      ${gains.length ? `<div class="gains">${gains.map((g) => `<div>${g}</div>`).join("")}</div>` : ""}${extra}</div>
      ${hint}${lists}<div class="row">${buttons}</div></div>`;
  }

  /* ================= Abzeichen ================= */
  const s3 = (...ids) => ids.every((id) => starsOf(id) >= 3), s2 = (...ids) => ids.every((id) => starsOf(id) >= 2);
  const badges = [
    { id: "m_start", icon: "🧮", name: "Erste Rechnungen", desc: "10 Rechenaufgaben gelöst", ok: () => M().total >= 10 },
    { id: "m_combo", icon: "🔥", name: "Heiße Serie", desc: "10 richtig hintereinander", ok: () => M().bestCombo >= 10 },
    { id: "m_mission1", icon: "🎯", name: "Training geschafft", desc: "Das erste Tagestraining", ok: () => M().missionsDone >= 1 },
    { id: "m_mission3", icon: "🏅", name: "Rechen-Dranbleiber", desc: "3 Tagestrainings geschafft", ok: () => M().missionsDone >= 3 },
    { id: "m_1x1", icon: "✖️", name: "1×1-Profi", desc: "Kleines 1×1 mal und geteilt mit 3 Sternen", ok: () => s3("k-mal", "k-geteilt") },
    { id: "m_zehner", icon: "🔟", name: "Zehner-Held", desc: "Beide Zehner-Stufen mit 2 Sternen", ok: () => s2("z-mal", "z-geteilt") },
    { id: "m_hundert", icon: "💯", name: "Hunderter-Held", desc: "Hunderter und Zehner·Zehner mit 2 Sternen", ok: () => s2("h", "zz") },
    { id: "m_top", icon: "🏰", name: "Turmspitze", desc: "Einen Stern auf der 11er-bis-19er-Stufe", ok: () => starsOf("gross") >= 1 },
    { id: "m_fast", icon: "🚀", name: "Schnelldenker", desc: "25-mal Blitz-Bonus", ok: () => M().fast >= 25 },
    { id: "m_blitz", icon: "⚡", name: "Rechenblitz", desc: "20 richtig in einer Blitzrunde", ok: () => M().blitzBest >= 20 },
    { id: "m_test", icon: "🏆", name: "Test fehlerfrei", desc: "Test-Training ohne Fehler (ab 10 Aufgaben)", ok: () => M().tests.some((t) => t.pct === 100 && t.n >= 10) },
  ];

  /* ================= Eltern-Übersicht ================= */
  function parents() {
    const m = M(), s = m.set, tg = target();
    const fmtS = (ms) => (ms && isFinite(ms) ? (ms / 1000).toFixed(1).replace(".", ",") + " s" : "–");
    const rows = RL.LEVELS.map((l) => {
      const st = m.lv[l.id], rec = (st && st.recent) || [];
      const okN = rec.filter((x) => x[0]).length;
      const med = RL.median(rec.filter((x) => x[0]).map((x) => x[1]));
      return `<tr><td>${LV(l.id).n}. ${esc(l.name)}${l.extra && !s.gross ? " <span class='muted'>(aus)</span>" : ""}</td><td>${starStr(starsOf(l.id))}${unlocked(l.id) ? "" : " 🔒"}</td><td>${rec.length ? Math.round((okN / rec.length) * 100) + " %" : "–"}</td><td>${fmtS(med)}</td><td>${(st && st.n) || 0}</td></tr>`;
    }).join("");
    // 1×1-Tabelle: alle Aufgaben, die auf derselben 1×1-Aufgabe beruhen, zusammen
    const agg = {};
    for (const f of Object.values(m.facts)) {
      if (!f.c) continue;
      const a = agg[f.c] || (agg[f.c] = { n: 0, w: 0, x: false, ms: [] });
      a.n += f.n; a.w += f.w; if (f.last === "x") a.x = true; if (f.ms) a.ms.push(f.ms);
    }
    const N = [2, 3, 4, 5, 6, 7, 8, 9, 10];
    const cell = (x, y) => {
      const a = agg[Math.min(x, y) + "x" + Math.max(x, y)];
      let cls = "na", tip = "noch nicht geübt";
      if (a && a.n) {
        const avg = a.ms.length ? a.ms.reduce((p, q) => p + q, 0) / a.ms.length : 0;
        if (a.x || a.w / a.n >= 0.25) { cls = "bad"; tip = `${a.w} Fehler bei ${a.n} Aufgaben`; }
        else if (avg > tg) { cls = "slow"; tip = `richtig, aber langsam (${fmtS(avg)})`; }
        else { cls = "good"; tip = `sicher (${a.n}×)`; }
      }
      return `<td class="${cls}" title="${x} · ${y}: ${tip}">${x * y}</td>`;
    };
    const grid = `<table class="x1"><thead><tr><th>·</th>${N.map((x) => `<th>${x}</th>`).join("")}</tr></thead><tbody>${N.map((y) => `<tr><th>${y}</th>${N.map((x) => cell(x, y)).join("")}</tr>`).join("")}</tbody></table>`;
    const weak = weakFacts(10);
    const sel = (id, opts, val, fmt) => `<select id="${id}">${opts.map((o) => `<option value="${o}" ${String(val) === String(o) ? "selected" : ""}>${fmt ? fmt(o) : o}</option>`).join("")}</select>`;
    const chk = (id, on) => `<input type="checkbox" id="${id}" ${on ? "checked" : ""}>`;
    return `
      <section class="card"><h2>Rechen-Turm</h2><table class="tbl"><thead><tr><th>Stufe</th><th>Sterne</th><th>Richtig (letzte 20)</th><th>Tempo (Median)</th><th>Aufgaben</th></tr></thead><tbody>${rows}</tbody></table>
        <p class="muted" style="margin-top:8px">★ 8 von 10 richtig · ★★ 80 % der letzten 20 · ★★★ 90 % und im Mittel höchstens ${s.targetSec} Sekunden. Sterne bleiben, auch wenn es mal schlechter läuft.</p></section>
      <section class="card"><h2>Einmaleins-Tabelle</h2><p class="muted" style="margin-bottom:10px">Jede Aufgabe mit Zehnern oder Hundertern zählt bei ihrer 1×1-Aufgabe mit (640 : 80 bei 8 · 8). So sieht man, welche Grundaufgabe wirklich hakt.</p>
        <div class="x1wrap">${grid}</div>
        <div class="legend"><span><i class="lg good"></i>sicher</span><span><i class="lg slow"></i>richtig, aber langsam</span><span><i class="lg bad"></i>Fehler</span><span><i class="lg na"></i>noch nicht geübt</span></div></section>
      <section class="card"><h2>Wackelt noch</h2>${weak.length ? `<table class="tbl"><thead><tr><th>Aufgabe</th><th>Ergebnis</th><th>Fehler</th><th>Tempo</th></tr></thead><tbody>${weak.map((x) => `<tr><td>${esc(RL.show(x.t))}</td><td>${x.t.ans}</td><td>${x.f.w}</td><td>${fmtS(x.f.ms)}</td></tr>`).join("")}</tbody></table>` : `<p class="muted">Bisher wackelt nichts.</p>`}
        <p class="muted" style="margin-top:8px">Insgesamt ${m.total} Rechenaufgaben, ${m.missionsDone} Tagestrainings, Blitz-Rekord ${m.blitzBest}.</p></section>
      <section class="card"><h2>Test-Training</h2>${m.tests.length ? `<table class="tbl"><thead><tr><th>Datum</th><th>Art</th><th>Richtig</th><th>Zeit</th><th>Note (Orientierung)</th></tr></thead><tbody>${m.tests.slice(-8).reverse().map((t) => `<tr><td>${t.date.split("-").reverse().join(".")}</td><td>${t.mode}</td><td>${t.ok}/${t.n} (${t.pct} %)</td><td>${Math.floor(t.secs / 60)}:${String(t.secs % 60).padStart(2, "0")}</td><td>${t.grade}</td></tr>`).join("")}</tbody></table>` : `<p class="muted">Noch kein Test-Training gemacht.</p>`}</section>
      <section class="card"><h2>Einstellungen Kopfrechnen</h2>
        <div class="setgrid">
          <label for="m-rl">Aufgaben pro Übungsrunde</label>${sel("m-rl", [5, 10, 15], roundLen())}
          <label for="m-tg">Zielzeit pro Aufgabe (Blitz-Bonus, 3. Stern)</label>${sel("m-tg", [3, 4, 5, 6, 8], s.targetSec, (o) => o + " s")}
          <label for="m-gross">Zusatzstufe 11er bis 19er (Ergebnisse bis 999)</label>${chk("m-gross", s.gross)}
          <label for="m-ua">Alle Stufen freischalten</label>${chk("m-ua", s.unlockAll)}
          <label for="m-tm">Test: Art</label>${sel("m-tm", ["ansage", "sheet"], s.testMode, (o) => (o === "ansage" ? "Einzeln (Ansage)" : "Blatt"))}
          <label for="m-tn">Test: Anzahl Aufgaben</label>${sel("m-tn", [10, 20, 30, 40], s.testN)}
          <label for="m-ts">Einzeln: Sekunden pro Aufgabe</label>${sel("m-ts", [5, 8, 10, 15, 0], s.testSec, (o) => (+o ? o + " s" : "ohne Zeit"))}
          <label for="m-tr">Einzeln: Aufgaben vorlesen</label>${chk("m-tr", s.testRead)}
          <label for="m-lo">Einzeln: nur hören, nicht anzeigen (wie Diktat)</label>${chk("m-lo", s.listenOnly)}
          <label for="m-sm">Blatt: Zeit</label>${sel("m-sm", [2, 3, 5, 8, 10], s.sheetMin, (o) => o + " Minuten")}
          <label for="m-tl">Test: welche Stufen</label>${sel("m-tl", ["auto", "all7", "all8"], s.testLevels, (o) => ({ auto: "freigeschaltete (ohne 11er–19er)", all7: "Stufe 1 bis 7", all8: "alle mit 11er–19er" })[o])}
          <label for="m-td">Datum des Kopfrechentests</label><input type="date" id="m-td" value="${esc(s.testDate || "")}">
          <label for="m-calm">Ruhiger Modus (kein Konfetti, leisere Töne)</label>${chk("m-calm", core.S.calm)}
          <label for="m-ar">Aufgaben beim Üben vorlesen</label>${chk("m-ar", core.S.autoRead)}
          <label for="m-boss">Boss-Kampf am Ende jeder Etappe (gilt für alle Fächer)</label>${chk("m-boss", core.bossOn())}
        </div>
        <p class="tip">Tipp: Erst üben ohne Zeitdruck (Turm, Tagestraining), dann das Test-Training. Wenn du weißt, wie der Test in der Klasse abläuft (vorgelesen oder Blatt, wie viele Aufgaben, wie viel Zeit), stelle es oben genau so ein.</p>
        <button class="linkbtn" data-act="m-reset">Kopfrechnen zurücksetzen</button>
      </section>`;
  }
  function bindParents() {
    const s = M().set;
    const bind = (id, fn) => { const el = $("#" + id); if (el) el.onchange = () => { fn(el); save(); document.body.classList.toggle("calm", !!core.S.calm); }; };
    bind("m-rl", (el) => { s.roundLen = +el.value; });
    bind("m-tg", (el) => { s.targetSec = +el.value; });
    bind("m-gross", (el) => { s.gross = el.checked; });
    bind("m-ua", (el) => { s.unlockAll = el.checked; });
    bind("m-tm", (el) => { s.testMode = el.value; });
    bind("m-tn", (el) => { s.testN = +el.value; });
    bind("m-ts", (el) => { s.testSec = +el.value; });
    bind("m-tr", (el) => { s.testRead = el.checked; });
    bind("m-lo", (el) => { s.listenOnly = el.checked; });
    bind("m-sm", (el) => { s.sheetMin = +el.value; });
    bind("m-tl", (el) => { s.testLevels = el.value; });
    bind("m-td", (el) => { if (!el.value || /^\d{4}-\d{2}-\d{2}$/.test(el.value)) s.testDate = el.value; });
    bind("m-calm", (el) => { core.S.calm = el.checked; });
    bind("m-ar", (el) => { core.S.autoRead = el.checked; });
    bind("m-boss", (el) => { core.S.bossOn = el.checked; });
  }

  /* ================= Aktionen ================= */
  function act(a, v, b) {
    switch (a) {
      case "m-mission": startMission(); break;
      case "m-level": startPractice(v); break;
      case "m-blitz": startBlitz(); break;
      case "m-test": testIntro(); break;
      case "m-teststart": M().set.testMode = v; save(); core.closeModal(); startTest(v); break;
      case "m-key": key(v); break;
      case "m-cell": if (MR && MR.mode === "sheet" && !MR.lock) sheetSel(+v); break;
      case "m-hand": handIn(); break;
      case "m-tip": if (MR && !MR.lock) fb("hint", "💡 " + esc(RL.help(MR.cur).tip)); break;
      case "m-say": if (MR && MR.cur) core.say(RL.speech(MR.cur)); break;
      case "m-quit": if (MR) { MR.tok = -1; MR.done = true; core.addTime(MR); } go("home"); break;
      case "m-again": {
        const r = MR;
        if (!r) return go("home");
        if (r.mode === "practice" && r.level) startPractice(r.level);
        else if (r.mode === "practice") startList(r.results.map((x) => x.t), r.label);
        else if (r.mode === "mission") startMission();
        else if (r.mode === "blitz") startBlitz();
        else startTest(r.mode === "sheet" ? "sheet" : "ansage");
        break;
      }
      case "m-wrong": {
        const seen = new Set();
        startList(MR.results.filter((x) => !x.ok && !seen.has(x.t.key) && seen.add(x.t.key)).map((x) => x.t), "Fehler üben");
        break;
      }
      case "m-pause": core.startPause(() => (mstep() < 3 ? startMission() : go("home"))); break;
      case "m-pausehome": core.startPause(null); break;
      case "m-reset":
        if (b.dataset.sure) {
          core.S.math = mdefaults();
          Object.keys(core.S.badges).forEach((k) => { if (k.startsWith("m_")) delete core.S.badges[k]; });
          save(); go("home");
        } else { b.dataset.sure = "1"; b.textContent = "Wirklich alles vom Kopfrechnen löschen? Noch einmal tippen."; b.classList.add("danger"); }
        break;
    }
  }
  // echte Tastatur: Ziffern, Rücktaste, Enter
  document.addEventListener("keydown", (e) => {
    if (core.view !== "m-game" && core.view !== "m-sheet") return;
    if (e.target && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    let v = null;
    if (/^[0-9]$/.test(e.key)) v = e.key;
    else if (e.key === "Backspace") v = "del";
    else if (e.key === "Enter") v = "ok";
    if (v == null) return;
    e.preventDefault();
    key(v);
  });

  window.__DE_M = { get R() { return MR; }, M, RL };

  return {
    id: "math", prefix: "m-", name: "Kopfrechnen", icon: "🧮",
    home, act, badges,
    xp: () => (core.S.math && core.S.math.xp) || 0,
    render(view) { if (view === "m-game") return drawGame(); if (view === "m-sheet") return drawSheet(); if (view === "m-results") return renderResults(); go("home"); },
    activeOn: (k) => !!(core.S.math && core.S.math.days && core.S.math.days[k]),
    parents, bindParents,
  };
});
