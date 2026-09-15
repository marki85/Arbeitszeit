/* Sprueche je nach Tagesphase. Uebernommen aus der Vorgaengerversion
   und um die neuen Phasen (Pause, Homeoffice, Urlaub) ergaenzt. */

export const SPRUECHE = {
  empty: [
    "Noch nichts gestempelt – tippe auf Kommen.",
    "Erst die Zeit, dann der Kaffee. Oder umgekehrt. ☕",
    "Sag mir, wann du angefangen hast – ich zähl den Rest.",
    "Ohne Startzeit kein Feierabend. So sind die Regeln. 🙂",
    "Ein Tippen von dir, den Rest übernehme ich."
  ],
  morning: [
    "Guten Morgen! Erst der Kaffee, dann der Rest. ☕",
    "Motor läuft, Kaffee dampft – läuft bei dir.",
    "Jede große Schicht beginnt mit dem ersten Klick. 💪",
    "Noch etwas verschlafen? Der Tag wächst sich schon aus.",
    "Der frühe Vogel darf auch erst ab 6 zählen. 🐦",
    "Guten Start! Der Rest ergibt sich.",
    "Ein Tag, ein Plan, ein Kaffee. In beliebiger Reihenfolge.",
    "Morgens ist die Uhr am langsamsten. Das gibt sich. ⏳",
    "Frisch gestempelt hält besser. 😄",
    "Die ersten Minuten sind immer die zähesten. Danach fliegt's."
  ],
  mid: [
    "Du bist voll im Flow – weiter so!",
    "Läuft. Nicht schnell, aber es läuft. 😄",
    "Ein Häkchen nach dem anderen. Du machst das gut.",
    "Halbzeit rückt näher – stark unterwegs!",
    "Solide Arbeit. Genau so.",
    "Mittendrin statt nur dabei. 💪",
    "Der Vormittag ist gepackt. Respekt.",
    "Kleine Pause? Der Kopf dankt's dir später. ☕",
    "Konstant ist besser als hektisch. Du hast das im Griff.",
    "Die Uhr läuft für dich, nicht gegen dich. ⏱️",
    "Schritt für Schritt. So werden Stunden voll.",
    "Zwischendurch mal aufstehen – der Rücken sagt danke. 🙂"
  ],
  stretch: [
    "Zielgerade in Sicht – der Feierabend winkt schon. 👋",
    "Nur noch ein kleines Stück – halt durch!",
    "Der Kaffee war's wert. Fast geschafft!",
    "Du siehst das Licht am Ende der Schicht. ✨",
    "Das Schwerste liegt hinter dir.",
    "Nachmittags-Durchhänger? Völlig normal. Weiter geht's.",
    "Noch ein Stück – dann gehört der Tag wieder dir.",
    "Gleich ist die Kuh vom Eis. 🐄",
    "Letztes Drittel. Da kommst du locker durch."
  ],
  endspurt: [
    "Endspurt! 🏁 Gleich ist das Soll voll.",
    "Letzte Minuten – Jacke schon mal bereitlegen. 😉",
    "Gleich klingelt der Feierabend. Durchhalten!",
    "So kurz vor dem Ziel gibt keiner mehr auf. 🚀",
    "Countdown läuft. Du hast es gleich. ⏰",
    "Noch ein Wimpernschlag, dann ist Schluss.",
    "Die Ziellinie ist zum Greifen nah. 🎯",
    "Gleich geschafft – nicht mehr ablenken lassen. 😄"
  ],
  done: [
    "Feierabend! 🎉 Rechner aus, Leben an.",
    "Geschafft! Das Soll steht. Genieß den Abend. 🙌",
    "Soll erfüllt – du darfst jetzt offiziell nichts mehr tun. 😎",
    "Gut gemacht! Der Rest des Tages gehört dir.",
    "Punktlandung. Ab nach Hause! 🏡",
    "Tagwerk vollbracht. Verdient. 👏",
    "Erledigt. Der Stuhl darf jetzt abkühlen. 😄",
    "Ende der Vorstellung. Applaus für dich. 🎭"
  ],
  overtime: [
    "Überstunde läuft – das kommt aufs Konto. 💪",
    "Extra-Zeit = Extra-Einsatz. Aber übertreib's nicht. 😉",
    "Jede Minute zählt jetzt fürs Zeitkonto. 📈",
    "Fleißig! Aber denk auch mal an deinen Feierabend. 🕗",
    "Das Konto füllt sich. Irgendwann willst du's auch abfeiern. 🙂",
    "Bonuszeit. Freiwillig ist das schönste Wort dabei.",
    "Noch da? Dann wenigstens sauber aufschreiben. 📝",
    "Überstunden sind wie Kaffee: in Maßen prima. ☕"
  ],
  limit: [
    "10 Stunden. Jetzt ist wirklich gut. 🛑",
    "Schicht im Schacht – der Rest wartet bis morgen.",
    "Grenze erreicht. Ab hier gewinnt niemand mehr. 🏁",
    "Feierabend ist keine Schwäche, sondern Vorschrift. 🙂"
  ],
  pause: [
    "Pause läuft – Bildschirm aus, Kopf frei. ☕",
    "Gut so. Pausen sind Arbeitsschutz, kein Luxus.",
    "Kurz durchatmen. Die Uhr wartet solange.",
    "Mahlzeit! 🍽️",
    "Pause ist der Teil des Tages, den man nicht wegoptimiert."
  ],
  home: [
    "Homeoffice läuft – Weg zur Kaffeemaschine: 4 Meter. ☕",
    "Zweite Hälfte vom Sofa aus. Auch das ist Arbeit. 🏠",
    "Zu Hause weiter – sauber getrennt gestempelt. 👌",
    "Kein Stau, kein Parkplatz, direkt weiter. 🏠"
  ],
  future: [
    "Startzeit liegt noch vor dir – ganz entspannt.",
    "Noch nicht dran? Genieß die Ruhe vor der Schicht. 😌",
    "Die Zukunft kommt früh genug. Kaffee first. ☕",
    "Gut vorbereitet ist halb gestempelt."
  ],
  vacation: [
    "Urlaub. Das Beste, was ein Kalender zu bieten hat. 🏖️",
    "Heute zählt nur die Sonne. ☀️",
    "Urlaubstag – die App macht auch mal Pause. 😎",
    "Nichts zu tun, und das ganz offiziell. 🍹"
  ],
  sick: [
    "Gute Besserung! Erholen ist gerade dein Job. 🫖",
    "Krank ist krank. Der Rest wartet. 🍵",
    "Ausruhen zählt heute als Volleinsatz."
  ],
  holiday: [
    "Feiertag – geschenkte Zeit. 🎉",
    "Heute arbeitet nur der Kalender. 📅",
    "Frei, und zwar von Amts wegen. 🙂"
  ],
  off: [
    "Freier Tag. Nichts zu zählen, nichts zu tun. 😌",
    "Heute ist frei – genieß es.",
    "Wochenende ist auch nur ein Feiertag ohne Namen. 🌞"
  ]
};

/** Bestimmt die Phase aus einer ausgewerteten Tagesauswertung. */
export function phaseOf(d, isToday){
  if (d.type === "vacation" || d.type === "half") return "vacation";
  if (d.type === "sick") return "sick";
  if (d.type === "holiday") return "holiday";
  if (d.type === "off" && !d.segments.length) return "off";
  if (!d.segments.length) return isToday ? "empty" : "future";
  if (d.net >= 10 * 60) return "limit";

  if (!d.running) {
    if (d.net >= d.effTarget && d.effTarget > 0) {
      return d.net - d.effTarget <= 15 ? "done" : "overtime";
    }
    return "pause";                      // erfasst, aber gerade nicht am Arbeiten
  }
  if (d.effTarget > 0 && d.net >= d.effTarget) {
    return d.net - d.effTarget <= 15 ? "done" : "overtime";
  }
  if (d.runningSeg && d.runningSeg.place === "home" && d.segments.length > 1) return "home";

  const p = d.effTarget > 0 ? d.net / d.effTarget : 0;
  return p < 0.25 ? "morning" : p < 0.6 ? "mid" : p < 0.9 ? "stretch" : "endspurt";
}

let nudge = 0;
export function nextSpruch(){ nudge++; }
export function spruchFor(phase){
  const pool = SPRUECHE[phase] || SPRUECHE.empty;
  return pool[(Math.floor(Date.now() / 20000) + nudge) % pool.length];
}
