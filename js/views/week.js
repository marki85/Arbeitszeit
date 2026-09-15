/* Wochenansicht: sieben Tage, Wochensumme, Aufteilung nach Ort. */

import { h, fill } from "../ui.js";
import * as store from "../store.js";
import { state } from "../store.js";
import { sumDays } from "../rules.js";
import { dayRow, totalsGrid, placeSplit, balanceCard } from "./list.js";
import { weekDays, startOfWeek, addDays, isoWeek, fmtDate, fmtShort,
         todayKey, fmtSigned } from "../time.js";

let root = null;

function open(key){
  state.date = key;
  window.dispatchEvent(new CustomEvent("goto", { detail: "day" }));
}

function render(){
  const keys = weekDays(state.date);
  const days = store.computeRange(keys);
  const sum = sumDays(days);
  const account = store.accountBalance(keys[6]);

  fill(root,
    h("div", { class: "col" },
      h("div", { class: "card" }, totalsGrid(sum),
      h("div", { class: "note", style: "text-align:center" },
        sum.untracked > 0
          ? "Gerechnet über " + sum.tracked + " von " + (sum.tracked + sum.untracked)
            + " Arbeitstagen · Wochensoll " + fmtShort(sum.contract)
          : "Wochensoll " + fmtShort(sum.contract))),
      h("div", { class: "list" }, days.map(d => dayRow(d, open)))),

    h("div", { class: "col" },
      sum.untracked > 0
      ? h("div", { class: "notice warn" }, h("span", { class: "ico" }, "📝"),
          h("span", { html: "<strong>" + sum.untracked + " Arbeitstag" + (sum.untracked > 1 ? "e" : "")
            + "</strong> in dieser Woche " + (sum.untracked > 1 ? "sind" : "ist") + " noch nicht erfasst. "
            + "Nicht erfasste Tage zählen nicht aufs Zeitkonto." }))
        : null,
      placeSplit(sum),
      balanceCard(account, "Zeitkonto bis Sonntag",
      sum.vacation || sum.sick ? [
        sum.vacation ? sum.vacation + " Urlaubstag" + (sum.vacation === 1 ? "" : "e") : null,
        sum.sick ? sum.sick + " Krankheitstag" + (sum.sick === 1 ? "" : "e") : null
        ].filter(Boolean).join(" · ") : "")),

    h("div", { class: "foot" }, "Tippe auf einen Tag, um ihn zu bearbeiten.")
  );
}

export default {
  id: "week",
  mount(container){ root = container; render(); },
  update: render,
  title(){ const w = isoWeek(state.date); return "KW " + w.week; },
  subtitle(){
    const k = weekDays(state.date);
    return fmtDate(k[0]).slice(0, 6) + " – " + fmtDate(k[6]);
  },
  nav(dir){ state.date = addDays(startOfWeek(state.date), dir * 7); },
  ticks: false
};
