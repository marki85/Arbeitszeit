/* Monatsansicht: Summen, Urlaubskonto, alle erfassten Tage, CSV-Export. */

import { h, fill, download, toast } from "../ui.js";
import * as store from "../store.js";
import { state } from "../store.js";
import { sumDays } from "../rules.js";
import { dayRow, totalsGrid, placeSplit, balanceCard } from "./list.js";
import { monthDays, addMonths, startOfMonth, monthName, fmtShort, fmtNum,
         parseKey, todayKey } from "../time.js";

let root = null;

function open(key){
  state.date = key;
  window.dispatchEvent(new CustomEvent("goto", { detail: "day" }));
}

function render(){
  const keys = monthDays(state.date);
  const days = store.computeRange(keys);
  const sum = sumDays(days);
  const year = state.date.slice(0, 4);
  const account = store.accountBalance(keys[keys.length - 1]);
  const used = store.vacationUsed(year);
  const left = (state.settings.vacationPerYear || 0) - used;

  // Nur Tage zeigen, an denen etwas passiert ist oder passieren sollte.
  const shown = days.filter(d => d.segments.length || d.type !== "work" || d.target > 0);

  fill(root,
    h("div", { class: "card" }, totalsGrid(sum),
      h("div", { class: "note", style: "text-align:center" },
        sum.untracked > 0
          ? "Gerechnet über " + sum.tracked + " von " + (sum.tracked + sum.untracked)
            + " Arbeitstagen · Monatssoll " + fmtShort(sum.contract)
          : "Monatssoll " + fmtShort(sum.contract))),

    h("div", { class: "grid" },
      kv("Gearbeitet", fmtShort(sum.net)),
      kv("Pausen", fmtShort(sum.breaks)),
      kv("Urlaub", fmtNum(sum.vacation) + (sum.vacation === 1 ? " Tag" : " Tage")),
      kv("Krank", fmtNum(sum.sick) + (sum.sick === 1 ? " Tag" : " Tage"))),
    h("div", { class: "spacer" }),

    sum.untracked > 0
      ? h("div", { class: "notice warn" }, h("span", { class: "ico" }, "📝"),
          h("span", { html: "<strong>" + sum.untracked + " Arbeitstag" + (sum.untracked > 1 ? "e" : "")
            + "</strong> ohne Eintrag. Diese Tage bleiben beim Zeitkonto außen vor." }))
      : null,

    h("div", { class: "list" }, shown.map(d => dayRow(d, open))),
    h("div", { class: "spacer" }),

    placeSplit(sum),
    balanceCard(account, "Zeitkonto Ende " + monthName(state.date),
      "Stand nach dem letzten Tag dieses Monats"),

    h("div", { class: "card" },
      h("div", { class: "sec-title" }, "Urlaub " + year),
      h("div", { class: "grid three" },
        kv("Anspruch", fmtNum(state.settings.vacationPerYear) + " T"),
        kv("Genommen", fmtNum(used) + " T"),
        kv("Rest", fmtNum(left) + " T", left < 0 ? "neg" : "pos"))),

    h("div", { class: "card" },
      h("button", { class: "btn ghost wide", type: "button", onclick: exportMonth },
        "📄  Monat als CSV exportieren"),
      h("div", { class: "note" },
        "Die Datei öffnet sich in Excel oder Numbers direkt richtig – Semikolon als Trennzeichen.")),

    h("div", { class: "foot" }, "Tippe auf einen Tag, um ihn zu bearbeiten.")
  );
}

function kv(k, v, cls){
  return h("div", { class: "cell" }, h("div", { class: "k" }, k),
    h("div", { class: "v num " + (cls || "") }, v));
}

function exportMonth(){
  const keys = monthDays(state.date);
  const csv = store.exportCSV(keys);
  download("Arbeitszeit-" + state.date.slice(0, 7) + ".csv", csv, "text/csv");
  toast("CSV erstellt");
}

export default {
  id: "month",
  mount(container){ root = container; render(); },
  update: render,
  title(){ return monthName(state.date); },
  subtitle(){ return state.date.slice(0, 4); },
  nav(dir){ state.date = startOfMonth(addMonths(state.date, dir)); },
  ticks: false
};
