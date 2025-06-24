# Vorstoss LaTeX-Klasse und Service

Dieses Projekt ist mehr als nur eine LaTeX-Klasse für parlamentarische Vorstösse (Motionen, Interpellationen, Postulate, Schriftliche Anfragen) im Parlament Winterthur:

- **LaTeX-Klasse:** Kann auch eigenständig für die manuelle Dokumentenerstellung genutzt werden.
- **Web-Service:** Die LaTeX-Klasse ist in einen Service mit Web-Frontend und API eingebettet. Damit können Vorstösse bequem im Browser ausgefüllt, als PDF generiert und heruntergeladen werden.
- **API:** Automatisierte PDF-Erstellung und Integration in andere Systeme ist über die bereitgestellte Schnittstelle möglich.

## Zweck

Diese LaTeX-Klasse erstellt automatisch professionell formatierte Dokumente für parlamentarische Vorstösse mit:

- **Standardisierte Formatierung** nach parlamentarischen Konventionen
- **Automatische Kopfzeile** mit Logo
- **Vorausgefüllte Felder** für Metadaten (betreffend, eingereicht von, Datum, etc.)
- **Verschiedene Vorstosstypen**: Motion, Interpellation, Postulat, Schriftliche Anfrage
- **Flexible Titel**: Automatische oder manuelle Titel für Antrag und Begründung

## Anwendung

### Grundlegende Verwendung

```latex
\documentclass[motion]{vorstoss}

% Metadaten setzen
\betreffend{Verbesserung der öffentlichen Verkehrsmittel}
\eingereichtvon{Max Mustermann, Kantonsrat}
\datum{19. Juni 2025}
\nummer{2025.123}
\unterstuetzer{5}

\begin{document}

\antrag

Der Regierungsrat wird beauftragt, ein Konzept für die Verbesserung der öffentlichen Verkehrsmittel im Kanton zu erarbeiten.

\begruendung

Die aktuellen öffentlichen Verkehrsmittel entsprechen nicht mehr den Anforderungen der Bevölkerung.

\end{document}
```

### Verfügbare Vorstosstypen

```latex
\documentclass[motion]{vorstoss}          % Motion
\documentclass[interpellation]{vorstoss}  % Interpellation
\documentclass[postulat]{vorstoss}        % Postulat
\documentclass[anfrage]{vorstoss}         % Schriftliche Anfrage
\documentclass[beschlussantrag]{vorstoss} % Beschlussantrag
\documentclass[initiative]{vorstoss}      % Parlamentarische Initiative
```

### Dringliche Vorstösse

Alle Vorstosstypen können als dringlich markiert werden. Die Formulierung passt sich grammatikalisch an:

```latex
\documentclass[motion,dringlich]{vorstoss}          % Dringliche Motion
\documentclass[interpellation,dringlich]{vorstoss}  % Dringliche Interpellation
\documentclass[postulat,dringlich]{vorstoss}        % Dringliches Postulat
\documentclass[anfrage,dringlich]{vorstoss}         % Dringliche Schriftliche Anfrage
\documentclass[beschlussantrag,dringlich]{vorstoss} % Dringlicher Beschlussantrag
\documentclass[initiative,dringlich]{vorstoss}      % Dringliche Parlamentarische Initiative
```

Die Reihenfolge der Optionen spielt keine Rolle: `[motion,dringlich]` und `[dringlich,motion]` sind gleichwertig.

### Budget-Vorstösse

Alle Vorstosstypen können als Budget-Vorstösse markiert werden:

```latex
\documentclass[motion,budget]{vorstoss}             % Budget-Motion
\documentclass[motion,dringlich,budget]{vorstoss}   % Dringliche Budget-Motion
\documentclass[postulat,budget]{vorstoss}           % Budget-Postulat
\documentclass[postulat,dringlich,budget]{vorstoss} % Dringliches Budget-Postulat
```

### Verfügbare Makros

- `\antrag` - Erstellt einen "Antrag"-Titel
- `\begruendung` - Erstellt einen "Begründung"-Titel
- `\titel` - Erstellt einen "Antrag und Begründung"-Titel (manuell)

### Metadaten-Felder

- `\betreffend{Text}` - Betreff des Vorstosses
- `\eingereichtvon{Name}` - Name des Einreichers
- `\datum{Datum}` - Einreichungsdatum (Standard: heute)
- `\nummer{Nummer}` - Geschäftsnummer
- `\unterstuetzer{Anzahl}` - Anzahl Unterstützer (Standard: 1)

## 3. Wie installieren

### Linux

```bash
# Verzeichnis erstellen
mkdir -p ~/texmf/tex/latex/vorstoss

# Symbolische Links erstellen (empfohlen für Entwicklung)
ln -s /pfad/zu/vorstoss.cls ~/texmf/tex/latex/vorstoss/
ln -s /pfad/zu/logo.png ~/texmf/tex/latex/vorstoss/

# Oder Dateien kopieren (für finale Installation)
cp vorstoss.cls ~/texmf/tex/latex/vorstoss/
cp logo.png ~/texmf/tex/latex/vorstoss/

# LaTeX-System aktualisieren
texhash ~/texmf
```

### Windows

1. **MiKTeX**: Kopieren Sie die Dateien in `%USERPROFILE%\texmf\tex\latex\vorstoss\`
2. **TeX Live**: Kopieren Sie die Dateien in `%USERPROFILE%\texmf\tex\latex\vorstoss\`
3. Führen Sie `texhash` aus oder aktualisieren Sie über die MiKTeX Console

### macOS

```bash
# Verzeichnis erstellen
mkdir -p ~/Library/texmf/tex/latex/vorstoss

# Dateien kopieren
cp vorstoss.cls ~/Library/texmf/tex/latex/vorstoss/
cp logo.png ~/Library/texmf/tex/latex/vorstoss/

# LaTeX-System aktualisieren
texhash ~/Library/texmf
```

## Installation von LaTeX

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install texlive-full
sudo apt install texlive-lang-german
```

### Linux (Fedora/RHEL/CentOS)

```bash
sudo dnf install texlive-scheme-full
sudo dnf install texlive-lang-german
```

### Windows

1. **MiKTeX** (empfohlen):
   - Download von https://miktex.org/
   - Installer ausführen
   - Deutsche Sprachunterstützung über MiKTeX Console installieren

2. **TeX Live**:
   - Download von https://tug.org/texlive/
   - Installer ausführen
   - Deutsche Pakete über `tlmgr` installieren

### macOS

1. **MacTeX** (empfohlen):
   ```bash
   # Über Homebrew
   brew install --cask mactex
   
   # Oder Download von https://tug.org/mactex/
   ```

2. **TeX Live**:
   ```bash
   # Über Homebrew
   brew install texlive
   ```

### Editor-Empfehlungen

- **Linux**: TeXstudio, TeXmaker, VS Code mit LaTeX Workshop
- **Windows**: TeXstudio, TeXmaker, Overleaf (Online)
- **macOS**: TeXstudio, TeXmaker, VS Code mit LaTeX Workshop

## Codierrichtlinien

### TypeScript/JavaScript

- **Keine unnötigen Semikolons**: Semikolons nur verwenden, wenn sie syntaktisch erforderlich sind
- **Nach jedem Komma ein Space**: z.B. `a, b, c` (außer in Objektliteralen, Funktionsparametern und Imports: `{a,b}`, `function(a,b)`, `import {a,b} from 'x'`)
- **Vor und nach jedem `=>` ein Space**: z.B. `(a, b) => c` (außer in Objektliteralen, Funktionsparametern und Imports)
- **Nach jedem `if` ein Space vor der Klammer**: z.B. `if (x > 0)`
- **Bei Funktionsdefinitionen KEIN Space zwischen Funktionsname und Klammer**: z.B. `function(a, b)`
- **Objekt-Literale, Funktionsparameter, Imports: KEIN Space in Klammern**: `{a: 1, b: 2}`, `function(a, b)`, `import {a, b} from 'x'`
- **Keine unnötigen Variablen**: Variablen nur erstellen, wenn sie mindestens zweimal verwendet werden
- **Keine unnötigen Klammern**: Einzeiler ohne Klammern, nur bei mehreren Statements
- **Bevorzuge Arrow-Funktionen (`=>`)**: Arrow-Funktionen sind der Standard für Funktionen, außer es ist zwingend eine klassische Funktion nötig. Arrow-Funktionen sollten möglichst klar und ausdrucksstark formuliert sein.
- **Imports immer auf einer Zeile**: Alle importierten Member aus einem Modul müssen in einer einzigen `import`-Anweisung auf einer Zeile stehen.
- **Single Source of Truth (Kein Copy-Paste)**: Code darf nicht dupliziert werden. Logik, Typen oder Konstanten, die an mehr als einer Stelle benötigt werden, müssen in einer zentralen, wiederverwendbaren Funktion oder Definition in der `lib`-Bibliothek gekapselt und von dort importiert werden.

### Beispiele

```typescript
// ✅ Korrekt - Variable wird zweimal verwendet
const escapedText = encodeLatexInput(text)

// ✅ Korrekt - Komma mit Space, Arrow mit Space, if mit Space
const arr = [1, 2, 3]
arr.map((a, b) => a + b)
if (arr.length > 0) console.log(arr)

// ✅ Korrekt - Objektliteral, Funktionsparameter, Import ohne Space in Klammern
const obj = {a: 1, b: 2}
const foo = (a, b) => a + b
import {a, b} from 'modulename'

// ✅ Korrekt - Arrow-Funktion bevorzugt, klar und ausdrucksstark
const sum = (a, b) => a + b
const isEven = n => n % 2 === 0
const logIfPositive = n => {if (n > 0) console.log(n)}
```

### LaTeX

- **Immer UTF-8**: Immer UTF-8 als Zeichencodierung verwenden.
- **Konsistente Einrückung**: 2 Leerzeichen pro Ebene
- **Leerzeilen**: Zwischen logischen Abschnitten
- **Kommentare**: `% Kommentar` mit Leerzeichen nach %

### Regeln für die KI

Dieses Projekt ist 100% mit KI erstellt und nicht von Hand codiert.

- Halte dich immer an die Regeln und die Corierrichtlichnien, es sei denn der Befehl lautet anders.
- Dieses Projekt ist deutsch, daher verwende hier Deutsch.
- Fasse dich kurz und nutze keine Floskeln.
- Antworte wenn möglich in nur einem Satz.
- ChangeLog-Zeilen nur bei wesentlichen größeren Änderungen. Mindestens eine Zeile, maximal 5, nur bei vielen wichtigen Änderungen mehr.
- Führe Schritte aus einem Befehl ungefragt aus, es sei denn ich stelle eine Frage, dann antworte nur auf die Frage.
- Mache immer automatischen Änderungen, frage nie nach Bestätigung.
- Nutze Shell-Befehle, wenn notwendig, auch hier ohne Bestätigung.
- Immer machen, niemals fragen!
- Kommentiere Code nur wo notwendig, dann aber knapp und verständlich.
- Äussere niemals Vermutungen, analisiere immer den Code, die Ausgabe, die Umgebung.
- Wenn du etwas weisst und nicht herausfinden kannst, dann vermute nicht, sondern stelle Fragen. Wenn du es dann immer noch nicht weisst, sag, dass du es nicht weisst, stelle niemals Vermutungen an, liefere nur Fakten und Analysen.

## Lizenz

Diese LaTeX-Klasse steht unter der MIT-Lizenz zur freien Verfügung.

- Entferne unnütze Beispiele (z.B. Hello World, Default-Controller, Dummy-Content) immer sofort nach der Installation.
