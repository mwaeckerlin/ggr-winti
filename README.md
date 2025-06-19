# Vorstoss LaTeX-Klasse

Eine LaTeX-Klasse für parlamentarische Vorstösse (Motionen, Interpellationen, Postulate, Schriftliche Anfragen) im Parlament Winterthur.

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
- **Klammern ohne Spaces**: `{a}` statt `{ a }`
- **Import-Statements**: `import {a, b} from 'module'` statt `import { a, b } from 'module'`
- **Funktionsparameter**: `function(a, b)` statt `function( a, b )`
- **Objekt-Literale**: `{a: 1, b: 2}` statt `{ a: 1, b: 2 }`
- **Keine unnötigen Variablen**: Variablen nur erstellen, wenn sie mindestens zweimal verwendet werden
- **Keine unnötigen Klammern**: Einzeiler ohne Klammern, nur bei mehreren Statements

### Beispiele

```typescript
// ✅ Korrekt - Variable wird zweimal verwendet
const escapedText = encodeLatexInput(text)
return `\\documentclass{${escapedText}}`

// ❌ Falsch - Variable wird nur einmal verwendet
const escapedText = encodeLatexInput(text)
return `\\documentclass{${encodeLatexInput(text)}}`

// ✅ Korrekt - Einzeiler ohne Klammern
if (condition) return true
for (const item of items) process(item)

// ❌ Falsch - Unnötige Klammern bei Einzeilern
if (condition) { return true }
for (const item of items) { process(item) }

// ✅ Korrekt - Klammern nur bei mehreren Statements
if (condition) {
  doSomething()
  doSomethingElse()
}
```

### LaTeX

- **Konsistente Einrückung**: 2 Leerzeichen pro Ebene
- **Leerzeilen**: Zwischen logischen Abschnitten
- **Kommentare**: `% Kommentar` mit Leerzeichen nach %

## Lizenz

Diese LaTeX-Klasse steht unter der MIT-Lizenz zur freien Verfügung. 