/* Tagesansicht: stempeln, Zeitraeume bearbeiten, Feierabend-Prognose. */

import { h, $, fill, toast, celebrate } from "../ui.js";
import * as store from "../store.js";
import { state } from "../store.js";
import { computeDay, DAY_TYPES, PLACES, placeOf, dayType, ARBZG } from "../rules.js";
import { phaseOf, spruchFor, nextSpruch } from "../sprueche.js";
import { fmtClock, fmtDur, fmtShort, fmtSigned, fmtDateLong, fmtDateShort,
         todayKey, addDays, toMin, nowMin, nowClock, weekdayName } from "../time.js";

let root = null;
let els = {};
let pendingPlace = null;      // Ort fuer den naechsten Stempel
let lastSegSig = "";
let wasDone = null;

/* ---------- Aufbau ---------- */

function build(){
  els = {};

  const typeSeg = h("div", { class: "seg", id: "typeSeg", role: "group", "aria-label": "Tagesart" },
    DAY_TYPES.map(t => h("button", {
      type: "button", "data-type": t.id, "aria-pressed": "false",
      onclick: () => { store.setType(state.date, t.id); toast(t.label + " gesetzt"); }
    }, t.short)));
  els.typeSeg = typeSeg;

  els.placeChoice = h("div", { class: "place-choice", role: "group", "aria-label": "Arbeitsort" },
    PLACES.map(p => h("button", {
      type: "button", "data-place": p.id, "aria-pressed": "false",
      onclick: () => choosePlace(p.id)
    }, h("span", { class: "ic" }, p.icon), h("span", null, p.label))));

  els.stampBtn = h("button", { class: "big-btn", type: "button", onclick: stamp });
  els.stampCard = h("div", { class: "card" },
    h("div", { class: "stamp" }, els.placeChoice, els.stampBtn));

  els.heroLbl = h("div", { class: "lbl" }, "Feierabend um");
  els.heroBig = h("div", { class: "big" }, "—");
  els.heroSub = h("div", { class: "sub" }, "");
  els.pillDot = h("span", { class: "dot" });
  els.pillTxt = h("span");
  els.pill = h("div", { class: "pill" }, els.pillDot, els.pillTxt);
  const hero = h("div", { class: "card hero" }, els.heroLbl, els.heroBig, els.heroSub, els.pill);

  els.notices = h("div");

  els.spruchTxt = h("div", { class: "spruch-txt" }, "");
  els.spruchCard = h("div", {
    class: "card spruch", role: "button", tabindex: "0", title: "Antippen für einen neuen Spruch",
    onclick: () => { nextSpruch(); update(); },
    onkeydown: e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); nextSpruch(); update(); } }
  }, els.spruchTxt, h("div", { class: "spruch-hint" }, "antippen für einen neuen Spruch"));

  els.tlStart = h("span", null, "Start");
  els.tlEnd = h("span", null, "Feierabend");
  els.track = h("div", { class: "track" });
  const tlCard = h("div", { class: "card" },
    h("div", { class: "tl-head" }, els.tlStart, els.tlEnd), els.track);

  els.vPresence = h("div", { class: "v num" }, "—");
  els.vNet      = h("div", { class: "v num" }, "—");
  els.vBreak    = h("div", { class: "v num" }, "—");
  els.vRemain   = h("div", { class: "v num" }, "—");
  els.vSaldo    = h("div", { class: "v num" }, "—");
  els.vAccount  = h("div", { class: "v num" }, "—");
  const grid = h("div", { class: "grid" },
    cell("Anwesend", els.vPresence), cell("Gearbeitet", els.vNet),
    cell("Pause", els.vBreak), cell("Bis Feierabend", els.vRemain),
    cell("Saldo heute", els.vSaldo), cell("Zeitkonto", els.vAccount));

  els.segList = h("div");
  const segCard = h("div", { class: "card" },
    h("div", { class: "sec-title" }, "Zeiträume"),
    els.segList,
    h("div", { class: "spacer" }),
    h("button", { class: "btn ghost small wide", type: "button", onclick: addManual },
      "+ Zeitraum von Hand eintragen"));

  els.otList = h("div");
  els.otCard = h("div", { class: "card" },
    h("div", { class: "sec-title" }, "Überstunden voll um"), els.otList);

  els.noteInput = h("input", {
    type: "text", placeholder: "Notiz zum Tag (optional)", maxlength: "200",
    onchange: e => store.setNote(state.date, e.target.value)
  });
  const noteCard = h("div", { class: "card tight" }, els.noteInput);

  root.replaceChildren(
    typeSeg, h("div", { class: "spacer" }),
    els.stampCard, hero, els.notices, els.spruchCard,
    tlCard, h("div", { class: "card" }, grid),
    segCard, els.otCard, noteCard,
    h("div", { class: "foot" }, "Alle Angaben ohne Gewähr.")
  );
  lastSegSig = "";
}

function cell(k, vNode){
  return h("div", { class: "cell" }, h("div", { class: "k" }, k), vNode);
}

/* ---------- Aktionen ---------- */

function currentPlace(d){
  if (d.runningSeg) return d.runningSeg.place;
  if (pendingPlace) return pendingPlace;
  const last = d.segments[d.segments.length - 1];
  return last ? last.place : state.settings.defaultPlace;
}

function choosePlace(id){
  const d = compute();
  if (d.running) {
    // Laufenden Zeitraum am alten Ort beenden und am neuen fortsetzen.
    store.stampOut(state.date);
    store.stampIn(state.date, id);
    toast("Weiter: " + placeOf(id).label);
  } else {
    pendingPlace = id;
  }
  update();
}

function stamp(){
  const d = compute();
  if (d.running) {
    store.stampOut(state.date);
    toast("Gestoppt um " + nowClock());
  } else {
    if (state.date !== todayKey()) {
      toast("Stempeln geht nur für heute – trag den Zeitraum von Hand ein.");
      return;
    }
    store.stampIn(state.date, currentPlace(d));
    toast("Los geht's: " + nowClock());
  }
  pendingPlace = null;
  update();
}

function addManual(){
  const d = compute();
  const last = d.segments[d.segments.length - 1];
  const start = last && last.end ? last.end : (d.firstStart == null ? "08:00" : nowClock());
  store.addSegment(state.date, { start: start, end: start, place: currentPlace(d) });
  update();
  // Fokus auf das neue Startfeld, damit man direkt tippen kann.
  const inputs = els.segList.querySelectorAll('input[data-f="start"]');
  const el = inputs[inputs.length - 1];
  if (el) { el.focus(); el.select && el.select(); }
}

/* ---------- Zeitraumliste ---------- */

function renderSegments(d){
  const sig = JSON.stringify(d.segments.map(s => [s.start, s.end, s.place]));
  const focusInside = els.segList.contains(document.activeElement);
  if (sig === lastSegSig) { updateDurations(d); return; }
  if (focusInside) return;                       // nicht neu bauen, waehrend getippt wird
  lastSegSig = sig;

  if (!d.segments.length) {
    fill(els.segList, h("div", { class: "muted", style: "font-size:13.5px;padding:4px 0" },
      "Noch nichts erfasst."));
    return;
  }

  const raw = store.getDay(state.date);
  const nodes = [];
  d.segments.forEach((s, i) => {
    // Index im gespeicherten Datensatz suchen - die Anzeige ist sortiert.
    const idx = raw.segments.findIndex(x => x.start === s.start && (x.end || null) === s.end && !x.__used);
    const realIdx = idx >= 0 ? idx : i;
    if (raw.segments[realIdx]) raw.segments[realIdx].__used = true;

    if (i > 0) {
      const prev = d.segments[i - 1];
      if (prev.end) {
        const gap = (toMin(s.start) || 0) - ((toMin(prev.start) || 0) + prev.min);
        if (gap > 0) nodes.push(h("div", { class: "gap-row" },
          h("span", { class: "line" }), h("span", null, "Pause " + fmtShort(gap)), h("span", { class: "line" })));
      }
    }

    nodes.push(h("div", { class: "seg-row" + (s.running ? " running" : "") },
      h("button", {
        class: "ic", type: "button", title: "Ort wechseln", style: "border:none;background:none;cursor:pointer",
        onclick: () => cyclePlace(realIdx, s.place)
      }, placeOf(s.place).icon),
      h("div", { class: "times" },
        h("input", { type: "time", value: s.start, "data-f": "start", "aria-label": "Beginn",
          onchange: e => editSeg(realIdx, "start", e.target.value) }),
        h("span", { class: "to" }, "–"),
        s.running
          ? h("button", { class: "btn small ghost", type: "button", style: "flex:none",
              onclick: () => { store.stampOut(state.date); update(); } }, "läuft…")
          : h("input", { type: "time", value: s.end || "", "data-f": "end", "aria-label": "Ende",
              onchange: e => editSeg(realIdx, "end", e.target.value) })),
      h("div", { class: "dur", "data-dur": String(i) }, fmtShort(s.min)),
      h("button", { class: "del", type: "button", "aria-label": "Zeitraum löschen",
        onclick: () => { store.removeSegment(state.date, realIdx); update(); } }, "×")));
  });
  if (raw) raw.segments.forEach(x => { delete x.__used; });
  fill(els.segList, nodes);
}

function updateDurations(d){
  d.segments.forEach((s, i) => {
    const el = els.segList.querySelector('[data-dur="' + i + '"]');
    if (el) el.textContent = fmtShort(s.min);
  });
}

function editSeg(idx, field, value){
  if (field === "end" && !value) value = null;
  store.updateSegment(state.date, idx, { [field]: value });
  lastSegSig = "";
  update();
}
function cyclePlace(idx, cur){
  const i = PLACES.findIndex(p => p.id === cur);
  store.updateSegment(state.date, idx, { place: PLACES[(i + 1) % PLACES.length].id });
  lastSegSig = "";
  update();
}

/* ---------- Zeitstrahl ---------- */

function renderTrack(d){
  if (d.firstStart == null) { fill(els.track); return; }
  const now = nowMin();
  const spanEnd = Math.max(
    d.plannedEnd != null ? d.plannedEnd + 120 : d.firstStart + d.effTarget + 120,
    d.lastEnd + 30,
    d.isToday ? now + 15 : 0);
  const span = Math.max(60, spanEnd - d.firstStart);
  const pct = m => Math.max(0, Math.min(100, (m - d.firstStart) / span * 100));

  const nodes = [];
  for (const s of d.segments) {
    const st = Math.max(d.firstStart, toMin(s.start) || 0);
    const overtimeStart = d.plannedEnd;
    const blk = h("div", { class: "blk " + s.place });
    blk.style.left = pct(st) + "%";
    blk.style.width = Math.max(0.6, pct(st + s.min) - pct(st)) + "%";
    blk.title = s.start + "–" + (s.end || "läuft") + " · " + placeOf(s.place).label;
    nodes.push(blk);
    if (overtimeStart != null && st + s.min > overtimeStart) {
      const ot = h("div", { class: "blk ot" });
      const a = Math.max(st, overtimeStart);
      ot.style.left = pct(a) + "%";
      ot.style.width = Math.max(0.6, pct(st + s.min) - pct(a)) + "%";
      nodes.push(ot);
    }
  }
  if (d.plannedEnd != null) {
    const mk = h("div", { class: "mark" }, h("span", null, fmtClock(d.plannedEnd)));
    mk.style.left = pct(d.plannedEnd) + "%";
    nodes.push(mk);
  }
  if (d.isToday && now >= d.firstStart) {
    const nl = h("div", { class: "nowline" });
    nl.style.left = pct(now) + "%";
    nodes.push(nl);
  }
  fill(els.track, nodes);
  els.tlStart.textContent = "Start " + fmtClock(d.firstStart);
  els.tlEnd.textContent = d.plannedEnd != null ? "Feierabend → Überstunden" : "";
}

/* ---------- Aktualisieren ---------- */

function compute(){
  return computeDay(state.date, store.getDay(state.date), state.settings, {});
}

export function update(){
  const d = compute();
  const t = dayType(d.type);

  for (const b of els.typeSeg.children) {
    b.setAttribute("aria-pressed", b.dataset.type === d.type ? "true" : "false");
  }
  const place = currentPlace(d);
  for (const b of els.placeChoice.children) {
    b.setAttribute("aria-pressed", b.dataset.place === place ? "true" : "false");
  }

  /* Stempelknopf */
  const isToday = state.date === todayKey();
  if (d.running) {
    els.stampBtn.textContent = "■  Stoppen · seit " + d.runningSeg.start;
    els.stampBtn.classList.add("stop");
  } else {
    els.stampBtn.textContent = (d.segments.length ? "▶  Weiter" : "▶  Kommen")
      + " · " + placeOf(place).label;
    els.stampBtn.classList.remove("stop");
  }
  els.stampCard.hidden = !isToday;

  /* Kopfbereich */
  if (d.effTarget <= 0 && t.credit >= 1) {
    els.heroLbl.textContent = t.label;
    els.heroBig.textContent = t.id === "sick" ? "🤒" : t.id === "holiday" ? "📅" : "🏖️";
    els.heroSub.textContent = d.target > 0
      ? fmtShort(d.credited) + " gutgeschrieben" : "Kein Soll an diesem Tag";
  } else if (d.plannedEnd != null) {
    els.heroLbl.textContent = "Feierabend um";
    els.heroBig.textContent = fmtClock(d.plannedEnd);
    els.heroSub.textContent = fmtShort(d.effTarget) + " Arbeit + "
      + Math.round(d.plannedEnd - d.firstStart - d.effTarget) + " Min. Pause";
  } else if (d.target > 0) {
    els.heroLbl.textContent = "Tagessoll";
    els.heroBig.textContent = fmtShort(d.target);
    els.heroSub.textContent = "Noch nichts gestempelt";
  } else {
    els.heroLbl.textContent = t.label;
    els.heroBig.textContent = d.net > 0 ? fmtShort(d.net) : "—";
    els.heroSub.textContent = "Kein Soll an diesem Tag";
  }

  /* Statuszeile */
  els.pill.className = "pill";
  if (d.running) {
    els.pill.classList.add("live");
    if (d.remaining != null && d.remaining > 0) {
      els.pillTxt.textContent = "Noch " + fmtDur(d.remaining) + " bis Feierabend";
    } else if (d.effTarget > 0) {
      els.pill.classList.add("over");
      els.pillTxt.textContent = "Feierabend erreicht · +" + fmtDur(d.overtime);
    } else {
      els.pillTxt.textContent = "Läuft seit " + d.runningSeg.start;
    }
  } else if (!d.segments.length) {
    els.pill.classList.add("idle");
    els.pillTxt.textContent = d.target > 0 ? "Noch nicht gestempelt" : t.label;
  } else if (d.net >= d.effTarget && d.effTarget > 0) {
    els.pill.classList.add("over");
    els.pillTxt.textContent = "Soll erfüllt · " + fmtSigned(d.saldo);
  } else {
    els.pill.classList.add("idle");
    els.pillTxt.textContent = "Pausiert · noch " + fmtDur(d.effTarget - d.net);
  }

  /* Kennzahlen */
  els.vPresence.textContent = d.presence > 0 ? fmtShort(d.presence) : "—";
  els.vNet.textContent      = d.segments.length ? fmtShort(d.net) : "—";
  els.vBreak.textContent    = d.presence > 0
    ? fmtShort(d.breaksTaken) + (d.breakDeducted > 0 ? "  +" + Math.round(d.breakDeducted) : "")
    : "—";
  els.vBreak.title = d.breakDeducted > 0
    ? Math.round(d.breakDeducted) + " Min. gesetzliche Pause zusätzlich abgezogen" : "";
  els.vRemain.textContent   = d.remaining != null && d.remaining > 0 ? fmtShort(d.remaining)
                            : d.plannedEnd != null ? "erledigt" : "—";
  els.vSaldo.textContent    = fmtSigned(d.saldo);
  els.vSaldo.className      = "v num " + (d.saldo >= 0 ? "pos" : "neg");

  const account = store.accountBalance(todayKey(), state.date) + d.saldo;
  els.vAccount.textContent = fmtSigned(account);
  els.vAccount.className   = "v num " + (account >= 0 ? "pos" : "neg");

  /* Zeitstrahl, Zeitraeume, Ueberstundenliste */
  renderTrack(d);
  renderSegments(d);
  renderOvertime(d);

  /* Hinweise */
  fill(els.notices, d.warnings.map(w =>
    h("div", { class: "notice " + w.level },
      h("span", { class: "ico" }, w.icon),
      h("span", { html: w.text }))));

  /* Notiz */
  const raw = store.getDay(state.date);
  if (document.activeElement !== els.noteInput) els.noteInput.value = (raw && raw.note) || "";

  /* Spruch + Konfetti */
  if (state.settings.sprueche) {
    els.spruchCard.hidden = false;
    els.spruchTxt.textContent = spruchFor(phaseOf(d, isToday));
  } else {
    els.spruchCard.hidden = true;
  }
  const done = d.effTarget > 0 && d.net >= d.effTarget;
  if (wasDone === null || !isToday) wasDone = done;
  else if (done && !wasDone && state.settings.confetti) celebrate();
  wasDone = done;
}

function renderOvertime(d){
  if (d.plannedEnd == null || d.effTarget <= 0) { els.otCard.hidden = true; return; }
  els.otCard.hidden = false;
  const nodes = [];
  for (let k = 1; k <= 4; k++) {
    const hit = d.overtime >= k * 60;
    nodes.push(h("div", { class: "seg-row", style: "cursor:default" },
      h("div", { class: "times", style: "font-size:13.5px;font-weight:600" },
        k + " Überstunde" + (k > 1 ? "n" : "") + " voll"),
      h("div", { class: "dur", style: hit ? "color:var(--petrol-ink)" : "" },
        fmtClock(d.plannedEnd + k * 60) + (hit ? " ✓" : ""))));
  }
  fill(els.otList, nodes);
}

/* ---------- Schnittstelle nach aussen ---------- */

export default {
  id: "day",
  mount(container){ root = container; pendingPlace = null; wasDone = null; build(); update(); },
  update: update,
  title(){
    const k = state.date;
    if (k === todayKey()) return "Heute";
    if (k === addDays(todayKey(), -1)) return "Gestern";
    return weekdayName(k);
  },
  subtitle(){ return fmtDateLong(state.date).replace(/^[^,]+, /, ""); },
  nav(dir){ state.date = addDays(state.date, dir); lastSegSig = ""; wasDone = null; },
  ticks: true
};
