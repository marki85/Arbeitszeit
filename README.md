# Arbeitszeit

Beantwortet eine Frage: **Wie lange muss ich noch arbeiten?**

Startzeit eintippen – der Balken zeigt, was geschafft ist und was noch fehlt,
die große Zahl zählt bis zum Feierabend runter. Mehr nicht.

Läuft im Browser am Rechner und auf dem Handy, funktioniert offline und
speichert ausschließlich auf deinem Gerät.

## 👉 https://marki85.github.io/Arbeitszeit/

Auf dem Handy zum Home-Bildschirm hinzufügen, dann startet es wie eine App:

- **iPhone:** Teilen-Symbol → „Zum Home-Bildschirm"
- **Android:** Menü → „App installieren"

## Wie gerechnet wird

Die Pausen sind **feste Zeitfenster** und zählen erst, wenn sie dran sind:

- **Frühstück** 09:30–09:45
- **Mittag** 30 Minuten ab 12:00, 12:30 oder 13:00 – per Knopf unter dem
  Arbeitsbeginn wählbar, die Wahl bleibt gespeichert

„Gearbeitet" wächst damit vom ersten Moment an und bleibt während einer Pause
stehen. Im Balken sind die Pausen als schraffierte Lücken zu sehen. Beginn
08:00 ergibt bei 7 Stunden Soll weiterhin Feierabend **15:45**.

Eine Pause, die vor dem Arbeitsbeginn liegt, entfällt – wer um 10:00 anfängt,
hat keine Frühstückspause. Eine eingetragene **Unterbrechung** (etwa die Fahrt
ins Homeoffice) wird wie eine Pause behandelt; überschneidet sie sich mit der
Mittagspause, zählt die gemeinsame Zeit nur einmal.

**Zeiten vor 06:00** werden nicht anerkannt und ab 06:00 gerechnet, mit Hinweis.
Diese Grenze lässt sich in den Einstellungen ändern oder leeren.

Die Liste **„Überstunden voll um"** zeigt, bis wann zu arbeiten ist, um eine, zwei,
drei oder vier Überstunden voll zu haben – nützlich, wenn welche bewilligt sind.
Zeilen jenseits der 10-Stunden-Grenze des Arbeitszeitgesetzes sind gekennzeichnet.

## Speiseplan

Unter dem Spruch liegt eine Karte, die zum **Speiseplan der Kantine** führt. Ihr
Aufhänger richtet sich nach der Tageszeit: vormittags „schon mal spicken", gegen
Mittag „Mahlzeit!", nachmittags „für morgen vormerken".

Voreingestellt ist der Plan der Kantine Bielefeld im Intranet. Die Datei liegt
hinter einer Anmeldung – die Adresse allein gibt niemandem Zugriff und enthält
keine personenbezogenen Daten. In den Einstellungen lässt sich eine andere
hinterlegen; wer keine braucht, leert das Feld, dann verschwindet die Karte.

Kopiert man eine im Browser angezeigte PDF-Datei, stellen Erweiterungen wie der
Acrobat-Betrachter ihre eigene Adresse voran (`chrome-extension://…/https://…`);
dieser Teil wird beim Einfügen automatisch abgeschnitten. Erlaubt sind nur `http`
und `https`.

## Dateien

```
index.html              alles: Aufbau, Gestaltung, Logik
manifest.webmanifest    für „Zum Home-Bildschirm"
sw.js                   Service Worker für den Offline-Betrieb
icons/                  App-Symbole
```

Reines HTML, CSS und JavaScript in einer Datei. Kein Framework, kein Build,
keine Abhängigkeiten – bearbeiten, hochladen, fertig. Öffnet sich auch direkt
per Doppelklick als lokale Datei.

## Vorgeschichte

- [`Zeiterfassung.1.1`](https://github.com/marki85/Zeiterfassung.1.1) – die erste Fassung
- Etikett [`v2-vollversion`](https://github.com/marki85/Arbeitszeit/tree/v2-vollversion) –
  ein Zwischenstand mit Stempeluhr, Historie, Zeitkonto, Urlaubsverwaltung und
  CSV-Export. Zu viel für den Zweck; bewusst zurückgebaut, bleibt aber abrufbar.

## Rechtliches

Privates, nicht-kommerzielles Hobbyprojekt.
Verantwortlich für den Inhalt: **Markus Schulz**

**Alle Angaben ohne Gewähr.** Verbindlich ist immer die offizielle Zeiterfassung
des Arbeitgebers.
