/* Gemeinsame Bausteine fuer Wochen- und Monatsansicht. */

import { h } from "../ui.js";
import { state } from "../store.js";
import { dayType, PLACES } from "../rules.js";
import { fmtShort, fmtSigned, fmtClock, weekdayName, todayKey, isWeekend, parseKey } from "../time.js";

const TAG_CLASS = { vacation: "v", half: "v", sick: "s", holiday: "f", comp: "g", off: "" };

/** Eine anklickbare Tageszeile. */
export function dayRow(d, onOpen){
  const t = dayType(d.type);
  const key = d.key;

  let mid1, mid2;
  if (d.segments.length) {
    mid1 = d.segments.map(s => s.start + "–" + (s.end || "läuft")).join(", ");
    const orte = PLACES.filter(p => d.byPlace[p.id] > 0);
    mid2 = orte.map(p => p.icon + " " + fmtShort(d.byPlace[p.id])).join("   ")
         + (d.breaksTaken > 0 ? "   ☕ " + fmtShort(d.breaksTaken) : "");
  } else if (d.type !== "work") {
    mid1 = t.label + (d.holiday ? " · " + d.holiday : "");
    mid2 = d.credited > 0 ? fmtShort(d.credited) + " gutgeschrieben" : "";
  } else if (d.target > 0) {
    mid1 = "nicht erfasst";
    mid2 = "";
  } else {
    mid1 = "—"; mid2 = "";
  }

  const untracked = d.type === "work" && d.target > 0 && !d.tracked;
  const cls = "drow" + (key === todayKey() ? " today" : "") + (isWeekend(key) ? " weekend" : "");
  return h("button", { class: cls, type: "button", onclick: () => onOpen(key) },
    h("div", { class: "date" },
      h("div", { class: "d1" }, parseKey(key).getDate() + "."),
      h("div", { class: "d2" }, weekdayName(key, true))),
    h("div", { class: "mid" },
      h("div", { class: "m1" },
        d.type !== "work" ? h("span", { class: "tag " + (TAG_CLASS[d.type] || "") }, t.short) : null,
        d.type !== "work" ? " " : null,
        mid1),
      mid2 ? h("div", { class: "m2" }, mid2) : null),
    h("div", { class: "right" },
      h("div", { class: "r1" }, !untracked && (d.worked > 0 || d.segments.length) ? fmtShort(d.worked) : "—"),
      h("div", { class: "r2 " + (d.saldo >= 0 ? "pos" : "neg") },
        untracked || (d.target === 0 && d.worked === 0) ? "" : fmtSigned(d.saldo))));
}

/** Soll / Ist / Saldo als Dreierblock. */
export function totalsGrid(sum){
  return h("div", { class: "grid three" },
    h("div", { class: "cell" }, h("div", { class: "k" }, "Soll"),
      h("div", { class: "v num" }, fmtShort(sum.target))),
    h("div", { class: "cell" }, h("div", { class: "k" }, "Ist"),
      h("div", { class: "v num" }, fmtShort(sum.worked))),
    h("div", { class: "cell" }, h("div", { class: "k" }, "Saldo"),
      h("div", { class: "v num " + (sum.saldo >= 0 ? "pos" : "neg") }, fmtSigned(sum.saldo))));
}

/** Aufteilung nach Arbeitsort. */
export function placeSplit(sum){
  const rows = PLACES.filter(p => sum.byPlace[p.id] > 0);
  if (!rows.length) return null;
  const total = rows.reduce((a, p) => a + sum.byPlace[p.id], 0);
  return h("div", { class: "card" },
    h("div", { class: "sec-title" }, "Wo gearbeitet"),
    rows.map(p => h("div", { class: "seg-row", style: "cursor:default" },
      h("div", { class: "ic" }, p.icon),
      h("div", { class: "times", style: "font-size:13.5px" }, p.label,
        h("span", { class: "muted", style: "margin-left:8px;font-size:12px" },
          Math.round(sum.byPlace[p.id] / total * 100) + " %")),
      h("div", { class: "dur" }, fmtShort(sum.byPlace[p.id])))));
}

/** Grosser Kontostand. */
export function balanceCard(minutes, label, sub){
  return h("div", { class: "card", style: "text-align:center" },
    h("div", { class: "sec-title", style: "margin-bottom:4px" }, label),
    h("div", { class: "bal" },
      h("div", { class: "v " + (minutes >= 0 ? "pos" : "neg") }, fmtSigned(minutes)),
      h("div", { class: "u" }, "Std.")),
    sub ? h("div", { class: "muted", style: "font-size:12.5px;margin-top:2px" }, sub) : null);
}
