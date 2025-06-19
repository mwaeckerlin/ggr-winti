FROM mwaeckerlin/nestjs:latest

# Install LaTeX packages for Alpine Linux
RUN apk add --no-cache \
    texlive \
    texlive-lang-german \
    texlive-fonts-recommended \
    texlive-latex-extra \
    texlive-latex-recommended \
    texlive-pictures \
    texlive-science \
    texlive-bibtex-extra \
    texlive-publishers \
    texlive-latex-base \
    texlive-latex-bin \
    texlive-latex-fonts \
    texlive-latex-recommended \
    texlive-latex-extra \
    texlive-lang-german \
    texlive-fonts-recommended \
    texlive-pictures \
    texlive-science \
    texlive-bibtex-extra \
    texlive-publishers \
    && rm -rf /var/cache/apk/*

# Copy LaTeX class files
COPY ../../tex/vorstoss.cls /usr/local/share/texmf/tex/latex/vorstoss/
COPY ../../tex/logo.png /usr/local/share/texmf/tex/latex/vorstoss/

# Update LaTeX file database
RUN texhash /usr/local/share/texmf

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"] 