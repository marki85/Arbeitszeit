# Arbeitszeit

Arbeitszeiterfassung als Web-App. Läuft im Browser am Rechner und auf dem Handy,
funktioniert offline und speichert **ausschließlich auf deinem Gerät**.

Nachfolger von [Zeiterfassung.1.1](https://github.com/marki85/Zeiterfassung.1.1) –
aus dem Feierabend-Rechner ist eine vollständige Erfassung geworden.

## Was sie kann

**Stempeln statt rechnen**
Ein Knopf für Kommen und Stoppen. Beliebig viele Zeiträume pro Tag, jeder mit
eigenem Ort: 🏢 Firma, 🏠 Homeoffice, 🚗 Unterwegs. Vormittags in der Firma,
dann nach Hause fahren und dort weiterarbeiten – die Fahrt dazwischen zählt
automatisch als Pause.

**Jeder Vertrag**
Wochenstunden frei einstellbar (35 h, 40 h, Teilzeit), Arbeitstage wählbar,
Tagessoll pro Wochentag einzeln überschreibbar.

**Pausen ohne Zutun**
Frühstück (15 Min.) und Mittag (30 Min.) werden automatisch abgezogen – nichts
anhaken, nichts bestätigen, nichts stempeln. Liegt zwischen zwei Zeiträumen
ohnehin eine längere Lücke, etwa die Fahrt von der Firma nach Hause, ist die
Pause damit abgedeckt; abgezogen wird nur, was noch fehlt. Wer es anders
braucht, stellt auf „Immer zusätzlich" um.

**Tagesarten**
Arbeit, Urlaub, halber Urlaub, Krank, Feiertag, Gleittag, Frei. Gesetzliche
Feiertage kommen je nach Bundesland automatisch.

**Zeitkonto**
Laufender Überstundensaldo über alle erfassten Tage, Wochen- und Monatssummen,
Urlaubskonto mit Restanspruch. Tage ohne Eintrag bleiben außen vor, statt das
Konto grundlos ins Minus zu ziehen.

**Arbeitszeitgesetz im Blick**
Warnung bei 10 Stunden, gesetzliche Mindestpausen (30 Min. ab 6 h, 45 Min. ab 9 h)
greifen zusätzlich an langen Tagen, Hinweis bei zu kurzer Ruhezeit zwischen
zwei Tagen. Dazu betriebliche Regeln wie ein frühester Arbeitsbeginn.

**Auswertung**
Wochen- und Monatsansicht, Aufteilung nach Arbeitsort, CSV-Export für Excel
oder Numbers, JSON-Sicherung zum Mitnehmen auf ein anderes Gerät.

## Benutzung

Aufrufen: **https://marki85.github.io/Arbeitszeit/**

Auf dem Handy zum Home-Bildschirm hinzufügen – dann startet sie wie eine App
und läuft auch ohne Netz:

- **iPhone:** Teilen-Symbol → „Zum Home-Bildschirm"
- **Android:** Menü → „App installieren"

Tastatur am Rechner: `←` `→` blättern durch Tage, Wochen oder Monate,
`T` springt zu heute, `1`–`4` wechseln die Ansicht.

## Daten

Alles liegt im `localStorage` des Browsers – kein Server, kein Konto, kein
Tracking, keine Übertragung. Das heißt aber auch: Browserdaten löschen löscht
die Erfassung mit. Über *Mehr → Sicherung speichern* gibt es eine JSON-Datei
zum Aufheben.

## Technik

Reines HTML, CSS und JavaScript (ES-Module) – kein Framework, kein Build.
Dateien bearbeiten, hochladen, fertig.

```
index.html              Grundgerüst
css/app.css             Gestaltung, hell und dunkel, Handy und Rechner
js/time.js              Datums- und Zeitrechnung
js/feiertage.js         Feiertage je Bundesland (Osterformel)
js/rules.js             Tagessoll, Pausen, Arbeitszeitgesetz, Tagesauswertung
js/store.js             Speicherung, Export, Import
js/sprueche.js          Sprüche je nach Tagesphase
js/ui.js                DOM-Helfer
js/views/               Tag, Woche, Monat, Einstellungen
sw.js                   Service Worker für den Offline-Betrieb
```

Zum Ausprobieren braucht es einen kleinen Webserver – als lokale Datei
(`file://`) laden Browser keine ES-Module:

```bash
python3 -m http.server 8777
```

## Rechtliches

Privates, nicht-kommerzielles Hobbyprojekt.
Verantwortlich für den Inhalt: **Markus Schulz**

**Alle Angaben ohne Gewähr.** Verbindlich ist immer die offizielle
Zeiterfassung des Arbeitgebers. Die Hinweise zum Arbeitszeitgesetz sind stark
vereinfacht und ersetzen keine Rechtsberatung – Tarifverträge und
Betriebsvereinbarungen können abweichen.
