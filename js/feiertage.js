/* Gesetzliche Feiertage in Deutschland, abhaengig vom Bundesland.
   Ohne Gewaehr - regional begrenzte Feiertage (z. B. Fronleichnam in Teilen
   Sachsens/Thueringens, Mariae Himmelfahrt in Teilen Bayerns) sind bewusst
   nicht abgebildet, weil sie von der Gemeinde abhaengen. */

import { keyOf, pad2 } from "./time.js";

export const BUNDESLAENDER = [
  { id: "BW", name: "Baden-Württemberg" },
  { id: "BY", name: "Bayern" },
  { id: "BE", name: "Berlin" },
  { id: "BB", name: "Brandenburg" },
  { id: "HB", name: "Bremen" },
  { id: "HH", name: "Hamburg" },
  { id: "HE", name: "Hessen" },
  { id: "MV", name: "Mecklenburg-Vorpommern" },
  { id: "NI", name: "Niedersachsen" },
  { id: "NW", name: "Nordrhein-Westfalen" },
  { id: "RP", name: "Rheinland-Pfalz" },
  { id: "SL", name: "Saarland" },
  { id: "SN", name: "Sachsen" },
  { id: "ST", name: "Sachsen-Anhalt" },
  { id: "SH", name: "Schleswig-Holstein" },
  { id: "TH", name: "Thüringen" },
  { id: "-",  name: "keine Feiertage vormerken" }
];

/** Ostersonntag nach der Gaussschen Osterformel (gregorianisch). */
function easter(year){
  const a = year % 19;
  const b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}
function offsetFromEaster(year, days){
  const d = easter(year);
  d.setDate(d.getDate() + days);
  return keyOf(d);
}
function fixed(year, month, day){ return year + "-" + pad2(month) + "-" + pad2(day); }

/** Buss- und Bettag: der Mittwoch vor dem 23. November. */
function bussUndBettag(year){
  const d = new Date(year, 10, 22);           // 22.11.
  while (d.getDay() !== 3) d.setDate(d.getDate() - 1);
  return keyOf(d);
}

const ALL = "BW BY BE BB HB HH HE MV NI NW RP SL SN ST SH TH".split(" ");

/** Alle Feiertage eines Jahres als { "YYYY-MM-DD": "Name" }. */
export function holidaysOfYear(year, land){
  const def = [
    { name: "Neujahr",                  key: fixed(year, 1, 1),            in: ALL },
    { name: "Heilige Drei Könige",      key: fixed(year, 1, 6),            in: ["BW","BY","ST"] },
    { name: "Internationaler Frauentag",key: fixed(year, 3, 8),            in: ["BE","MV"] },
    { name: "Karfreitag",               key: offsetFromEaster(year, -2),   in: ALL },
    { name: "Ostersonntag",             key: offsetFromEaster(year, 0),    in: ["BB"] },
    { name: "Ostermontag",              key: offsetFromEaster(year, 1),    in: ALL },
    { name: "Tag der Arbeit",           key: fixed(year, 5, 1),            in: ALL },
    { name: "Christi Himmelfahrt",      key: offsetFromEaster(year, 39),   in: ALL },
    { name: "Pfingstsonntag",           key: offsetFromEaster(year, 49),   in: ["BB"] },
    { name: "Pfingstmontag",            key: offsetFromEaster(year, 50),   in: ALL },
    { name: "Fronleichnam",             key: offsetFromEaster(year, 60),   in: ["BW","BY","HE","NW","RP","SL"] },
    { name: "Mariä Himmelfahrt",        key: fixed(year, 8, 15),           in: ["SL"] },
    { name: "Weltkindertag",            key: fixed(year, 9, 20),           in: ["TH"] },
    { name: "Tag der Deutschen Einheit",key: fixed(year, 10, 3),           in: ALL },
    { name: "Reformationstag",          key: fixed(year, 10, 31),          in: ["BB","HB","HH","MV","NI","SN","ST","SH","TH"] },
    { name: "Allerheiligen",            key: fixed(year, 11, 1),           in: ["BW","BY","NW","RP","SL"] },
    { name: "Buß- und Bettag",          key: bussUndBettag(year),          in: ["SN"] },
    { name: "1. Weihnachtstag",         key: fixed(year, 12, 25),          in: ALL },
    { name: "2. Weihnachtstag",         key: fixed(year, 12, 26),          in: ALL }
  ];
  const out = {};
  for (const h of def) if (h.in.indexOf(land) >= 0) out[h.key] = h.name;
  return out;
}

const cache = new Map();

/** Name des Feiertags an diesem Tag, sonst null. */
export function holidayName(key, land){
  if (!land || land === "-") return null;
  const year = key.slice(0, 4);
  const id = land + ":" + year;
  if (!cache.has(id)) cache.set(id, holidaysOfYear(+year, land));
  return cache.get(id)[key] || null;
}
