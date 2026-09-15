/* Zeit- und Datumshilfen.
   Konvention:
   - Uhrzeiten sind Minuten seit Mitternacht (Zahl), z. B. 08:30 -> 510
   - Tage sind Schluessel im Format "YYYY-MM-DD" (lokale Zeitzone, nie UTC) */

export const MIN_PER_DAY = 1440;
const WD_LONG = ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"];
const WD_SHORT = ["So","Mo","Di","Mi","Do","Fr","Sa"];
const MONTHS = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

export function pad2(n){ return (n < 10 ? "0" : "") + n; }

/* ---------- Tagesschluessel ---------- */

export function keyOf(date){
  return date.getFullYear() + "-" + pad2(date.getMonth() + 1) + "-" + pad2(date.getDate());
}
export function todayKey(){ return keyOf(new Date()); }

export function parseKey(key){
  const p = String(key).split("-");
  return new Date(+p[0], +p[1] - 1, +p[2]);
}
export function isValidKey(key){
  return /^\d{4}-\d{2}-\d{2}$/.test(String(key)) && keyOf(parseKey(key)) === key;
}
export function addDays(key, n){
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return keyOf(d);
}
export function addMonths(key, n){
  const d = parseKey(key);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  // Auf den letzten gueltigen Tag klemmen (31.01. + 1 Monat -> 28.02.)
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return keyOf(d);
}
export function weekday(key){ return parseKey(key).getDay(); }      // 0 = Sonntag
export function isWeekend(key){ const w = weekday(key); return w === 0 || w === 6; }
export function daysBetween(a, b){
  return Math.round((parseKey(b) - parseKey(a)) / 86400000);
}

/* ---------- Wochen & Monate ---------- */

/** Montag der Woche, in der `key` liegt. */
export function startOfWeek(key){
  const d = parseKey(key);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return keyOf(d);
}
export function weekDays(key){
  const mo = startOfWeek(key);
  const out = [];
  for (let i = 0; i < 7; i++) out.push(addDays(mo, i));
  return out;
}
/** ISO-8601-Kalenderwoche. */
export function isoWeek(key){
  const d = parseKey(key);
  // Auf den Donnerstag derselben Woche schieben - der bestimmt das ISO-Jahr.
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const diff = (d - week1) / 86400000;
  const week = 1 + Math.round((diff - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return { year: d.getFullYear(), week: week };
}
export function startOfMonth(key){ return key.slice(0, 8) + "01"; }
export function monthDays(key){
  const d = parseKey(key);
  const n = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const first = startOfMonth(key);
  const out = [];
  for (let i = 0; i < n; i++) out.push(addDays(first, i));
  return out;
}

/* ---------- Uhrzeiten ---------- */

/** "08:30" -> 510. Ungueltiges -> null. */
export function toMin(t){
  if (t == null || t === "") return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(t).trim());
  if (!m) return null;
  const h = +m[1], mm = +m[2];
  if (h > 23 || mm > 59) return null;
  return h * 60 + mm;
}
/** 510 -> "08:30". Werte ausserhalb 0..1439 werden umgebrochen. */
export function fmtClock(min){
  let m = Math.round(min);
  m = ((m % MIN_PER_DAY) + MIN_PER_DAY) % MIN_PER_DAY;
  return pad2(Math.floor(m / 60)) + ":" + pad2(m % 60);
}
/** Minuten seit Mitternacht fuer "jetzt", inkl. Sekundenbruchteil. */
export function nowMin(d){
  d = d || new Date();
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
}
/** Aktuelle Uhrzeit als "HH:MM". */
export function nowClock(){
  const d = new Date();
  return pad2(d.getHours()) + ":" + pad2(d.getMinutes());
}

/* ---------- Dauern ---------- */

/** 425 -> "7 Std. 05 Min." */
export function fmtDur(min){
  let m = Math.max(0, Math.round(min));
  return Math.floor(m / 60) + " Std. " + pad2(m % 60) + " Min.";
}
/** 425 -> "7:05 h" */
export function fmtShort(min){
  let m = Math.max(0, Math.round(min));
  return Math.floor(m / 60) + ":" + pad2(m % 60) + " h";
}
/** -75 -> "âˆ’1:15", +75 -> "+1:15", 0 -> "Â±0:00" */
export function fmtSigned(min){
  const m = Math.round(min);
  const sign = m > 0 ? "+" : m < 0 ? "−" : "±";
  const a = Math.abs(m);
  return sign + Math.floor(a / 60) + ":" + pad2(a % 60);
}
/** Vorzeichenbehaftet, maschinenlesbar fuer Export: -75 -> "-1:15" */
export function fmtSignedPlain(min){
  const m = Math.round(min);
  const a = Math.abs(m);
  return (m < 0 ? "-" : "") + Math.floor(a / 60) + ":" + pad2(a % 60);
}
/** Minuten -> Dezimalstunden mit Komma, z. B. 425 -> "7,08" */
export function toDecimalHours(min){
  return (Math.round(min / 60 * 100) / 100).toFixed(2).replace(".", ",");
}

/* ---------- Zahlen ---------- */

/** 7 -> "7", 7.5 -> "7,5", 10 -> "10" (keine unnoetigen Nullen). */
export function fmtNum(n){
  if (!isFinite(n)) return "0";
  let s = (Math.round(n * 100) / 100).toFixed(2);
  if (s.indexOf(".") >= 0) s = s.replace(/0+$/, "").replace(/\.$/, "");
  return s.replace(".", ",");
}

/* ---------- Anzeigenamen ---------- */

export function weekdayName(key, short){
  const w = weekday(key);
  return short ? WD_SHORT[w] : WD_LONG[w];
}
export function monthName(key){ return MONTHS[parseKey(key).getMonth()]; }

/** "2026-09-15" -> "15.09.2026" */
export function fmtDate(key){
  const p = key.split("-");
  return p[2] + "." + p[1] + "." + p[0];
}
/** "2026-09-15" -> "Mo, 15.09." */
export function fmtDateShort(key){
  const p = key.split("-");
  return weekdayName(key, true) + ", " + p[2] + "." + p[1] + ".";
}
/** "2026-09-15" -> "Montag, 15. September 2026" */
export function fmtDateLong(key){
  const p = key.split("-");
  return weekdayName(key) + ", " + (+p[2]) + ". " + monthName(key) + " " + p[0];
}
