/* Zustand und Speicherung. Alles liegt ausschliesslich im localStorage
   dieses Geraets - es gibt keinen Server und keine Uebertragung. */

import { todayKey, nowClock, keyOf, isValidKey, addDays, fmtDate, weekdayName,
         fmtSignedPlain, toDecimalHours, fmtClock } from "./time.js";
import { computeDay, sumDays, dayType, defaultType, DAY_TYPES, PLACES } from "./rules.js";

const KEY = "zeiterfassung.v2";
const LEGACY_KEY = "arbeitszeit.v1";      // Schluessel der Vorgaengerversion

export const DEFAULTS = {
  weeklyHours: 35,
  workdays: [1, 2, 3, 4, 5],
  dailyOverrides: {},
  breakMode: "gaps",            // "gaps" = Pause ist die Luecke, "flat" = Pauschale
  flatBreak: 45,
  enforceLegalBreaks: true,
  earliestStart: "06:00",       // Firmenregel: davor gestempelte Zeit zaehlt nicht
  latestEnd: "",
  bundesland: "NW",
  defaultPlace: "firma",
  carryOver: 0,                 // Startsaldo des Zeitkontos in Minuten
  carryOverDate: "",            // ab diesem Tag wird gezaehlt
  vacationPerYear: 30,
  sprueche: true,
  confetti: true,
  theme: "auto"
};

export const state = {
  settings: Object.assign({}, DEFAULTS),
  days: {},
  view: "day",
  date: todayKey(),
  migratedFrom: null
};

/* ---------- Laden & Speichern ---------- */

function sanitizeSettings(s){
  const out = Object.assign({}, DEFAULTS, s || {});
  out.weeklyHours = Math.min(60, Math.max(0, +out.weeklyHours || 0));
  out.workdays = Array.isArray(out.workdays)
    ? out.workdays.map(Number).filter(n => n >= 0 && n <= 6).sort()
    : DEFAULTS.workdays.slice();
  out.flatBreak = Math.min(240, Math.max(0, +out.flatBreak || 0));
  out.carryOver = Math.round(+out.carryOver || 0);
  out.vacationPerYear = Math.max(0, +out.vacationPerYear || 0);
  out.dailyOverrides = out.dailyOverrides && typeof out.dailyOverrides === "object" ? out.dailyOverrides : {};
  return out;
}

function sanitizeDays(days){
  const out = {};
  if (!days || typeof days !== "object") return out;
  for (const k of Object.keys(days)) {
    if (!isValidKey(k)) continue;
    const d = days[k] || {};
    const segs = Array.isArray(d.segments) ? d.segments : [];
    out[k] = {
      type: DAY_TYPES.some(t => t.id === d.type) ? d.type : "work",
      note: typeof d.note === "string" ? d.note : "",
      segments: segs
        .filter(s => s && typeof s.start === "string")
        .map(s => ({
          start: s.start,
          end: typeof s.end === "string" && s.end ? s.end : null,
          place: PLACES.some(p => p.id === s.place) ? s.place : "firma",
          note: typeof s.note === "string" ? s.note : ""
        }))
    };
  }
  return out;
}

export function load(){
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(KEY)); } catch (e) { /* blockiert oder kaputt */ }
  if (raw) {
    state.settings = sanitizeSettings(raw.settings);
    state.days = sanitizeDays(raw.days);
    return;
  }
  migrateLegacy();
}

/** Einstellungen aus der alten Version uebernehmen, falls vorhanden. */
function migrateLegacy(){
  let old = null;
  try { old = JSON.parse(localStorage.getItem(LEGACY_KEY)); } catch (e) { return; }
  if (!old) return;
  const soll = parseFloat(old.soll);
  const bf = parseInt(old.bf, 10), lu = parseInt(old.lu, 10);
  const s = Object.assign({}, DEFAULTS);
  if (isFinite(soll) && soll > 0) s.weeklyHours = Math.round(soll * 5 * 100) / 100;
  if (isFinite(bf) || isFinite(lu)) s.flatBreak = (isFinite(bf) ? bf : 0) + (isFinite(lu) ? lu : 0);
  state.settings = sanitizeSettings(s);
  state.migratedFrom = "v1";
  save();
}

let saveTimer = null;
export function save(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(function(){
    try {
      localStorage.setItem(KEY, JSON.stringify({
        version: 2, settings: state.settings, days: state.days
      }));
    } catch (e) { /* z. B. privater Modus - dann bleibt es bei der Sitzung */ }
  }, 120);
}

/* ---------- Benachrichtigung ---------- */

const listeners = new Set();
export function subscribe(fn){ listeners.add(fn); return () => listeners.delete(fn); }
export function emit(){ for (const fn of listeners) fn(); }
let version = 0;
function changed(){ version++; save(); emit(); }

/* ---------- Tage lesen & schreiben ---------- */

export function getDay(key){ return state.days[key] || null; }

function ensureDay(key){
  if (!state.days[key]) state.days[key] = { type: null, segments: [], note: "" };
  if (!state.days[key].type) {
    state.days[key].type = defaultType(key, state.settings);
  }
  return state.days[key];
}

export function setType(key, type){
  const d = ensureDay(key);
  d.type = type;
  changed();
}
export function setNote(key, note){
  ensureDay(key).note = note;
  changed();
}
export function addSegment(key, seg){
  const d = ensureDay(key);
  d.segments.push(Object.assign({ start: nowClock(), end: null, place: state.settings.defaultPlace, note: "" }, seg));
  changed();
}
export function updateSegment(key, index, patch){
  const d = state.days[key];
  if (!d || !d.segments[index]) return;
  Object.assign(d.segments[index], patch);
  changed();
}
export function removeSegment(key, index){
  const d = state.days[key];
  if (!d) return;
  d.segments.splice(index, 1);
  changed();
}
export function clearDay(key){
  delete state.days[key];
  changed();
}

/** Laeuft gerade ein Zeitraum an diesem Tag? */
export function openSegment(key){
  const d = state.days[key];
  if (!d) return -1;
  return d.segments.findIndex(s => !s.end);
}

/** Kommen: neuen Zeitraum starten (ein offener wird vorher geschlossen). */
export function stampIn(key, place){
  const open = openSegment(key);
  if (open >= 0) state.days[key].segments[open].end = nowClock();
  const d = ensureDay(key);
  if (d.type === "off" || d.type === "holiday") { /* Typ bleibt, Arbeit zaehlt als Plus */ }
  d.segments.push({ start: nowClock(), end: null, place: place || state.settings.defaultPlace, note: "" });
  changed();
}
/** Gehen / Pause: offenen Zeitraum schliessen. */
export function stampOut(key){
  const open = openSegment(key);
  if (open < 0) return;
  state.days[key].segments[open].end = nowClock();
  changed();
}

/* ---------- Einstellungen ---------- */

export function setSettings(patch){
  state.settings = sanitizeSettings(Object.assign({}, state.settings, patch));
  changed();
}
export function resetSettings(){
  state.settings = Object.assign({}, DEFAULTS);
  changed();
}

/* ---------- Auswertung ueber viele Tage ---------- */

/** Wertet eine Liste von Tagesschluesseln aus (inkl. Ruhezeit-Kontext). */
export function computeRange(keys){
  return keys.map(k => computeDay(k, state.days[k], state.settings, {
    prevEnd: prevEndOf(k)
  }));
}
function prevEndOf(key){
  const p = state.days[addDays(key, -1)];
  if (!p || !p.segments.length) return null;
  let last = null;
  for (const s of p.segments) {
    if (!s.end) continue;
    const e = s.end.split(":");
    const m = (+e[0]) * 60 + (+e[1]);
    if (last == null || m > last) last = m;
  }
  return last;
}

/** Gesamtsaldo des Zeitkontos bis einschliesslich `until`, ohne `skip`.
    Das Ergebnis wird zwischengespeichert, weil die Tagesansicht im
    Sekundentakt neu zeichnet - der laufende Tag wird dort separat addiert. */
let balCache = { version: -1, until: null, skip: null, value: 0 };
export function accountBalance(until, skip){
  until = until || todayKey();
  skip = skip || null;
  if (balCache.version === version && balCache.until === until && balCache.skip === skip) {
    return balCache.value;
  }
  const from = state.settings.carryOverDate;
  let sum = state.settings.carryOver || 0;
  for (const k of Object.keys(state.days)) {
    if (k > until || k === skip) continue;
    if (from && k < from) continue;
    sum += computeDay(k, state.days[k], state.settings, {}).saldo;
  }
  balCache = { version: version, until: until, skip: skip, value: sum };
  return sum;
}

/** Genommene Urlaubstage eines Jahres. */
export function vacationUsed(year){
  let n = 0;
  for (const k of Object.keys(state.days)) {
    if (k.slice(0, 4) !== String(year)) continue;
    const t = state.days[k].type;
    if (t === "vacation") n += 1;
    else if (t === "half") n += 0.5;
  }
  return n;
}

/* ---------- Export & Import ---------- */

export function exportJSON(){
  return JSON.stringify({ version: 2, exported: new Date().toISOString(),
                          settings: state.settings, days: state.days }, null, 2);
}

export function importJSON(text, mode){
  const data = JSON.parse(text);
  if (!data || typeof data !== "object") throw new Error("Datei nicht lesbar.");
  const days = sanitizeDays(data.days);
  if (mode === "replace") {
    state.days = days;
    if (data.settings) state.settings = sanitizeSettings(data.settings);
  } else {
    Object.assign(state.days, days);      // vorhandene Tage werden ueberschrieben
  }
  changed();
  return Object.keys(days).length;
}

/** CSV mit Semikolon - oeffnet sich in Excel/Numbers direkt richtig. */
export function exportCSV(keys){
  const head = ["Datum","Wochentag","Typ","Beginn","Ende","Zeiträume","Orte",
                "Anwesend","Pause","Gearbeitet (h)","Ist (h)","Ist (dez.)",
                "Soll (h)","Saldo (h)","Notiz"];
  const rows = [head.join(";")];
  for (const k of keys) {
    const d = computeDay(k, state.days[k], state.settings, {});
    if (!d.tracked && d.target === 0) continue;
    const raw = state.days[k];
    const spans = d.segments.map(s => s.start + "-" + (s.end || "offen")).join(" ");
    const orts = PLACES.filter(p => d.byPlace[p.id] > 0).map(p => p.label).join(" + ");
    rows.push([
      fmtDate(k),
      weekdayName(k, true),
      dayType(d.type).label,
      d.firstStart != null ? fmtClock(d.firstStart) : "",
      d.lastEnd != null ? fmtClock(d.lastEnd) : "",
      spans, orts,
      hm(d.presence), hm(d.breaksTaken), hm(d.net),
      hm(d.worked), toDecimalHours(d.worked),
      hm(d.target), fmtSignedPlain(d.saldo),
      (raw && raw.note || "").replace(/[;\r\n]/g, " ")
    ].join(";"));
  }
  return "﻿" + rows.join("\r\n");     // BOM, damit Excel Umlaute erkennt
}
function hm(min){
  const m = Math.max(0, Math.round(min));
  return Math.floor(m / 60) + ":" + (m % 60 < 10 ? "0" : "") + (m % 60);
}

export { computeDay, sumDays };
