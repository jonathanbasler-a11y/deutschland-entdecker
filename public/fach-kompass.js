"use strict";
// Fach Kompass 4 (Deutsch und Mathe): 2-Wochen-Plan, Startcheck, Etappen mit Boss, Übung je Bereich.
// Meldet sich bei app.js an (siehe "Fächer" dort). Ansichten und Aktionen beginnen mit "k-".
(window.DE_FAECHER = window.DE_FAECHER || []).push(function (core) {
  const K = window.DEKompass;
  const { $, esc, tone, confetti, dayKey, save, go, TEST } = core;
  const app = core.app;
  const TEST_DE = "2026-11-18", TEST_MA = "2026-11-19";

  /* ================= Speicher (S.kompass) ================= */
  const kdefaults = () => ({ xp: 0, comp: {}, days: {}, done: {}, mission: { day: "", step: 0 }, missionsDone: 0, checks: [], total: 0, bestCombo: 0, set: { testDate: TEST_DE } });
  let merged = null;
  function KS() {
    const S = core.S;
    if (!S.kompass || typeof S.kompass !== "object" || Array.isArray(S.kompass)) S.kompass = kdefaults();
    if (merged !== S.kompass) {
      const base = kdefaults(), m = Object.assign(kdefaults(), S.kompass);
      const kind = (v) => (Array.isArray(v) ? "array" : v === null ? "null" : typeof v);
      for (const k of Object.keys(base)) if (kind(m[k]) !== kind(base[k])) m[k] = base[k];
      m.set = Object.assign(kdefaults().set, m.set);
      S.kompass = m; merged = m;
    }
    return S.kompass;
  }
  const stat = (id) => KS().comp[id] || (KS().comp[id] = { n: 0, ok: 0, recent: [], stars: 0 });
  const starsOf = (id) => (KS().comp[id] && KS().comp[id].stars) || 0;
  const PLANT = ["🌰", "🌱", "🌷", "🌸"], PLANT_NAME = ["Samen", "Keimling", "Knospe", "Blume"];
  const starStr = (n) => "★".repeat(n) + "☆".repeat(3 - n);
  const areaStars = (areaId) => { const ids = K.compsOfArea(areaId); return ids.length ? ids.reduce((a, id) => a + starsOf(id), 0) / ids.length : 0; };
  const RANKS = [
    { xp: 0, name: "Kompass-Starter" }, { xp: 150, name: "Spurensucher" }, { xp: 400, name: "Pfadfinder" },
    { xp: 800, name: "Kompass-Kenner" }, { xp: 1400, name: "Navigator" }, { xp: 2200, name: "Kompass-Meister" },
  ];
  const statsMap = () => KS().comp;

  /* ================= Auswertung ================= */
  function record(t, ok) {
    const k = KS(), st = stat(t.comp), today = dayKey();
    st.n++; if (ok) st.ok++;
    st.recent.push(ok ? 1 : 0); if (st.recent.length > 10) st.recent.shift();
    st.last = today;
    const before = st.stars;
    st.stars = Math.max(st.stars || 0, K.starsFor(st.recent));
    k.total++;
    k.days[today] = (k.days[today] || 0) + 1;
    if (st.stars > before && KR) KR.gains.push({ comp: t.comp, stars: st.stars });
  }

  /* ================= Plan ================= */
  const todayPlan = () => K.planFor(dayKey());
  const mstep = () => (KS().mission.day === dayKey() ? KS().mission.step : 0);
  function daysUntil(s) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s || "")) return null;
    return Math.round((new Date(s + "T00:00:00") - new Date(dayKey() + "T00:00:00")) / 864e5);
  }
  const WD = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  const KIND_ICON = { check: "🧭", mini: "🌱", lzk: "🗺️", full: "💪", "probe-de": "📝", "probe-ma": "📝", mut: "🦁", warm: "🍀" };
  function calendar() {
    const today = dayKey();
    return `<ol class="kcal">${K.PLAN.map((p) => {
      const d = new Date(p.day + "T12:00:00"), done = !!KS().done[p.day], past = p.day < today, cur = p.day === today;
      const cls = cur ? "cur" : done ? "done" : past ? "past" : "";
      return `<li class="${cls}" title="${esc(p.title)}"><small>${WD[d.getDay()]}</small><b>${d.getDate()}.</b><span>${done ? "✓" : KIND_ICON[p.kind] || "•"}</span></li>`;
    }).join("")}</ol>`;
  }
  // Etappen für heute (außerhalb des Plans: freies Training wie ein Trainingstag)
  const todayKind = () => (todayPlan() ? todayPlan().kind : "full");
  const todaySteps = () => K.etappen(todayKind());
  function pathHtml(steps, step) {
    if (steps.length < 2) return "";
    return `<ol class="path">${steps.map((m, i) => `<li class="${i < step ? "done" : i === step ? "now" : ""}"><span class="dot">${i < step ? "✓" : ["🔤", "🔢", "🎯"][i] || "•"}</span><span>${esc(m.name)}</span></li>`).join("")}<li class="${step >= steps.length ? "done" : ""}"><span class="dot">🏆</span><span>Geschafft</span></li></ol>`;
  }

  /* ================= Startseite ================= */
  function chips() {
    const d = daysUntil(KS().set.testDate || TEST_DE);
    const t = d > 0 ? `<div class="chip lzk"><small>Kompass in</small><b>${d} ${d === 1 ? "Tag" : "Tagen"}</b></div>` : d === 0 ? `<div class="chip lzk"><small>Heute</small><b>Kompass! 🍀</b></div>` : "";
    return `<div class="chips">${t}<div class="chip"><small>Serie</small><b>🔥 ${core.streak()}</b></div></div>`;
  }
  function todayCard() {
    const p = todayPlan(), kind = todayKind(), steps = todaySteps(), k = KS();
    const done = !!k.done[dayKey()];
    const title = p ? p.title : "Freies Training", text = p ? p.text : "3 Etappen mit Bewegungspause, ca. 20 Minuten.";
    let btn;
    if (kind === "check" && !done) btn = `<button class="mode big" data-act="k-check"><span class="ico">🧭</span><div><b>Los geht's: Startcheck</b><br><span>${esc(text)}</span></div></button>`;
    else if (done) btn = `<div class="done-msg"><b>Für heute geschafft! 🏆</b><span>Super! Du kannst aufhören. Wenn du magst, übe unten einen Bereich.</span></div>`;
    else {
      const step = Math.min(mstep(), steps.length - 1), s = steps[step];
      btn = `<button class="mode big" data-act="k-mission"><span class="ico">${KIND_ICON[kind] || "💪"}</span><div><b>${mstep() === 0 ? "Los geht's" : "Weiter"}: ${steps.length > 1 ? `Etappe ${step + 1} von ${steps.length} · ` : ""}${esc(s.name)}</b><br><span>${esc(text)}</span></div></button>`;
    }
    return `<section class="card mission"><h2>Heute: ${esc(title)}</h2>${kind !== "check" && !done ? pathHtml(steps, mstep()) : ""}${btn}</section>`;
  }
  function areaList(fach) {
    return K.AREAS.filter((a) => a.fach === fach).map((a) => {
      const s = areaStars(a.id);
      return `<button class="karea" data-act="k-area" data-v="${a.id}" ${a.ready ? "" : "disabled"}><span class="ico">${a.icon}</span><span class="kt"><b>${esc(a.name)}</b><small>${a.ready ? `${PLANT[Math.floor(s)]} ${PLANT_NAME[Math.floor(s)]} · ${K.compsOfArea(a.id).length} Aufgabenarten` : "kommt bald"}</small></span></button>`;
    }).join("");
  }
  function home() {
    const k = KS();
    app.innerHTML = `${core.header({ title: "Kompass 4", ranks: RANKS, xp: k.xp, chips: chips() })}
      <div class="home khome">
        <section class="card"><h2>Dein 2-Wochen-Plan</h2>${calendar()}
          <p class="legend">Deutsch am Mi 18.11., Mathe am Do 19.11. Jeden Tag ein kleines Stück. Verpasste Tage sind nicht schlimm.</p>
          <h2 style="margin-top:14px">Test-Tipps</h2><ul class="ktips"><li>Lies jede Frage zweimal.</li><li>Weißt du etwas nicht? Überspringen und später wiederkommen.</li><li>Am Ende alles noch einmal anschauen.</li></ul></section>
        <div class="right">
          ${todayCard()}
          <button class="mode big" data-act="k-konner"><span class="ico">🌱</span><div><b>Mein Könnerblatt</b><br><span>Was ich schon kann und was ich noch übe</span></div></button>
          <section class="card"><h2>Deutsch</h2><div class="kareas">${areaList("de")}</div></section>
          <section class="card"><h2>Mathe</h2><div class="kareas">${areaList("ma")}</div></section>
        </div>
      </div>`;
  }

  /* ================= Runden ================= */
  let KR = null;
  const seed = () => (TEST.kSeed != null ? TEST.kSeed++ : Math.floor(Math.random() * 1e9));
  function newRound(mode, tasks, extra) {
    KR = Object.assign({ tok: Math.random(), mode, q: tasks.map((t) => ({ t })), i: 0, results: [], xp: 0, hits: 0, combo: 0, gains: [], t0: Date.now() }, extra || {});
    go("k-game");
  }
  function compsFor(areas) { return areas.flatMap((f) => K.compsOf(f)); }
  function startCheck() {
    const de = ["de.wortart", "de.satzglied", "de.zeitform", "de.wortfamilie", "de.recht.gross", "de.recht.strat", "de.zusammen", "de.steigerung"].filter((id) => K.COMP[id]), ma = ["ma.stelle", "ma.runden", "ma.plus", "ma.mal", "ma.geteilt", "ma.laenge", "ma.zeit", "ma.folge"];
    const tasks = de.map((id) => K.task(id, seed(), 1)).concat(ma.map((id) => K.task(id, seed(), 1)));
    newRound("check", tasks, { label: "Startcheck" });
  }
  function startMission() {
    const steps = todaySteps(), step = mstep();
    if (step >= steps.length || KS().done[dayKey()]) return go("home");
    const s = steps[step];
    const tasks = K.buildRound(compsFor(s.areas), TEST.kRoundLen || s.n, statsMap(), seed(), s.easy ? 1 : 2);
    newRound("mission", tasks, { mstep: step, steps: steps.length, easy: !!s.easy, label: (steps.length > 1 ? `Etappe ${step + 1} · ` : "") + s.name });
  }
  function startArea(areaId) {
    const a = K.AREAS.find((x) => x.id === areaId);
    if (!a || !a.ready) return;
    if (a.unit) {
      // Lesen: ein Text mit allen Fragen; der am wenigsten geübte Text kommt zuerst
      const ids = K.compsOfArea(areaId), sc = (id) => { const st = KS().comp[id]; return st ? (st.stars || 0) * 100 + st.n : -1; };
      const pickId = TEST.kText || ids.slice().sort((x, y) => sc(x) - sc(y))[0];
      return newRound("practice", K.unitTasks(pickId), { area: areaId, unit: pickId, label: K.COMP[pickId].name });
    }
    newRound("practice", K.buildRound(K.compsOfArea(areaId), TEST.kRoundLen || 6, statsMap(), seed(), 2), { area: areaId, label: a.name });
  }

  /* ================= Könnerblatt (wie in der Schule: Samen, Keimling, Knospe, Blume) ================= */
  function startComp(id) {
    const c = K.COMP[id];
    if (!c) return;
    newRound("practice", c.solo ? K.unitTasks(id) : K.buildRound([id], TEST.kRoundLen || 6, statsMap(), seed(), 2), { area: c.area, label: c.name });
  }
  function renderKonner() {
    const todo = K.COMPS.filter((c) => stat(c.id).n > 0 && starsOf(c.id) <= 1).sort((a, b) => starsOf(a.id) - starsOf(b.id) || stat(a.id).ok / stat(a.id).n - stat(b.id).ok / stat(b.id).n).slice(0, 3);
    const block = (fach, title) => `<section class="card konner"><h2>${title}</h2><div class="ktabwrap"><table class="ktab konnertab"><thead><tr><th>Ich kann …</th>${PLANT.map((p, i) => `<th title="${PLANT_NAME[i]}"><span class="pl">${p}</span><small>${PLANT_NAME[i]}</small></th>`).join("")}</tr></thead><tbody>${
      K.AREAS.filter((a) => a.fach === fach).map((a) => `<tr class="area"><th colspan="5">${a.icon} ${esc(a.name)}</th></tr>${K.compsOfArea(a.id).map((id) => { const st = starsOf(id), n = stat(id).n; return `<tr><th>${esc(compName(id))}</th>${PLANT.map((p, i) => `<td class="${n && i === st ? "on" : ""}">${n && i === st ? p : ""}</td>`).join("")}</tr>`; }).join("")}`).join("")}</tbody></table></div></section>`;
    app.innerHTML = `<div class="results konnerview"><div class="gbar"><button class="icon-btn" data-act="home" aria-label="Zurück">←</button><h1 style="flex:1">Mein Könnerblatt</h1></div>
      <section class="card"><p>So wie in der Schule: Jede Aufgabenart wächst vom Samen 🌰 zur Blume 🌸. Je öfter du richtig löst, desto weiter wächst sie. Sterne gehen nicht wieder verloren.</p>
        <h2>Das übe ich als Nächstes</h2>${todo.length ? `<div class="kareas">${todo.map((c) => `<button class="karea" data-act="k-comp" data-v="${c.id}"><span class="ico">${PLANT[starsOf(c.id)]}</span><span class="kt"><b>${esc(compName(c.id))}</b><small>Jetzt üben</small></span></button>`).join("")}</div>` : `<p class="muted">Noch nichts zu üben gefunden. Probiere einen Bereich aus, dann zeigt dir das Blatt, was noch wächst.</p>`}</section>
      ${block("de", "Deutsch")}${block("ma", "Mathe")}</div>`;
  }

  /* ================= Spielbildschirm ================= */
  function drawGame() {
    const r = KR;
    if (!r) return go("home");
    app.innerHTML = `<div class="game kgame">
      <div class="gbar"><button class="icon-btn" data-act="k-quit" aria-label="Beenden">✕</button>
        <div class="progress"><i id="pg"></i></div><div class="bossbar" id="bossbar" hidden></div>${core.gdog()}
        <span class="count" id="cnt"></span><span class="combo" id="combo"></span><span class="xp" id="xpv"></span></div>
      <div class="kstage"><div class="mcard kcard" id="kcard">
        <small class="mlabel">${esc(r.label || "")}</small>
        <div class="kpass" id="kpass" hidden></div>
        <div class="kq" id="kq"></div>
        <div class="kans" id="kans"></div>
        <div id="fb" class="mfb" aria-live="polite"></div>
        <div class="kact" id="kact"></div>
      </div></div></div>`;
    showTask();
  }
  const praise = ["Richtig!", "Super!", "Genau!", "Stark!", "Klasse!"];
  const pr = () => praise[Math.floor(Math.random() * praise.length)];
  const later = (fn, ms) => { const r = KR, tok = r.tok; setTimeout(() => { if (KR === r && r.tok === tok && !r.done && core.view === "k-game") fn(); }, ms); };
  const fb = (cls, html) => { const f = $("#fb"); if (f) f.innerHTML = html ? `<div class="feedback ${cls}">${html}</div>` : ""; };
  function updateBar() {
    const r = KR;
    const pg = $("#pg"); if (pg) pg.style.width = (r.i / r.q.length) * 100 + "%";
    const c = $("#cnt"); if (c) c.textContent = Math.min(r.i + 1, r.q.length) + " / " + r.q.length;
    if (r.boss) core.bossUI.draw(r);
    const x = $("#xpv"); if (x) x.textContent = "+" + r.xp;
    const cb = $("#combo"); if (cb) { cb.textContent = r.combo >= 2 ? "🔥 " + r.combo : ""; cb.classList.toggle("hot", r.combo >= 5); }
  }
  const numpad = (dec) => `<div class="numpad knum" role="group" aria-label="Ziffern">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button class="key" data-act="k-key" data-v="${d}">${d}</button>`).join("")}
    <button class="key del" data-act="k-key" data-v="del" aria-label="Löschen">⌫</button><button class="key" data-act="k-key" data-v="0">0</button>${dec ? `<button class="key" data-act="k-key" data-v=",">,</button>` : ""}<button class="key ok" data-act="k-key" data-v="ok" id="kok" aria-label="Fertig">✓</button></div>`;
  function showTask() {
    const r = KR;
    if (r.i >= r.q.length) {
      if (r.mode === "mission" && !r.easy && core.bossOn() && !r.boss) return startBoss();
      return finish();
    }
    const it = r.q[r.i], t = it.t;
    r.cur = t; r.attempt = 0; r.lock = false; r.wait = false; r.input = ""; r.sel = t.type === "match" ? t.left.map(() => []) : []; r.order = []; r.selfStage = 0; r.selfText = ""; r.showSol = false; r.vals = t.type === "nums" ? t.fields.map(() => "") : []; r.fld = 0;
    $("#kcard").classList.remove("good", "badc");
    const ps = $("#kpass"), P = t.passage;
    if (ps) {
      ps.hidden = !P;
      ps.innerHTML = P ? `<b class="kptitle">${esc(P.title)}</b>${P.lines ? P.lines.map((l, i) => `<p class="kline">${(i + 1) % 5 === 0 ? `<span class="ln">${i + 1}</span>` : ""}${esc(l)}</p>`).join("") : P.paras.map((x) => `<p>${esc(x)}</p>`).join("")}${P.extra ? `<div class="kextra">${P.extra.map(esc).join("<br>")}</div>` : ""}${t.source ? `<small class="ksrc">${esc(t.source)}</small>` : ""}` : "";
      ps.scrollTop = 0;
    }
    $("#kcard").classList.toggle("haspass", !!P);
    const tab = t.table ? `<div class="ktabwrap"><table class="ktab"><thead><tr>${t.table.head.map((x) => `<th>${esc(x)}</th>`).join("")}</tr></thead><tbody>${t.table.rows.map((row) => `<tr>${row.map((x, i) => (i === 0 ? `<th>${esc(x)}</th>` : `<td>${esc(x)}</td>`)).join("")}</tr>`).join("")}</tbody></table>${t.tableNote ? `<small class="muted">${esc(t.tableNote)}</small>` : ""}</div>` : "";
    $("#kq").innerHTML = `<p class="kqt">${esc(t.q)}</p>${t.show ? `<p class="kshow" aria-label="Buchstaben ohne Abstände">${esc(t.show)}</p>` : ""}${t.fig ? `<div class="kfig">${t.fig}</div>` : ""}${tab}${t.paper ? `<p class="kpaper">✏️ Rechne auf Papier wie im Test und tippe das Ergebnis ein.</p>` : ""}`;
    if (it.repeat) fb("hint", "Die kennst du schon von eben. Jetzt klappt's!");
    else if (it.boss && r.bossTries && r.bossTries[t.key]) fb("hint", "Die hat der Boss eben geblockt. Jetzt triffst du!");
    else fb();
    drawAnswer();
    updateBar();
    if (core.S.autoRead) core.say(t.say ? t.q.replace(/:.*/, ": " + t.say) : t.q);
  }
  function drawAnswer() {
    const r = KR, t = r.cur, a = $("#kans"), act = $("#kact");
    act.innerHTML = "";
    if (t.type === "num") {
      a.innerHTML = `<div class="knumrow"><span class="mans empty" id="mans"></span>${t.unit ? `<span class="kunit">${esc(t.unit)}</span>` : ""}</div>${numpad(t.dec)}`;
      return drawInput();
    }
    const lab = (o, i) => (t.figs ? `<span class="kfo">${t.figs[i]}</span><b>${esc(o)}</b>` : esc(o));
    if (t.type === "nums") {
      a.innerHTML = `<div class="knums${t.digit ? " digits" : ""}" role="group" aria-label="Eingabefelder">${t.fields.map((f, i) => `<button class="kfield${i === r.fld ? " cur" : ""}" data-act="k-field" data-v="${i}" aria-label="${esc(f.label)}"><small>${esc(f.label)}</small><b class="kfv" id="kfv${i}">${esc(r.vals[i] || "")}</b></button>`).join("")}</div>${numpad(false)}`;
      return;
    }
    if (t.type === "choice") {
      a.innerHTML = `<div class="opts kopts${t.opts.some((o) => o.length > 28) ? " long" : ""}">${t.opts.map((o, i) => `<button class="opt${t.figs ? " figopt" : ""}" data-act="k-opt" data-v="${i}">${lab(o, i)}</button>`).join("")}</div>`;
      return;
    }
    if (t.type === "grid") {
      const sz = t.cell, pl = t.padL || 0, pb = t.padB || 0, top = t.yLabels ? 12 : 4, W = t.cols * sz, H = t.rows * sz, given = new Set(t.given.map((c) => c.join(","))), sel = new Set(r.sel), sol = new Set((t.solCells || []).map((c) => c.join(",")));
      let g = `<rect width="${pl + W + 8}" height="${H + pb + top + 4}" fill="#fff"/>`;
      for (let x = 0; x < t.cols; x++) for (let y = 0; y < t.rows; y++) {
        const k = x + "," + y;
        let fill = "#fff", stroke = "#cdd6e3", sw = 1;
        if (given.has(k)) { fill = "#8fb8ff"; stroke = "#16304f"; sw = 2; }
        else if (sel.has(k)) { fill = "#ffe08a"; stroke = "#a67c00"; sw = 2.5; }
        if (r.showSol && !given.has(k)) {
          if (sol.has(k)) { fill = "#b7f0c0"; stroke = "#2f8f3a"; sw = 2.5; }
          else if (sel.has(k) && !t.verify) { fill = "#ffb3b3"; stroke = "#b83232"; sw = 2.5; }
        }
        g += `<rect x="${pl + 4 + x * sz}" y="${top + y * sz}" width="${sz}" height="${sz}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${given.has(k) || r.lock ? "" : ` data-act="k-cell" data-v="${k}" class="kcell"`}/>`;
      }
      if (t.axis != null) g += `<line x1="${pl + 4 + t.axis * sz}" y1="0" x2="${pl + 4 + t.axis * sz}" y2="${H + top + 4}" stroke="#d33" stroke-width="3" stroke-dasharray="8 6"/>`;
      if (t.yLabels) t.yLabels.forEach((l, k) => { g += `<text x="${pl - 2}" y="${top + H - k * sz + 4}" text-anchor="end" font-size="13" fill="#16304f">${esc(l)}</text>`; });
      if (t.xLabels) t.xLabels.forEach((l, i) => { g += `<text x="${pl + 4 + i * sz + sz / 2}" y="${top + H + 18}" text-anchor="middle" font-size="13" font-weight="700" fill="#16304f">${esc(l)}</text>`; });
      a.innerHTML = `<div class="kgridwrap"><svg class="kgrid" viewBox="0 0 ${pl + W + 8} ${H + pb + top + 4}" role="group" aria-label="Raster zum Antippen">${g}</svg></div>`;
      act.innerHTML = `<button class="btn" data-act="k-check-ans" id="kgo">Prüfen</button>`;
      return;
    }
    if (t.type === "multi" || t.type === "pick") {
      const list = t.type === "pick" ? t.tokens : t.opts;
      a.innerHTML = `<div class="${t.type === "pick" ? "kwords" : "opts kopts"}">${list.map((o, i) => `<button class="${t.type === "pick" ? "kword" : "opt" + (t.figs ? " figopt" : "")}" data-act="k-tog" data-v="${i}" aria-pressed="${r.sel.includes(i)}">${t.type === "pick" ? esc(o) : lab(o, i)}</button>`).join("")}</div>`;
      act.innerHTML = `<button class="btn" data-act="k-check-ans" id="kgo">Prüfen</button>`;
      return;
    }
    if (t.type === "order") {
      if (!r.pool) r.pool = K.shuffled(K.rng(t.seed + 3), t.items);
      a.innerHTML = `<div class="korder" id="korder">${r.order.map((x, i) => `<button class="kchip set" data-act="k-unorder" data-v="${i}">${esc(x)}</button>`).join("") || '<span class="muted">${esc(t.hint || "Tippe die Zahlen der Reihe nach an.")}</span>'}</div>
        <div class="kpool">${r.pool.map((x, i) => `<button class="kchip" data-act="k-ord" data-v="${i}" ${r.order.includes(x) ? "disabled" : ""}>${esc(x)}</button>`).join("")}</div>`;
      act.innerHTML = `<button class="btn" data-act="k-check-ans" id="kgo" ${r.order.length === t.items.length ? "" : "disabled"}>Prüfen</button>`;
      return;
    }
    if (t.type === "write") {
      a.innerHTML = `<form class="write" id="kwf" autocomplete="off"><input id="kwi" type="text" autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="done" aria-label="Antwort" placeholder="Antwort eintippen"><button class="btn" type="submit" id="kws">Prüfen</button></form>`;
      $("#kwf").onsubmit = (e) => { e.preventDefault(); if (r.lock) { if (r.wait) next(); return; } submit($("#kwi").value); };
      setTimeout(() => { const i = $("#kwi"); if (i) try { i.focus({ preventScroll: true }); } catch (e) { /* */ } }, 60);
      return;
    }
    if (t.type === "tf") {
      a.innerHTML = `<table class="ktf">${t.rows.map((row, i) => `<tr><td>${esc(row.s)}</td><td><button class="segbtn" data-act="k-tf" data-v="${i}:1" aria-pressed="${r.sel[i] === true}">stimmt</button><button class="segbtn" data-act="k-tf" data-v="${i}:0" aria-pressed="${r.sel[i] === false}">stimmt nicht</button></td></tr>`).join("")}</table>`;
      act.innerHTML = `<button class="btn" data-act="k-check-ans" id="kgo">Prüfen</button>`;
      return;
    }
    if (t.type === "match") {
      a.innerHTML = `<div class="kmatch">${t.left.map((l, i) => `<div class="kmrow"><span class="kml">${esc(l)}</span><div class="kmopts">${t.right.map((o, j) => `<button class="kmo" data-act="k-mat" data-v="${i}:${j}" aria-pressed="${(r.sel[i] || []).includes(j)}">${esc(o)}</button>`).join("")}</div></div>`).join("")}</div>`;
      act.innerHTML = `<button class="btn" data-act="k-check-ans" id="kgo">Prüfen</button>`;
      return;
    }
    if (t.type === "cut") {
      a.innerHTML = `<div class="kcut" role="group" aria-label="Satz">${t.tokens.map((w, i) => `<span class="kcw">${esc(w)}</span>${i < t.tokens.length - 1 ? `<button class="kgap ${r.sel.includes(i) ? "on" : ""}" data-act="k-gap" data-v="${i}" aria-pressed="${r.sel.includes(i)}" aria-label="Trennstrich nach ${esc(w)}"><i></i></button>` : ""}`).join("")}</div><p class="muted kcuthint">Tippe auf die Lücke, wo ein Satzglied zu Ende ist.</p>`;
      act.innerHTML = `<button class="btn" data-act="k-check-ans" id="kgo">Prüfen</button>`;
      return;
    }
    if (t.type === "self") {
      if (!r.selfStage) {
        a.innerHTML = `<textarea id="kst" class="kself" rows="3" autocomplete="off" autocorrect="off" spellcheck="false" aria-label="Deine Antwort" placeholder="Schreibe deine Antwort in ganzen Sätzen">${esc(r.selfText || "")}</textarea>`;
        act.innerHTML = `<button class="btn" data-act="k-self-go" id="kgo">Fertig, Lösung zeigen</button>`;
      } else {
        a.innerHTML = `<div class="kselfbox"><p class="muted">Du hast geschrieben:</p><p class="kmine">${esc(r.selfText) || "(nichts)"}</p><p class="muted">So kann die Antwort aussehen:</p><p class="kmodel">${esc(t.model)}</p><p>Hast du dasselbe gemeint?</p></div>`;
        act.innerHTML = `<button class="btn" data-act="k-self" data-v="1" id="kgo">Ja, stimmt ungefähr ✅</button><button class="btn ghost" data-act="k-self" data-v="0">Da fehlt noch etwas</button>`;
      }
    }
  }
  function drawInput() {
    const r = KR, el = $("#mans");
    if (!el) return;
    el.textContent = r.input || "";
    el.classList.toggle("empty", !r.input);
  }
  function drawNums() {
    const r = KR, t = r.cur;
    if (!t || t.type !== "nums") return;
    t.fields.forEach((f, i) => {
      const b = document.querySelector(`.kfield[data-v="${i}"]`), el = $("#kfv" + i);
      if (b) b.classList.toggle("cur", i === r.fld && !r.lock);
      if (el) el.textContent = r.vals[i] || "";
    });
  }
  function keyNums(v) {
    const r = KR, t = r.cur, last = t.fields.length - 1;
    if (v === "del") {
      if (!r.vals[r.fld] && r.fld > 0 && t.digit) r.fld--;
      r.vals[r.fld] = (r.vals[r.fld] || "").slice(0, -1);
    } else if (v === "ok") {
      const empty = r.vals.findIndex((x) => !x);
      if (empty >= 0) r.fld = empty; else return submit(r.vals.slice());
    } else if (v === ",") return;
    else if (t.digit) { r.vals[r.fld] = v; if (r.fld < last) r.fld++; }
    else if ((r.vals[r.fld] || "").replace(/\D/g, "").length < 7) r.vals[r.fld] = K.fmt(+((r.vals[r.fld] || "") + v).replace(/\./g, ""));
    document.querySelectorAll(".kfield").forEach((b) => b.classList.remove("bad"));
    drawNums();
  }
  function key(v) {
    const r = KR;
    if (!r || r.done || core.view !== "k-game" || !r.cur || (r.cur.type !== "num" && r.cur.type !== "nums")) return;
    if (r.lock) { if (r.wait && v === "ok") next(); return; }
    if (r.cur.type === "nums") return keyNums(v);
    if (v === "del") r.input = (r.input || "").slice(0, -1);
    else if (v === "ok") return r.input ? submit(r.input) : null;
    else if (v === "," && (!r.cur.dec || (r.input || "").includes(","))) return;
    else if ((r.input || "").replace(/\D/g, "").length < 7) {
      r.input = (r.input || "") + v;
      // Tausenderpunkte wie auf dem Blatt
      if (!r.cur.dec) r.input = K.fmt(+r.input.replace(/\./g, ""));
    }
    const a = $("#mans"); if (a) a.classList.remove("bad");
    drawInput();
  }
  const next = () => { if (!KR) return; KR.i++; KR.pool = null; showTask(); };
  function submit(given) {
    const r = KR, t = r.cur;
    if (r.lock) return;
    const res = K.check(t, given);
    if (res.ok) right(); else wrong(res);
  }
  function right() {
    const r = KR, t = r.cur, k = KS(), it = r.q[r.i], first = r.attempt === 0;
    r.lock = true;
    if (first && !it.repeat && !it.boss) record(t, true);
    let gain = first ? 10 : 5;
    if (first) { r.combo++; if (r.combo > k.bestCombo) k.bestCombo = r.combo; if (r.combo >= 3) gain += Math.min(5, r.combo - 2); }
    let won = false;
    if (it.boss) { won = core.bossUI.hit(r); if (won) { gain += 20; r.q.length = r.i + 1; } }
    k.xp += gain; r.xp += gain;
    if (!it.boss) r.hits++;
    if (!it.repeat && !it.boss) r.results.push({ t, ok: first });
    $("#kcard").classList.add("good");
    markSolution(true);
    fb("ok", `${it.boss ? (won ? "Boss besiegt! 🏆" : "Treffer! 💥") : pr()}${r.combo >= 3 ? `<small>🔥 ${r.combo} richtig hintereinander</small>` : ""}`);
    tone("ok", r.combo);
    if (!it.boss) core.petReact(r.combo && r.combo % 5 === 0 ? "flip" : "hop");
    core.fx.plus($("#fb"), $("#xpv"), "+" + gain);
    if (r.combo > 0 && r.combo % 5 === 0) confetti(40);
    save(); updateBar(); core.checkBadges();
    later(next, won ? 1300 : 1000);
  }
  function shake() {
    if (core.S.calm) return;
    const c = $("#kcard"); c.classList.remove("shake"); void c.offsetWidth; c.classList.add("shake");
  }
  function wrong(res) {
    const r = KR, t = r.cur, it = r.q[r.i];
    r.attempt++;
    shake();
    if (r.attempt === 1) { r.combo = 0; if (!it.repeat && !it.boss) record(t, false); }
    if (it.boss) core.bossUI.block(r); else core.petReact("tilt");
    tone("bad");
    if (r.attempt === 1 && r.mode !== "check" && t.type !== "self") {
      fb("hint", `${it.boss ? "Der Boss blockt!" : res && res.caseOnly ? "Fast! Achte auf Groß- und Kleinschreibung." : "Nicht ganz."} 💡 ${esc(t.tip)}`);
      // Eingaben zurücksetzen, damit er es noch einmal versucht
      if (t.type === "num") { r.input = ""; setTimeout(drawInput, 500); const a = $("#mans"); if (a) a.classList.add("bad"); }
      if (t.type === "nums") { r.vals = t.fields.map(() => ""); r.fld = 0; document.querySelectorAll(".kfield").forEach((b) => b.classList.add("bad")); setTimeout(() => { document.querySelectorAll(".kfield").forEach((b) => b.classList.remove("bad")); drawNums(); }, 600); }
      if (t.type === "choice") { const b = document.querySelector(`.kopts .opt[data-v="${r.lastOpt}"]`); if (b) { b.classList.add("bad"); b.disabled = true; } }
      if (t.type === "order") { r.order = []; drawAnswer(); }
      save(); updateBar();
      return;
    }
    // Startcheck: nur ein Versuch (wie ein kleiner Test), dann weiter
    r.lock = true; r.wait = true;
    if (it.boss) { r.q.push({ t, boss: true }); (r.bossTries = r.bossTries || {})[t.key] = 1; }
    else if (!it.repeat) {
      r.results.push({ t, ok: false });
      if (r.mode !== "check") r.q.splice(Math.min(r.i + 4, r.q.length), 0, { t, repeat: true });
    }
    $("#kcard").classList.add("badc");
    markSolution(false);
    fb(r.mode === "check" ? "hint" : "bad", `${r.mode === "check" ? "Das üben wir noch. " : ""}Lösung: <b>${esc(K.solution(t))}</b><small>${esc(t.explain)}${it.repeat || r.mode === "check" ? "" : " · Die Aufgabe kommt gleich noch einmal."}</small>`);
    // ein einziger Weiter-Knopf: bei Zahlen auf dem Ziffernblock, beim Schreiben im Formular, sonst darunter
    if (t.type === "num" || t.type === "nums") { const kok = $("#kok"); if (kok) { kok.textContent = "Weiter"; kok.id = "knx"; kok.classList.add("wide"); } }
    else if (t.type === "write") { const s = $("#kws"); if (s) { s.textContent = "Weiter"; s.id = "knx"; } }
    else $("#kact").innerHTML = `<button class="btn" data-act="k-next" id="knx">Weiter</button>`;
    save(); updateBar();
  }
  // richtige Antwort sichtbar machen
  function markSolution(ok) {
    const r = KR, t = r.cur;
    if (t.type === "num") { const a = $("#mans"); if (a) { if (!ok) a.textContent = K.solution(t).replace(/ .*$/, ""); a.classList.remove("bad"); a.classList.add(ok ? "ok" : "sol"); } }
    if (t.type === "choice") document.querySelectorAll(".kopts .opt").forEach((b) => { b.disabled = true; if (+b.dataset.v === t.ans) b.classList.add("ok"); });
    if (t.type === "multi" || t.type === "pick") document.querySelectorAll("[data-act='k-tog']").forEach((b) => { b.disabled = true; const i = +b.dataset.v; if (t.ans.includes(i)) b.classList.add("ok"); else if (r.sel.includes(i)) b.classList.add("bad"); });
    if (t.type === "order" && !ok) { const o = $("#korder"); if (o) o.innerHTML = t.items.map((x) => `<span class="kchip ok">${esc(x)}</span>`).join(""); }
    if (t.type === "write") { const i = $("#kwi"); if (i) { i.classList.add(ok ? "ok" : "bad"); if (!ok) i.value = t.ans[0]; } }
    if (t.type === "match") document.querySelectorAll(".kmo").forEach((b) => { b.disabled = true; const [i, j] = b.dataset.v.split(":").map(Number); if (t.ans[i].includes(j)) b.classList.add("ok"); else if ((r.sel[i] || []).includes(j)) b.classList.add("bad"); });
    if (t.type === "cut") document.querySelectorAll(".kgap").forEach((b) => { b.disabled = true; const i = +b.dataset.v; b.classList.toggle("ok", t.ans.includes(i)); b.classList.toggle("bad", !t.ans.includes(i) && r.sel.includes(i)); });
    if (t.type === "self") { const ta = $("#kst"); if (ta) ta.disabled = true; }
    if (t.type === "grid") { r.showSol = true; drawAnswer(); }
    if (t.type === "nums") t.fields.forEach((f, i) => {
      const b = document.querySelector(`.kfield[data-v="${i}"]`), el = $("#kfv" + i), good = K.parseNum(r.vals[i]) === f.ans;
      if (b) { b.classList.remove("cur", "bad"); b.classList.add(good ? "ok" : "sol"); }
      if (el) el.textContent = t.digit ? String(f.ans) : K.fmt(f.ans);
    });
    const go = $("#kgo"); if (go) go.remove();
  }

  /* ---------- Boss am Ende der Etappe ---------- */
  function startBoss() {
    const r = KR, step = Math.min(2, r.mstep || 0), max = window.DEBegleiter.bossHp(step);
    const seen = new Set();
    let tasks = r.results.filter((x) => !x.ok && !seen.has(x.t.key) && seen.add(x.t.key)).map((x) => x.t).slice(0, max);
    if (tasks.length < max) tasks = tasks.concat(K.buildRound(r.q.map((x) => x.t.comp), max, statsMap(), seed(), 2).slice(0, max - tasks.length));
    core.bossUI.start(r, step);
    r.q.push(...tasks.map((t) => ({ t, boss: true })));
    const lab = $(".mlabel"); if (lab) lab.textContent = "⚔️ Boss: " + r.boss.def.name;
    $("#kcard").classList.add("bossfight");
    showTask();
  }

  /* ================= Ende der Runde ================= */
  function finish() {
    const r = KR;
    if (!r || r.done) return;
    r.done = true; r.tok = -1;
    const k = KS(), ok = r.results.filter((x) => x.ok).length, n = r.results.length;
    r.ok = ok; r.n = n; r.pct = n ? Math.round((ok / n) * 100) : 0;
    core.addTime(r);
    if (r.mode === "mission") {
      const step = r.mstep + 1;
      k.mission = { day: dayKey(), step };
      if (step >= r.steps) { k.done[dayKey()] = true; k.missionsDone = (k.missionsDone || 0) + 1; }
      r.newStep = step;
    }
    if (r.mode === "check") {
      k.done[dayKey()] = true;
      k.checks.push({ date: dayKey(), n, ok, comps: r.results.map((x) => [x.t.comp, x.ok ? 1 : 0]) });
    }
    const blocks = r.mode === "mission" ? 3 : r.mode === "check" ? 2 : n ? 1 : 0;
    r.loot = blocks ? core.giveBlocks(blocks) : null;
    save();
    core.checkBadges();
    go("k-results");
    if (r.pct >= 80 || (r.mode === "mission" && r.newStep >= r.steps)) { confetti(120); tone("win"); }
  }
  const compName = (id) => (K.COMP[id] ? K.COMP[id].name : id);
  function renderResults() {
    const r = KR;
    if (!r) return go("home");
    const uniqComps = (list) => [...new Set(list.map((x) => x.t.comp))];
    const goodC = uniqComps(r.results.filter((x) => x.ok)), badC = uniqComps(r.results.filter((x) => !x.ok));
    let head, big = `${r.ok} / ${r.n}`, sub = `+${r.xp} Punkte`, extra = "", buttons;
    const home = `<button class="btn ghost" data-act="home">Zur Startseite</button>`;
    buttons = `<button class="btn" data-act="k-again">Noch einmal</button>` + home;
    if (r.mode === "check") {
      head = "Startcheck geschafft! 🧭";
      sub = "Super, dass du alles ausprobiert hast. Jetzt wissen wir, womit wir starten.";
      buttons = `<button class="btn" data-act="home">Fertig für heute</button>`;
    } else if (r.mode === "mission") {
      const step = r.newStep, all = step >= r.steps;
      head = all ? "Für heute geschafft! 🏆" : `Etappe ${step} geschafft!`;
      sub = all ? `+${r.xp} Punkte. Super gemacht! Für heute kannst du aufhören.` : `+${r.xp} Punkte. Noch ${r.steps - step} ${r.steps - step === 1 ? "Etappe" : "Etappen"}.`;
      if (r.steps > 1) extra = `<div class="mission">${pathHtml(todaySteps(), step)}</div>`;
      buttons = all ? `<button class="btn" data-act="home">Fertig für heute</button>`
        : `<button class="btn" data-act="k-mission">Weiter zu Etappe ${step + 1}</button><button class="btn ghost" data-act="k-pause">Erst Bewegungspause (20 s)</button><button class="btn ghost" data-act="home">Für heute aufhören</button>`;
    } else head = r.pct === 100 ? "Alles richtig! 🎉" : r.pct >= 80 ? "Stark gemacht!" : r.pct >= 50 ? "Gut gemacht!" : "Weiter üben, du schaffst das!";
    const gains = r.gains.map((g) => `⭐ ${esc(compName(g.comp))}: jetzt ${starStr(g.stars)}`).concat([core.bossUI.line(r.boss), r.loot ? r.loot.text : ""].filter(Boolean));
    let hint = "";
    if (r.mode !== "mission" && core.pauseHint()) hint = `<div class="card pausehint"><b>Du übst schon eine Weile, super!</b><span>Zeit für eine kurze Pause?</span><button class="btn ghost" data-act="k-pausehome">Bewegungspause (20 s)</button></div>`;
    const li = (id) => `<li>${esc(compName(id))}</li>`;
    app.innerHTML = `<div class="results kresults"><div class="card hero"><h1>${head}</h1><div class="score">${big}</div><p class="muted">${sub}</p>
      ${gains.length ? `<div class="gains">${gains.map((g) => `<div>${g}</div>`).join("")}</div>` : ""}${extra}</div>
      ${hint}<div class="listcols"><div class="card"><h2>Das kannst du schon</h2><ul>${goodC.map(li).join("") || "<li class='muted'>noch nichts</li>"}</ul></div>
      <div class="card"><h2>Das üben wir noch</h2><ul>${badC.map(li).join("") || "<li class='muted'>alles richtig 🎉</li>"}</ul></div></div>
      <div class="row">${buttons}</div></div>`;
  }

  /* ================= Abzeichen ================= */
  const allStars = (fach, n) => { const ids = K.compsOf(fach); return ids.length && ids.every((id) => starsOf(id) >= n); };
  const badges = [
    { id: "k_check", icon: "🧭", name: "Kompass-Start", desc: "Den Startcheck gemacht", ok: () => KS().checks.length >= 1 },
    { id: "k_day1", icon: "📅", name: "Planer", desc: "Den ersten Plan-Tag geschafft", ok: () => Object.keys(KS().done).length >= 1 },
    { id: "k_day5", icon: "🗓️", name: "Dranbleiber", desc: "5 Plan-Tage geschafft", ok: () => Object.keys(KS().done).length >= 5 },
    { id: "k_combo", icon: "🔥", name: "Kompass-Serie", desc: "8 richtig hintereinander", ok: () => KS().bestCombo >= 8 },
    { id: "k_de1", icon: "🔤", name: "Sprachforscher", desc: "Jede Deutsch-Aufgabenart mit einem Stern", ok: () => allStars("de", 1) },
    { id: "k_ma1", icon: "🔢", name: "Zahlenforscher", desc: "Jede Mathe-Aufgabenart mit einem Stern", ok: () => allStars("ma", 1) },
    { id: "k_100", icon: "💯", name: "Hundert Aufgaben", desc: "100 Kompass-Aufgaben gelöst", ok: () => KS().total >= 100 },
  ];

  /* ================= Eltern-Übersicht ================= */
  function parents() {
    const k = KS();
    const rows = K.AREAS.map((a) => {
      const ids = K.compsOfArea(a.id);
      if (!ids.length) return `<tr><td colspan="4"><b>${a.icon} ${esc(a.name)}</b> <span class="muted">(kommt noch)</span></td></tr>`;
      return `<tr><td colspan="4"><b>${a.icon} ${esc(a.name)}</b></td></tr>` + ids.map((id) => {
        const st = k.comp[id], rec = (st && st.recent) || [];
        const acc = rec.length ? Math.round((rec.filter(Boolean).length / rec.length) * 100) + " %" : "–";
        return `<tr><td>${esc(compName(id))}</td><td>${starStr(starsOf(id))}</td><td>${acc}</td><td>${st ? st.n : 0}</td></tr>`;
      }).join("");
    }).join("");
    const doneDays = K.PLAN.filter((p) => k.done[p.day]).length;
    return `
      <section class="card"><h2>Kompass 4: Stand</h2><p class="muted" style="margin-bottom:8px">Plan: ${doneDays} von ${K.PLAN.length} Tagen geschafft · ${k.total} Aufgaben · ${k.missionsDone} Trainingstage.</p>
        <table class="tbl"><thead><tr><th>Aufgabenart</th><th>Sterne</th><th>Richtig (letzte 10)</th><th>Aufgaben</th></tr></thead><tbody>${rows}</tbody></table>
        <p class="muted" style="margin-top:8px">★ 3 von 4 richtig · ★★ 75 % der letzten 8 · ★★★ 90 % der letzten 10. Sterne bleiben.</p></section>
      <section class="card"><h2>Einstellungen Kompass</h2><div class="setgrid">
        <label for="k-td">Datum Kompass Deutsch</label><input type="date" id="k-td" value="${esc(k.set.testDate || TEST_DE)}">
        <label for="k-boss">Boss-Kampf am Ende jeder Etappe (gilt für alle Fächer)</label><input type="checkbox" id="k-boss" ${core.bossOn() ? "checked" : ""}>
        </div><button class="linkbtn" data-act="k-reset">Kompass zurücksetzen</button></section>`;
  }
  function bindParents() {
    const bind = (id, fn) => { const el = $("#" + id); if (el) el.onchange = () => { fn(el); save(); }; };
    bind("k-td", (el) => { if (/^\d{4}-\d{2}-\d{2}$/.test(el.value)) KS().set.testDate = el.value; });
    bind("k-boss", (el) => { core.S.bossOn = el.checked; });
  }

  /* ================= Aktionen ================= */
  function act(a, v, b) {
    const r = KR;
    switch (a) {
      case "k-check": startCheck(); break;
      case "k-mission": startMission(); break;
      case "k-area": startArea(v); break;
      case "k-konner": go("k-konner"); break;
      case "k-comp": startComp(v); break;
      case "k-key": key(v); break;
      case "k-opt": if (r && !r.lock && r.cur.type === "choice") { r.lastOpt = +v; submit(+v); } break;
      case "k-tog": if (r && !r.lock) { const i = +v; r.sel = r.sel.includes(i) ? r.sel.filter((x) => x !== i) : r.sel.concat(i); b.setAttribute("aria-pressed", String(r.sel.includes(i))); } break;
      case "k-ord": if (r && !r.lock) { const x = r.pool[+v]; if (!r.order.includes(x)) { r.order.push(x); drawAnswer(); } } break;
      case "k-unorder": if (r && !r.lock) { r.order.splice(+v, 1); drawAnswer(); } break;
      case "k-tf": if (r && !r.lock) { const [i, val] = v.split(":"); r.sel[+i] = val === "1"; drawAnswer(); } break;
      case "k-check-ans": if (r && !r.lock) { const t = r.cur; submit(t.type === "order" ? r.order : t.type === "tf" ? r.sel : r.sel); } break;
      case "k-field": if (r && !r.lock) { r.fld = +v; drawNums(); } break;
      case "k-cell": if (r && !r.lock) {
        if (r.cur.bars) {
          // Balken: Tippen setzt die Höhe der Spalte auf dieses Kästchen (nochmal auf das oberste tippen löscht)
          const [cx, cy] = v.split(",").map(Number), rows = r.cur.rows, lvl = rows - cy, have = r.sel.filter((k) => +k.split(",")[0] === cx).length;
          r.sel = r.sel.filter((k) => +k.split(",")[0] !== cx);
          if (lvl !== have) for (let j = 0; j < lvl; j++) r.sel.push(cx + "," + (rows - 1 - j));
        } else r.sel = r.sel.includes(v) ? r.sel.filter((x) => x !== v) : r.sel.concat(v);
        drawAnswer();
      } break;
      case "k-mat": if (r && !r.lock) { const [i, j] = v.split(":").map(Number); r.sel[i] = (r.sel[i] || []).includes(j) ? [] : [j]; drawAnswer(); } break;
      case "k-gap": if (r && !r.lock) { const i = +v; r.sel = r.sel.includes(i) ? r.sel.filter((x) => x !== i) : r.sel.concat(i); drawAnswer(); } break;
      case "k-self-go": if (r && !r.lock) { const ta = $("#kst"); r.selfText = ta ? ta.value.trim() : ""; r.selfStage = 1; drawAnswer(); } break;
      case "k-self": if (r && !r.lock && r.selfStage) submit(v === "1"); break;
      case "k-next": if (r && r.wait) next(); break;
      case "k-quit": if (r) { r.tok = -1; r.done = true; core.addTime(r); } go("home"); break;
      case "k-again": if (!r) return go("home"); if (r.mode === "practice") startArea(r.area); else if (r.mode === "mission") startMission(); else go("home"); break;
      case "k-pause": core.startPause(() => startMission()); break;
      case "k-pausehome": core.startPause(null); break;
      case "k-reset":
        if (b.dataset.sure) { core.S.kompass = kdefaults(); merged = null; Object.keys(core.S.badges).forEach((x) => { if (x.startsWith("k_")) delete core.S.badges[x]; }); save(); go("home"); }
        else { b.dataset.sure = "1"; b.textContent = "Wirklich alles vom Kompass löschen? Noch einmal tippen."; b.classList.add("danger"); }
        break;
    }
  }
  // echte Tastatur bei Zahlenaufgaben
  document.addEventListener("keydown", (e) => {
    if (core.view !== "k-game" || !KR || !KR.cur || (KR.cur.type !== "num" && KR.cur.type !== "nums")) return;
    if (e.target && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    let v = null;
    if (/^[0-9]$/.test(e.key)) v = e.key;
    else if (e.key === ",") v = ",";
    else if (e.key === "Backspace") v = "del";
    else if (e.key === "Enter") v = "ok";
    if (v == null) return;
    e.preventDefault();
    key(v);
  });

  window.__DE_K = { get R() { return KR; }, KS, K, play: (ids) => newRound("practice", ids.flatMap((id, i) => (K.COMP[id] && K.COMP[id].solo ? K.unitTasks(id) : [K.task(id, i, 2)])), { area: "de.sprache", label: "Test" }) };

  return {
    id: "kompass", prefix: "k-", name: "Kompass 4", icon: "🧭",
    home, act, badges,
    xp: () => (core.S.kompass && core.S.kompass.xp) || 0,
    render(view) { if (view === "k-game") return drawGame(); if (view === "k-results") return renderResults(); if (view === "k-konner") return renderKonner(); go("home"); },
    activeOn: (k) => !!(core.S.kompass && core.S.kompass.days && core.S.kompass.days[k]),
    parents, bindParents,
  };
});
