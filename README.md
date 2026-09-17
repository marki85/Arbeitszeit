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

```
Pause       = max(Frühstück + Mittag, eingetragene Unterbrechung)
Feierabend  = Beginn + Soll + Pause
Noch        = Feierabend − jetzt
Fortschritt = (jetzt − Beginn) / (Feierabend − Beginn)
```

Voreingestellt sind **7 Std. Soll**, **15 Min. Frühstück** und **30 Min. Mittag** –
Beginn 08:00 ergibt damit Feierabend **15:45**. Die Pausen gelten als genommen und
werden automatisch abgezogen; nichts anzuhaken.

**Unterbrechungen** (etwa die Fahrt von der Firma ins Homeoffice) lassen sich
optional eintragen. Eine Unterbrechung von 45 Minuten deckt die Pause bereits ab –
deshalb das Maximum statt der Summe. Erst eine längere verschiebt den Feierabend.

**Zeiten vor 06:00** werden nicht anerkannt und ab 06:00 gerechnet, mit Hinweis.
Diese Grenze lässt sich in den Einstellungen ändern oder leeren.

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
