/* Einstiegspunkt: Ansichten verwalten, Navigation, Sekundentakt. */

import { $, toast } from "./ui.js";
import * as store from "./store.js";
import { state } from "./store.js";
import { todayKey } from "./time.js";

import dayView from "./views/day.js";
import weekView from "./views/week.js";
import monthView from "./views/month.js";
import settingsView, { applyTheme } from "./views/settings.js";

const VIEWS = { day: dayView, week: weekView, month: monthView, settings: settingsView };
let current = null;
let container, titleEl, subEl, prevBtn, nextBtn;

function setView(id){
  if (!VIEWS[id]) id = "day";
  state.view = id;
  current = VIEWS[id];
  container.replaceChildren();
  current.mount(container);
  for (const t of document.querySelectorAll(".tab")) {
    if (t.dataset.view === id) t.setAttribute("aria-current", "page");
    else t.removeAttribute("aria-current");
  }
  prevBtn.hidden = nextBtn.hidden = !!current.noNav;
  syncTitle();
  window.scrollTo(0, 0);
}

function syncTitle(){
  titleEl.textContent = current.title();
  subEl.textContent = current.subtitle();
  if (!current.noNav) {
    prevBtn.disabled = false;
    nextBtn.disabled = false;
  }
}

function refresh(){
  if (!current) return;
  current.update();
  syncTitle();
}

function tick(){
  if (current && current.ticks) current.update();
}

/* ---------- Start ---------- */

function init(){
  container = $("#view");
  titleEl = $("#navTitle");
  subEl = $("#navSub");
  prevBtn = $("#navPrev");
  nextBtn = $("#navNext");

  store.load();
  applyTheme();

  prevBtn.addEventListener("click", () => { current.nav(-1); refreshFull(); });
  nextBtn.addEventListener("click", () => { current.nav(1); refreshFull(); });

  for (const t of document.querySelectorAll(".tab")) {
    t.addEventListener("click", () => setView(t.dataset.view));
  }

  // Wochen-/Monatsansicht springen per Ereignis in die Tagesansicht.
  window.addEventListener("goto", e => setView(e.detail));

  // Tastatur am Schreibtisch
  window.addEventListener("keydown", e => {
    if (e.target.matches("input, select, textarea")) return;
    if (e.key === "ArrowLeft" && !current.noNav) { current.nav(-1); refreshFull(); }
    if (e.key === "ArrowRight" && !current.noNav) { current.nav(1); refreshFull(); }
    if (e.key === "t" || e.key === "T") { state.date = todayKey(); refreshFull(); }
    const n = "1234".indexOf(e.key);
    if (n >= 0) setView(["day", "week", "month", "settings"][n]);
  });

  store.subscribe(refresh);
  setView("day");

  if (state.migratedFrom) {
    setTimeout(() => toast("Einstellungen aus der alten Version übernommen"), 600);
  }

  setInterval(tick, 1000);

  // Beim Zurückkehren auf die Seite: Datum könnte sich geändert haben.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refreshFull();
  });

  registerServiceWorker();
}

/* Der Service Worker haelt die App offline verfuegbar. Damit eine neue Fassung
   nicht wochenlang im Cache haengen bleibt, wird hier aktiv danach gesucht und
   ein Hinweis eingeblendet, sobald eine bereitsteht. */
function registerServiceWorker(){
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").then(reg => {
      // Beim Start und danach stuendlich nach einer neuen Fassung sehen.
      reg.update().catch(() => {});
      setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);

      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener("statechange", () => {
          // "installed" + vorhandener Controller = es gab schon eine alte Fassung.
          if (sw.state === "installed" && navigator.serviceWorker.controller) {
            toast("Neue Version bereit – App neu laden");
          }
        });
      });
    }).catch(() => { /* z. B. beim Oeffnen als lokale Datei */ });
  });
}

function refreshFull(){
  container.replaceChildren();
  current.mount(container);
  syncTitle();
}

init();
