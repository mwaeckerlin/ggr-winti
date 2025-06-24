import {Injectable} from '@nestjs/common'
import {exec, spawn} from 'child_process'
import {promisify} from 'util'
import {GeneratePdfDto, encodeLatexInput, htmlToLatex} from '@ggr-winti/lib'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

const execAsync = promisify(exec)

@Injectable()
export class PdfService {
  private readonly tempDir = '/tmp/ggr-winti/vorstoss-pdf'

  // Instanzmethoden für Testbarkeit
  encodeLatexInput = encodeLatexInput
  htmlToLatex = htmlToLatex

  constructor() {
    // Delete and recreate temp directory to ensure clean state
    if (fs.existsSync(this.tempDir)) fs.rmSync(this.tempDir, {recursive: true, force: true})
    fs.mkdirSync(this.tempDir, {recursive: true})
    // Cleanup old temporary files on startup
    this.cleanupOldTempFiles()
  }

  async generatePdf(dto: GeneratePdfDto) {
    // Generate unique temporary file names for parallel processing
    const timestamp = Date.now()
    const randomId = crypto.randomBytes(8).toString('hex')
    const baseName = `vorstoss_${timestamp}_${randomId}`

    const latexFile = path.join(this.tempDir, `${baseName}.tex`)
    const auxFile = path.join(this.tempDir, `${baseName}.aux`)
    const logFile = path.join(this.tempDir, `${baseName}.log`)
    const pdfFile = path.join(this.tempDir, `${baseName}.pdf`)

    let errorOccurred = false

    try {
      // 1. Generate the main content based on the DTO
      let latexContent: string
      if (dto.text) {
        latexContent = this.generateLatexWithTitle(dto)
      } else if (dto.antrag && dto.begruendung) {
        latexContent = this.generateLatexWithAntragBegruendung(dto)
      } else {
        throw new Error('Either text or both antrag and begruendung must be provided')
      }

      // 2. Write the final LaTeX file
      fs.writeFileSync(latexFile, latexContent)

      // 3. Execute pdflatex with TEXINPUTS environment variable (ohne shell)
      await new Promise<void>((resolve, reject) => {
        const pdflatex = spawn(
          '/usr/bin/pdflatex',
          ['-interaction=nonstopmode', `-output-directory=${this.tempDir}`, latexFile],
          {
            env: { ...process.env, TEXINPUTS: process.env.TEX_CLASS_PATH?.replace(/$/, ':') },
            stdio: ['ignore', 'pipe', 'pipe'],
          }
        )
        const logStream = fs.createWriteStream(logFile)
        pdflatex.stdout.pipe(logStream)
        pdflatex.stderr.pipe(logStream)
        pdflatex.on('error', (err) => reject(err))
        pdflatex.on('exit', (code) => {
          logStream.end()
          if (code === 0) resolve()
          else reject(new Error(`pdflatex exited with code ${code}`))
        })
      })

      // Verify PDF was created
      if (!fs.existsSync(pdfFile)) {
        throw new Error('PDF generation failed - no output file created')
      }

      return {
        success: true,
        pdf: fs.readFileSync(pdfFile),
        message: 'PDF generated successfully',
      }
    } catch (error) {
      errorOccurred = true
      let logContent = 'No log file found.'
      if (fs.existsSync(logFile)) {
        logContent = fs.readFileSync(logFile, 'utf-8')
      }
      throw new Error(`PDF generation failed: ${error.message}\n\n--- LaTeX Log ---\n${logContent}`)
    } finally {
      this.cleanupTempFiles([latexFile, auxFile, logFile, pdfFile])
    }
  }

  private cleanupTempFiles(files: string[]) {
    for (const file of files) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file)
        }
      } catch (error) {
        // Log error but don't throw - cleanup should not fail the main operation
        console.error(`Failed to cleanup temp file ${file}:`, error.message)
      }
    }
  }

  private cleanupOldTempFiles() {
    try {
      if (!fs.existsSync(this.tempDir)) return
      const files = fs.readdirSync(this.tempDir)
      if (!Array.isArray(files)) return
      const now = Date.now()
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours

      for (const file of files) {
        const filePath = path.join(this.tempDir, file)
        const stats = fs.statSync(filePath)

        // Remove files older than 24 hours
        if (now - stats.mtime.getTime() > maxAge) {
          try {
            fs.unlinkSync(filePath)
          } catch (error) {
            console.error(`Failed to cleanup old temp file ${filePath}:`, error.message)
          }
        }
      }
    } catch (error) {
      // Fehler ignorieren, wenn das Verzeichnis nicht existiert oder nicht lesbar ist
      return
    }
  }

  private generateLatexWithTitle(dto: GeneratePdfDto): string {
    const escapedBetreffend = this.encodeLatexInput(dto.betreffend || 'Vorstoss')
    const escapedEingereichtvon = this.encodeLatexInput(dto.eingereichtvon || 'System')
    const escapedNummer = this.encodeLatexInput(dto.nummer || '2024.001')

    // First, convert HTML-like tags to LaTeX, then escape the entire text
    const processedText = this.encodeLatexInput(this.htmlToLatex(dto.text || ''))

    return `\\documentclass[${this.buildClassOptions(dto)}]{vorstoss}
\\betreffend{${escapedBetreffend}}
\\eingereichtvon{${escapedEingereichtvon}}
\\datum{${dto.datum || '\\today'}}
\\nummer{${escapedNummer}}
\\unterstuetzer{${dto.unterstuetzer || 1}}

\\begin{document}

\\titel

${processedText}

\\end{document}`
  }

  private generateLatexWithAntragBegruendung(dto: GeneratePdfDto): string {
    const escapedBetreffend = this.encodeLatexInput(dto.betreffend || 'Vorstoss')
    const escapedEingereichtvon = this.encodeLatexInput(dto.eingereichtvon || 'System')
    const escapedNummer = this.encodeLatexInput(dto.nummer || '2024.001')

    // First, convert HTML-like tags to LaTeX, then escape
    const processedAntrag = this.encodeLatexInput(this.htmlToLatex(dto.einleitung || dto.antrag || ''))
    const processedBegruendung = this.encodeLatexInput(this.htmlToLatex(dto.fragen || dto.begruendung || ''))

    return `\\documentclass[${this.buildClassOptions(dto)}]{vorstoss}
\\betreffend{${escapedBetreffend}}
\\eingereichtvon{${escapedEingereichtvon}}
\\datum{${dto.datum || '\\today'}}
\\nummer{${escapedNummer}}
\\unterstuetzer{${dto.unterstuetzer || 1}}

\\begin{document}

\\antrag

${processedAntrag}

\\begruendung

${processedBegruendung}

\\end{document}`
  }

  private buildClassOptions(dto: GeneratePdfDto): string {
    const options: string[] = []

    if (dto.vorstosstyp) {
      options.push(dto.vorstosstyp)
    }

    if (dto.dringlich) {
      options.push('dringlich')
    }

    if (dto.budget) {
      options.push('budget')
    }

    return options.join(',')
  }
}
