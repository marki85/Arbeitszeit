/* Fachlogik: Tagessoll, Pausen, gesetzliche Grenzen, Tagesauswertung.
   Alles rein rechnend - kein DOM, kein Speicher. Zeiten in Minuten. */

import { toMin, nowMin, todayKey, weekday, MIN_PER_DAY } from "./time.js";
import { holidayName } from "./feiertage.js";

/* Arbeitszeitgesetz (ArbZG), vereinfacht. */
export const ARBZG = {
  maxDaily: 10 * 60,      // § 3: hoechstens 10 Std. werktaeglich
  break6: 30,             // § 4: > 6 Std. -> 30 Min. Pause
  break9: 45,             // § 4: > 9 Std. -> 45 Min. Pause
  minRest: 11 * 60        // § 5: 11 Std. Ruhezeit zwischen zwei Arbeitstagen
};

export const PLACES = [
  { id: "firma",     label: "Firma",      icon: "🏢" },
  { id: "home",      label: "Homeoffice", icon: "🏠" },
  { id: "unterwegs", label: "Unterwegs",  icon: "🚗" }
];
export function placeOf(id){
  return PLACES.find(p => p.id === id) || PLACES[0];
}

/* Tagestypen. `credit` sagt, welcher Anteil des Tagessolls gutgeschrieben wird. */
export const DAY_TYPES = [
  { id: "work",     label: "Arbeitstag",   short: "Arbeit",   credit: 0,   counts: true  },
  { id: "vacation", label: "Urlaub",       short: "Urlaub",   credit: 1,   counts: true  },
  { id: "half",     label: "Halber Urlaub",short: "½ Urlaub", credit: 0.5, counts: true  },
  { id: "sick",     label: "Krank",        short: "Krank",    credit: 1,   counts: true  },
  { id: "holiday",  label: "Feiertag",     short: "Feiertag", credit: 1,   counts: true  },
  { id: "comp",     label: "Gleittag",     short: "Gleittag", credit: 0,   counts: true  },
  { id: "off",      label: "Frei",         short: "Frei",     credit: 0,   counts: false }
];
export function dayType(id){
  return DAY_TYPES.find(t => t.id === id) || DAY_TYPES[0];
}

/* ---------- Tagessoll ---------- */

/** Soll je Wochentag in Minuten, als Objekt { 0..6: min }.
    Die Summe ueber die Arbeitstage ergibt exakt die Wochenstunden. */
export function targetsPerWeekday(settings){
  const out = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };
  const days = (settings.workdays || []).slice().sort();
  if (!days.length) return out;
  const weekly = Math.round((settings.weeklyHours || 0) * 60);
  const base = Math.floor(weekly / days.length);
  let rest = weekly - base * days.length;
  for (const wd of days) {
    // Restminuten auf die ersten Tage verteilen, damit die Woche exakt aufgeht.
    out[wd] = base + (rest-- > 0 ? 1 : 0);
  }
  for (const wd of days) {
    const ov = settings.dailyOverrides && settings.dailyOverrides[wd];
    if (ov != null && ov !== "") out[wd] = Math.round(+ov * 60);
  }
  return out;
}

/** Soll fuer einen konkreten Tag - unabhaengig vom Tagestyp. */
export function targetForDay(key, settings){
  return targetsPerWeekday(settings)[weekday(key)] || 0;
}

/** Vorgeschlagener Tagestyp, wenn nichts erfasst ist. */
export function defaultType(key, settings){
  if (holidayName(key, settings.bundesland)) return "holiday";
  return (settings.workdays || []).indexOf(weekday(key)) >= 0 ? "work" : "off";
}

/* ---------- Pausen ---------- */

/** Gesetzlich vorgeschriebene Mindestpause fuer eine Nettoarbeitszeit. */
export function requiredBreak(net){
  if (net > 9 * 60) return ARBZG.break9;
  if (net > 6 * 60) return ARBZG.break6;
  return 0;
}

/** Zieht fehlende Pausenzeit von der Bruttozeit ab.
    `opts.company` ist die betrieblich angesetzte Pause, die immer mindestens
    abgezogen wird (Fruehstueck + Mittag); `opts.legal` schaltet die
    gesetzlichen Mindestpausen dazu. An den Schwellen (6 h / 9 h) wird genau
    auf die Schwelle gekappt - sonst waere das Ergebnis widerspruechlich:
    mehr Abzug hiesse weniger Pausenpflicht und umgekehrt.
    Gibt { net, deducted } zurueck. */
export function applyBreakRules(gross, taken, opts){
  opts = opts || {};
  const floor = Math.max(0, opts.company || 0);
  const cut = req => gross - Math.max(0, Math.max(req, floor) - taken);
  const done = net => ({ net: Math.max(0, net), deducted: gross - Math.max(0, net) });

  if (!opts.legal) return done(cut(0));

  let net = cut(ARBZG.break9);
  if (net > 9 * 60) return done(net);
  net = cut(ARBZG.break6);
  if (net > 9 * 60) return done(9 * 60);
  if (net > 6 * 60) return done(net);
  net = cut(0);
  if (net > 6 * 60) return done(6 * 60);
  return done(net);
}

/** Betrieblich angesetzte Pause in Minuten: Fruehstueck + Mittag. */
export function companyBreak(settings){
  return Math.max(0, (+settings.breakfast || 0) + (+settings.lunch || 0));
}

/* ---------- Zeitraeume ---------- */

/** Dauer eines Zeitraums in Minuten.
    `now` ist die aktuelle Uhrzeit fuer noch offene Zeitraeume; null bedeutet,
    dass der Tag nicht der heutige ist - ein offener Zeitraum zaehlt dann 0.
    Ein ausdruecklich eingetragenes Ende vor dem Beginn gilt als Nachtschicht. */
export function segMinutes(seg, settings, now){
  let s = toMin(seg.start);
  if (s == null) return 0;
  const early = settings.earliestStart ? toMin(settings.earliestStart) : null;
  if (early != null && s < early) s = early;

  let e;
  if (seg.end == null || seg.end === "") {
    if (now == null) return 0;
    e = now;
    if (e < s) return 0;               // Beginn liegt noch in der Zukunft
  } else {
    e = toMin(seg.end);
    if (e == null) return 0;
    if (e < s) e += MIN_PER_DAY;       // ausdrueckliche Nachtschicht
  }
  const late = settings.latestEnd ? toMin(settings.latestEnd) : null;
  if (late != null && e > late && e <= MIN_PER_DAY) e = late;

  return Math.max(0, e - s);
}

/** Zeitraeume nach Startzeit sortieren (offener Zeitraum bleibt hinten). */
export function sortSegments(segments){
  return segments.slice().sort((a, b) => {
    const x = toMin(a.start), y = toMin(b.start);
    if (x == null) return 1;
    if (y == null) return -1;
    return x - y;
  });
}

/** Ueberschneiden sich zwei Zeitraeume? */
function overlaps(a, b, settings, now){
  const as = toMin(a.start), bs = toMin(b.start);
  if (as == null || bs == null) return false;
  const ae = as + segMinutes(a, settings, now), be = bs + segMinutes(b, settings, now);
  return as < be && bs < ae;
}

/* ---------- Tagesauswertung ---------- */

/**
 * Wertet einen Tag vollstaendig aus.
 * @param key    "YYYY-MM-DD"
 * @param day    gespeicherter Datensatz oder null
 * @param settings
 * @param ctx    { now, prevEnd }  now = Minuten (nur fuer den laufenden Tag noetig),
 *                                 prevEnd = letztes Ende des Vortags (fuer die Ruhezeit)
 */
export function computeDay(key, day, settings, ctx){
  ctx = ctx || {};
  const isToday = key === todayKey();
  const now = ctx.now != null ? ctx.now : nowMin();

  const typeId = (day && day.type) || defaultType(key, settings);
  const type = dayType(typeId);
  const holiday = holidayName(key, settings.bundesland);

  const segments = sortSegments((day && day.segments) || [])
    .map(seg => {
      const running = seg.end == null || seg.end === "";
      return {
        start: seg.start,
        end: seg.end || null,
        place: seg.place || "firma",
        note: seg.note || "",
        running: running,
        min: segMinutes(seg, settings, isToday ? now : null)
      };
    });

  const target = type.counts ? targetForDay(key, settings) : 0;
  const credited = Math.round(target * type.credit);
  const effTarget = Math.max(0, target - credited);   // was noch zu arbeiten ist

  /* Anwesenheit: erster Start bis letztes Ende. */
  const early = settings.earliestStart ? toMin(settings.earliestStart) : null;
  let firstStart = null, lastEnd = null, clampedStart = false;
  for (const s of segments) {
    let st = toMin(s.start);
    if (st == null) continue;
    if (early != null && st < early) { clampedStart = true; st = early; }
    if (firstStart == null || st < firstStart) firstStart = st;
    const en = st + s.min;
    if (lastEnd == null || en > lastEnd) lastEnd = en;
  }
  const presence = firstStart == null ? 0 : Math.max(0, lastEnd - firstStart);

  /* ---- Brutto / Pause / Netto ----
     gross   = Summe der gestempelten Zeitraeume
     gaps    = Zeit zwischen den Zeitraeumen (Fahrt, selbst gestempelte Pause)
     deducted= zusaetzlich abgezogene Pause
     net     = tatsaechlich angerechnete Arbeitszeit */
  const gross = segments.reduce((a, s) => a + s.min, 0);
  const firmBreak = companyBreak(settings);
  const gaps = Math.max(0, presence - gross);
  let net = gross, deducted = 0;

  if (gross > 0) {
    // "add": die Betriebspause geht zusaetzlich zu den Luecken ab.
    // "min" (Standard): es wird sichergestellt, dass ueberhaupt so viel Pause
    //        zusammenkommt - eine laengere Luecke deckt sie also bereits ab.
    const floor = settings.breakMode === "add" ? gaps + firmBreak : firmBreak;
    const r = applyBreakRules(gross, gaps, {
      company: floor, legal: !!settings.enforceLegalBreaks
    });
    deducted = r.deducted;
    net = r.net;
  }
  // Angezeigte Pause: alles zwischen erstem und letztem Stempel, was nicht
  // als Arbeit zaehlt - also Luecken plus abgezogene Pause.
  const breaksTaken = Math.max(0, presence - net);

  const worked = credited + net;
  const saldo = worked - target;
  const running = segments.some(s => s.running);
  const runningSeg = segments.find(s => s.running) || null;

  /* Prognose Feierabend: erster Start + noch zu leistende Arbeit + Pause */
  let plannedEnd = null, remaining = null;
  if (firstStart != null && effTarget > 0) {
    // Pause, die bis zum Feierabend zusammenkommt.
    const legalAtTarget = settings.enforceLegalBreaks ? requiredBreak(effTarget) : 0;
    const plannedBreak = settings.breakMode === "add"
      ? gaps + Math.max(firmBreak, legalAtTarget)
      : Math.max(gaps, firmBreak, legalAtTarget);
    plannedEnd = firstStart + effTarget + plannedBreak;
    remaining = plannedEnd - now;
  }

  /* Summen je Ort */
  const byPlace = {};
  for (const p of PLACES) byPlace[p.id] = 0;
  for (const s of segments) byPlace[s.place] = (byPlace[s.place] || 0) + s.min;

  /* ---- Hinweise ---- */
  const warnings = [];

  if (clampedStart) {
    warnings.push({ level: "info", icon: "🕕",
      text: "Zeiten vor <strong>" + settings.earliestStart + "</strong> werden nicht anerkannt – gerechnet wird ab " + settings.earliestStart + "." });
  }
  if (holiday && typeId !== "holiday") {
    warnings.push({ level: "info", icon: "📅",
      text: "Dieser Tag ist ein Feiertag (<strong>" + holiday + "</strong>)." });
  }
  if (net >= ARBZG.maxDaily) {
    warnings.push({ level: "stop", icon: "🛑",
      text: "<strong>10 Stunden erreicht.</strong> Mehr lässt das Arbeitszeitgesetz an einem Werktag nicht zu – Feierabend." });
  } else if (running && net >= ARBZG.maxDaily - 30) {
    warnings.push({ level: "warn", icon: "⏳",
      text: "In Kürze ist die 10-Stunden-Grenze erreicht. Danach ist Schluss." });
  }
  if (deducted > 0 && settings.breakMode === "gaps") {
    warnings.push({ level: "warn", icon: "☕",
      text: "Gesetzliche Mindestpause nicht erreicht – es werden <strong>"
          + Math.round(deducted) + " Min.</strong> abgezogen." });
  }
  if (ctx.prevEnd != null && firstStart != null) {
    const rest = firstStart + MIN_PER_DAY - ctx.prevEnd;
    if (rest < ARBZG.minRest) {
      warnings.push({ level: "warn", icon: "😴",
        text: "Nur <strong>" + Math.floor(rest / 60) + ":" + (rest % 60 < 10 ? "0" : "") + Math.round(rest % 60)
            + " h</strong> Ruhezeit seit gestern – vorgeschrieben sind 11 Stunden." });
    }
  }
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      if (overlaps(segments[i], segments[j], settings, isToday ? now : null)) {
        warnings.push({ level: "warn", icon: "⚠️", text: "Zwei Zeiträume überschneiden sich." });
        i = segments.length; break;
      }
    }
  }
  if (running && !isToday) {
    warnings.push({ level: "warn", icon: "⚠️",
      text: "Dieser Tag hat einen <strong>offenen Zeitraum</strong> – bitte das Ende nachtragen." });
  }

  return {
    key: key, type: typeId, typeLabel: type.label, holiday: holiday,
    segments: segments, target: target, credited: credited, effTarget: effTarget,
    gross: gross, net: net, worked: worked, presence: presence,
    breaksTaken: breaksTaken, breakDeducted: deducted, gaps: gaps,
    saldo: saldo, firstStart: firstStart, lastEnd: lastEnd,
    running: running, runningSeg: runningSeg,
    plannedEnd: plannedEnd, remaining: remaining,
    overtime: Math.max(0, net - effTarget),
    byPlace: byPlace, isToday: isToday,
    tracked: segments.length > 0 || (day && day.type ? true : false),
    warnings: warnings
  };
}

/** Summiert ausgewertete Tage.
    Arbeitstage ganz ohne Eintrag bleiben bei Soll, Ist und Saldo aussen vor -
    sonst wuerde die laufende Woche mit einem dicken Minus dastehen, nur weil
    Donnerstag und Freitag noch nicht da sind. Sie werden separat gezaehlt.
    `contract` nennt trotzdem das volle Soll des Zeitraums. */
export function sumDays(list){
  const acc = { target: 0, contract: 0, worked: 0, net: 0, presence: 0, breaks: 0, saldo: 0,
                vacation: 0, sick: 0, holidays: 0, comp: 0, untracked: 0, tracked: 0,
                byPlace: {} };
  for (const p of PLACES) acc.byPlace[p.id] = 0;
  for (const d of list) {
    acc.contract += d.target;
    if (d.type === "work" && d.target > 0 && !d.tracked) { acc.untracked += 1; continue; }
    if (d.target > 0 || d.worked > 0) acc.tracked += 1;
    acc.target += d.target; acc.worked += d.worked; acc.net += d.net;
    acc.presence += d.presence; acc.breaks += d.breaksTaken; acc.saldo += d.saldo;
    if (d.type === "vacation") acc.vacation += 1;
    if (d.type === "half") acc.vacation += 0.5;
    if (d.type === "sick") acc.sick += 1;
    if (d.type === "holiday") acc.holidays += 1;
    if (d.type === "comp") acc.comp += 1;
    for (const p of PLACES) acc.byPlace[p.id] += d.byPlace[p.id] || 0;
  }
  return acc;
}
