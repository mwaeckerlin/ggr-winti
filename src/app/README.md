# Vorstoss-Frontend

## Funktionsweise für Parlamentarier

Ein Parlamentarier erzeugt einen Vorstoss. Dafür gibt er alle Felder ein, **außer**:
- Anzahl Miteinreicher
- Geschäftsnummer

## Es gibt vier Möglichkeiten zur Weiterverarbeitung:

1. **Hochladen einer JSON-Datei**
   - Der Nutzer kann eine JSON-Datei mit den Vorstoss-Daten (im Format des DTO) hochladen.

2. **Runterladen der Daten als JSON**
   - Die eingegebenen Daten können als JSON-Datei im PDF-DTO-Format heruntergeladen werden.

3. **Runterladen als PDF-Datei**
   - Die Daten werden an den Server gesendet, der daraus ein PDF generiert und dieses zum Download anbietet.

4. **Kopieren eines Links**
   - Es wird ein Link generiert, der alle Vorstoss-Daten enthält.
   - Die URL-Basis stammt aus der ENV-Variablen `LINK_ACCESS`.
   - Die Daten werden wie folgt in den Link eingebettet:
     - Das PDF-DTO-JSON wird erzeugt
     - Dieses JSON wird mit einer geeigneten Library (z.B. bz2) gezippt
     - Das finale Binary wird base64-codiert
     - Der Link enthält einen Query-Parameter: `?file=...` mit dem base64-codierten Inhalt

## Nutzung des Links durch den Parlamentsdienst

- Der Parlamentsdienst erhält den Link und öffnet ihn im Browser.
- Die Daten werden aus dem Query-Parameter `file` extrahiert, entpackt und als JSON interpretiert (wie beim Hochladen einer JSON-Datei).
- **Bearbeitungslogik:**
  - Wenn der Link genutzt wird, können **nur noch folgende Felder bearbeitet werden:**
    - `datum`
    - `nummer`
    - `unterstuetzer`
  - Diese Felder sind dann editierbar, alle anderen Felder sind gesperrt.
  - Beim Parlamentarier waren die Felder `nummer` und `unterstuetzer` gesperrt, jetzt sind sie bearbeitbar.
- Die gleichen Action-Buttons (z.B. PDF generieren, JSON speichern, Link kopieren) stehen zur Verfügung.

## Zusammenfassung

- **Parlamentarier:** Gibt alle Daten ein (außer Nummer und Unterstützer), kann alles exportieren, PDF generieren oder Link kopieren.
- **Parlamentsdienst:** Nutzt den Link oder lädt JSON hoch, kann nur noch Datum, Nummer und Unterstützer bearbeiten, alle anderen Felder sind gesperrt, hat die gleichen Aktionsmöglichkeiten.
