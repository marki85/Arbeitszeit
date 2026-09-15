/* Einstellungen, Datenexport und Rechtliches. */

import { h, fill, download, toast } from "../ui.js";
import * as store from "../store.js";
import { state, DEFAULTS } from "../store.js";
import { targetsPerWeekday, PLACES } from "../rules.js";
import { BUNDESLAENDER } from "../feiertage.js";
import { fmtShort, fmtNum, fmtSigned, todayKey, toMin, pad2 } from "../time.js";

let root = null;
const WD = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

function set(patch){ store.setSettings(patch); }

function render(){
  const s = state.settings;
  const targets = targetsPerWeekday(s);
  const dailyMin = s.workdays.length ? targets[s.workdays[0]] : 0;

  fill(root,

    /* ---- Vertrag ---- */
    h("div", { class: "card" },
      h("div", { class: "sec-title" }, "Vertrag"),
      h("div", { class: "field" },
        h("label", { for: "wh" }, "Wochenstunden"),
        h("div", { class: "row" },
          h("input", { type: "number", id: "wh", min: "0", max: "60", step: "0.5",
            inputmode: "decimal", value: fmtNum(s.weeklyHours).replace(",", "."),
            onchange: e => set({ weeklyHours: +e.target.value }) }),
          h("button", { class: "btn ghost small", type: "button",
            onclick: () => set({ weeklyHours: 35 }) }, "35 h"),
          h("button", { class: "btn ghost small", type: "button",
            onclick: () => set({ weeklyHours: 40 }) }, "40 h"))),
      h("div", { class: "field" },
        h("label", null, "Arbeitstage"),
        h("div", { class: "wd" }, [1, 2, 3, 4, 5, 6, 0].map(wd =>
          h("button", { type: "button", "aria-pressed": s.workdays.indexOf(wd) >= 0 ? "true" : "false",
            onclick: () => toggleWorkday(wd) }, WD[wd])))),
      h("div", { class: "note" },
        s.workdays.length
          ? "Daraus ergibt sich ein Tagessoll von " + fmtShort(dailyMin) + " an "
            + s.workdays.length + " Tagen pro Woche."
          : "Ohne Arbeitstage gibt es kein Tagessoll."),

      h("details", { class: "acc", style: "margin-top:12px;margin-bottom:0" },
        h("summary", null, "Tagessoll einzeln festlegen", h("span", { class: "chev" }, "▾")),
        h("div", { class: "acc-body" },
          s.workdays.map(wd => h("div", { class: "field" },
            h("label", null, WD[wd] + " (Stunden)"),
            h("input", { type: "number", min: "0", max: "12", step: "0.25", inputmode: "decimal",
              value: fmtNum(targets[wd] / 60).replace(",", "."),
              placeholder: fmtNum(targets[wd] / 60),
              onchange: e => setOverride(wd, e.target.value) }))),
          h("button", { class: "btn ghost small wide", type: "button",
            onclick: () => set({ dailyOverrides: {} }) }, "Wieder gleichmäßig verteilen"),
          h("div", { class: "note" }, "Leer lassen heißt: gleichmäßig aus den Wochenstunden berechnet.")))),

    /* ---- Pausen ---- */
    h("div", { class: "card" },
      h("div", { class: "sec-title" }, "Pausen"),
      h("div", { class: "seg", style: "margin-bottom:12px" },
        h("button", { type: "button", "aria-pressed": s.breakMode === "gaps" ? "true" : "false",
          onclick: () => set({ breakMode: "gaps" }) }, "Selbst stempeln"),
        h("button", { type: "button", "aria-pressed": s.breakMode === "flat" ? "true" : "false",
          onclick: () => set({ breakMode: "flat" }) }, "Pauschal abziehen")),
      s.breakMode === "flat"
        ? h("div", { class: "field" },
            h("label", { for: "fb" }, "Pauschale Pause (Minuten)"),
            h("input", { type: "number", id: "fb", min: "0", max: "240", step: "5", inputmode: "numeric",
              value: s.flatBreak, onchange: e => set({ flatBreak: +e.target.value }) }))
        : h("div", { class: "note", style: "margin-top:0" },
            "Die Lücke zwischen zwei Zeiträumen gilt automatisch als Pause – also auch die Fahrt "
            + "von der Firma nach Hause."),
      h("div", { class: "switch", style: "margin-top:10px" },
        h("div", { class: "txt" },
          h("b", null, "Gesetzliche Mindestpause erzwingen"),
          h("small", null, "Über 6 Std. mindestens 30 Min., über 9 Std. mindestens 45 Min. "
            + "Fehlende Pausenzeit wird von der Arbeitszeit abgezogen.")),
        h("input", { type: "checkbox", checked: s.enforceLegalBreaks,
          onchange: e => set({ enforceLegalBreaks: e.target.checked }) }))),

    /* ---- Betriebliche Regeln ---- */
    h("div", { class: "card" },
      h("div", { class: "sec-title" }, "Betriebliche Regeln"),
      h("div", { class: "two" },
        h("div", { class: "field" },
          h("label", { for: "es" }, "Frühester Beginn"),
          h("input", { type: "time", id: "es", value: s.earliestStart,
            onchange: e => set({ earliestStart: e.target.value }) })),
        h("div", { class: "field" },
          h("label", { for: "le" }, "Spätestes Ende"),
          h("input", { type: "time", id: "le", value: s.latestEnd,
            onchange: e => set({ latestEnd: e.target.value }) }))),
      h("div", { class: "note", style: "margin-top:0" },
        "Zeiten außerhalb dieses Fensters werden nicht mitgezählt. Felder leeren, "
        + "wenn dein Betrieb das nicht so handhabt."),
      h("div", { class: "field", style: "margin-top:12px" },
        h("label", { for: "bl" }, "Bundesland (für Feiertage)"),
        h("select", { id: "bl", onchange: e => set({ bundesland: e.target.value }) },
          BUNDESLAENDER.map(b => h("option", { value: b.id, selected: b.id === s.bundesland }, b.name)))),
      h("div", { class: "field" },
        h("label", { for: "dp" }, "Voreingestellter Arbeitsort"),
        h("select", { id: "dp", onchange: e => set({ defaultPlace: e.target.value }) },
          PLACES.map(p => h("option", { value: p.id, selected: p.id === s.defaultPlace },
            p.icon + "  " + p.label))))),

    /* ---- Zeitkonto ---- */
    h("div", { class: "card" },
      h("div", { class: "sec-title" }, "Zeitkonto & Urlaub"),
      h("div", { class: "two" },
        h("div", { class: "field" },
          h("label", { for: "co" }, "Startsaldo (Std.)"),
          h("input", { type: "number", id: "co", step: "0.25", inputmode: "decimal",
            value: fmtNum(s.carryOver / 60).replace(",", "."),
            onchange: e => set({ carryOver: Math.round((+e.target.value || 0) * 60) }) })),
        h("div", { class: "field" },
          h("label", { for: "cod" }, "Zählen ab"),
          h("input", { type: "date", id: "cod", value: s.carryOverDate,
            onchange: e => set({ carryOverDate: e.target.value }) }))),
      h("div", { class: "field" },
        h("label", { for: "vp" }, "Urlaubstage pro Jahr"),
        h("input", { type: "number", id: "vp", min: "0", max: "99", step: "0.5", inputmode: "decimal",
          value: fmtNum(s.vacationPerYear).replace(",", "."),
          onchange: e => set({ vacationPerYear: +e.target.value }) })),
      h("div", { class: "note", style: "margin-top:0" },
        "Der Startsaldo ist das, was schon vor der ersten Erfassung auf dem Konto stand. "
        + "Aktuell: " + fmtSigned(store.accountBalance(todayKey())) + " Std.")),

    /* ---- Darstellung ---- */
    h("div", { class: "card" },
      h("div", { class: "sec-title" }, "Darstellung"),
      h("div", { class: "seg", style: "margin-bottom:6px" },
        [["auto", "Automatisch"], ["light", "Hell"], ["dark", "Dunkel"]].map(([id, label]) =>
          h("button", { type: "button", "aria-pressed": s.theme === id ? "true" : "false",
            onclick: () => { set({ theme: id }); applyTheme(); } }, label))),
      h("div", { class: "switch" },
        h("div", { class: "txt" }, h("b", null, "Sprüche anzeigen"),
          h("small", null, "Der kleine Motivationsspruch auf der Tagesseite.")),
        h("input", { type: "checkbox", checked: s.sprueche,
          onchange: e => set({ sprueche: e.target.checked }) })),
      h("div", { class: "switch" },
        h("div", { class: "txt" }, h("b", null, "Konfetti zum Feierabend"),
          h("small", null, "Wenn das Tagessoll voll ist.")),
        h("input", { type: "checkbox", checked: s.confetti,
          onchange: e => set({ confetti: e.target.checked }) }))),

    /* ---- Daten ---- */
    h("div", { class: "card" },
      h("div", { class: "sec-title" }, "Deine Daten"),
      h("button", { class: "btn ghost wide", type: "button", onclick: exportAll, style: "margin-bottom:8px" },
        "💾  Sicherung speichern (JSON)"),
      h("button", { class: "btn ghost wide", type: "button", onclick: exportAllCSV, style: "margin-bottom:8px" },
        "📄  Alles als CSV exportieren"),
      h("label", { class: "btn ghost wide", style: "display:block;text-align:center;margin-bottom:8px" },
        "📥  Sicherung einlesen",
        h("input", { type: "file", accept: ".json,application/json", style: "display:none",
          onchange: importFile })),
      h("button", { class: "btn danger wide", type: "button", onclick: wipe }, "Alle Daten löschen"),
      h("div", { class: "note" },
        Object.keys(state.days).length + " erfasste Tage. Alles liegt nur auf diesem Gerät – "
        + "mach ab und zu eine Sicherung.")),

    /* ---- Rechtliches ---- */
    h("details", { class: "acc" },
      h("summary", null, "Impressum & Datenschutz", h("span", { class: "chev" }, "▾")),
      h("div", { class: "acc-body legal" },
        h("h3", null, "Impressum"),
        h("p", { html: "Privates, nicht-kommerzielles Hobbyprojekt.<br>Verantwortlich für den Inhalt: <strong>Markus Schulz</strong>" }),
        h("p", { html: "Diese App dient der eigenen Orientierung. <strong>Alle Angaben ohne Gewähr</strong> – "
          + "verbindlich ist immer die offizielle Zeiterfassung des Arbeitgebers." }),
        h("h3", null, "Datenschutz"),
        h("p", { html: "Diese App erhebt <strong>keine personenbezogenen Daten</strong>. Es gibt keine Cookies, "
          + "kein Tracking, keine Analyse-Werkzeuge und keine Weitergabe an Dritte." }),
        h("p", { html: "Alle Eingaben werden ausschließlich <strong>lokal auf deinem Gerät</strong> im Browser "
          + "gespeichert und niemals versendet. Löschen kannst du sie jederzeit über den Knopf oben "
          + "oder über die Browser-Daten deines Geräts." }),
        h("p", { html: "Wird die App über <strong>GitHub Pages</strong> aufgerufen, verarbeitet GitHub Inc. beim "
          + "Abruf technisch notwendige Server-Daten – darunter die <strong>IP-Adresse</strong>. Darauf hat der "
          + "Betreiber dieser Seite keinen Einfluss und keinen Zugriff. Einmal geladen, läuft die App offline." }),
        h("h3", null, "Rechtlicher Hinweis"),
        h("p", { html: "Die Hinweise zum Arbeitszeitgesetz (10-Stunden-Grenze, Mindestpausen, Ruhezeit) sind "
          + "stark vereinfacht und ersetzen keine Rechtsberatung. Tarifverträge und Betriebsvereinbarungen "
          + "können abweichen." }))),

    h("div", { class: "foot" },
      "Arbeitszeit · läuft offline", h("br"),
      "Mit freundlicher Unterstützung von ", h("strong", null, "Markus Schulz"), ".")
  );
}

/* ---------- Aktionen ---------- */

function toggleWorkday(wd){
  const cur = state.settings.workdays.slice();
  const i = cur.indexOf(wd);
  if (i >= 0) cur.splice(i, 1); else cur.push(wd);
  set({ workdays: cur.sort() });
}

function setOverride(wd, value){
  const ov = Object.assign({}, state.settings.dailyOverrides);
  if (value === "" || value == null) delete ov[wd];
  else ov[wd] = +value;
  set({ dailyOverrides: ov });
}

function applyTheme(){
  const t = state.settings.theme;
  if (t === "auto") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", t);
}

function exportAll(){
  const d = new Date();
  download("Arbeitszeit-Sicherung-" + d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-"
    + pad2(d.getDate()) + ".json", store.exportJSON(), "application/json");
  toast("Sicherung gespeichert");
}

function exportAllCSV(){
  const keys = Object.keys(state.days).sort();
  if (!keys.length) { toast("Noch nichts zu exportieren"); return; }
  download("Arbeitszeit-gesamt.csv", store.exportCSV(keys), "text/csv");
  toast("CSV erstellt");
}

function importFile(e){
  const file = e.target.files && e.target.files[0];
  e.target.value = "";
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const replace = confirm(
      "Sicherung einlesen.\n\n" +
      "OK  = alles ersetzen (vorhandene Daten gehen verloren)\n" +
      "Abbrechen = dazumischen (gleiche Tage werden überschrieben)");
    try {
      const n = store.importJSON(String(reader.result), replace ? "replace" : "merge");
      applyTheme();
      toast(n + " Tage eingelesen");
    } catch (err) {
      alert("Die Datei konnte nicht gelesen werden:\n" + err.message);
    }
  };
  reader.readAsText(file);
}

function wipe(){
  if (!confirm("Wirklich alle erfassten Zeiten und Einstellungen löschen?\n\nDas lässt sich nicht rückgängig machen.")) return;
  if (!confirm("Ganz sicher? Mach vorher besser eine Sicherung.")) return;
  state.days = {};
  store.resetSettings();
  applyTheme();
  toast("Alles gelöscht");
}

export { applyTheme };

export default {
  id: "settings",
  mount(container){ root = container; render(); },
  update: render,
  title(){ return "Einstellungen"; },
  subtitle(){ return fmtNum(state.settings.weeklyHours) + "-Stunden-Woche"; },
  nav(){ },
  ticks: false,
  noNav: true
};
