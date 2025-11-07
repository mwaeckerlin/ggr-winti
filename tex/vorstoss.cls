% vorstoss.cls
\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{vorstoss}[2024/06/09 Vorlage für parlamentarische Vorstösse]

\LoadClass[a4paper,12pt]{article}

\RequirePackage[utf8]{inputenc}
\RequirePackage[ngerman]{babel}
\RequirePackage{graphicx}
\RequirePackage{geometry}
\RequirePackage{parskip}
\RequirePackage{fancyhdr}
\RequirePackage{tabularx}
\RequirePackage[scaled]{helvet}
\renewcommand{\familydefault}{\sfdefault}
\RequirePackage{ifthen}

\geometry{left=2.5cm, right=2.5cm, top=3.5cm, bottom=2.5cm}
\setlength{\headheight}{2cm}
\setlength{\headsep}{0.5cm}

% Option für den Vorstosstyp
\newcommand{\vorstosstyp}{}
\DeclareOption{motion}{\renewcommand{\vorstosstyp}{Motion}\def\flex{e}}
\DeclareOption{interpellation}{\renewcommand{\vorstosstyp}{Interpellation}\def\flex{e}}
\DeclareOption{postulat}{\renewcommand{\vorstosstyp}{Postulat}\def\flex{es}}
\DeclareOption{anfrage}{\renewcommand{\vorstosstyp}{Schriftliche Anfrage}\def\flex{e}}
\DeclareOption{beschlussantrag}{\renewcommand{\vorstosstyp}{Beschlussantrag}\def\flex{er}}
\DeclareOption{initiative}{\renewcommand{\vorstosstyp}{Parlamentarische Initiative}\def\flex{e}}

% Option für dringlich
\newcommand{\dringlich}{}
\DeclareOption{dringlich}{\renewcommand{\dringlich}{Dringlich{\flex} }}

% Option für Budget
\newcommand{\budget}{}
\DeclareOption{budget}{\renewcommand{\budget}{Budget-}}

\ProcessOptions\relax

% Felder als Kommandos
\newcommand{\betreffend}[1]{\def\@betreffend{#1}}
\newcommand{\eingereichtvon}[1]{\def\@eingereichtvon{#1}}
\newcommand{\datum}[1]{\def\@datum{#1}}
\newcommand{\nummer}[1]{\def\@nummer{#1}}
\newcommand{\unterstuetzer}[1]{\def\@unterstuetzer{#1}}

% Makros für Antrag und Begründung/EINLEITUNG und FRAGEN je nach Typ
\newcommand{\antrag}{%
  \ifthenelse{\equal{\vorstosstyp}{Schriftliche Anfrage}}{\textbf{Einleitung}\par}{\textbf{Antrag}\par}%
  \gdef\@hasantrag{used}%
}
\newcommand{\begruendung}{%
  \ifthenelse{\equal{\vorstosstyp}{Schriftliche Anfrage}}{\textbf{Fragen}\par}{\textbf{Begr\"undung}\par}%
  \gdef\@hasbegruendung{used}%
}
\newcommand{\titel}{%
  \ifthenelse{\equal{\vorstosstyp}{Schriftliche Anfrage}}{\textbf{Einleitung und Fragen}\par}{\textbf{Antrag und Begr\"undung}\par}%
}
\newcommand{\einleitung}{\antrag}
\newcommand{\fragen}{\begruendung}

% Defaultwerte
\def\@betreffend{}
\def\@eingereichtvon{}
\def\@datum{\today}
\def\@nummer{}
\def\@unterstuetzer{1}
\def\@hasantrag{}
\def\@hasbegruendung{}

% Kopfzeile mit Logo
\pagestyle{fancy}
\fancyhf{}
\fancyhead[R]{%
  \includegraphics[height=2cm]{logo.png}%
}
\renewcommand{\headrulewidth}{0pt}

% Titel und Felder automatisch vor \begin{document}
\AtBeginDocument{
  \vspace*{1.5cm}
  {\LARGE\bfseries \dringlich\budget\vorstosstyp}
  \vspace{1cm}

  \noindent
  \begin{tabularx}{\textwidth}{@{}lX@{}}
    betreffend:         & \textbf{\@betreffend} \\[0.5em]
    eingereicht von:    & \@eingereichtvon      \\[0.5em]
    am:                 & \@datum               \\[0.5em]
    Anzahl Unterstützer:& \@unterstuetzer\hfill\textnormal{Geschäftsnummer:~\@nummer} \\
  \end{tabularx}
  
  \vspace{0.7cm}
  \hrule
  \vspace{0.7cm}
} 

% Schusterjungen- und Hurenkindregelung
\clubpenalty=10000
\widowpenalty=10000 