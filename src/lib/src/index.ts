import {GeneratePdfDto, Vorstosstyp} from './dto'

export * from './dto'
/**
 * LaTeX Input Encoding Library
 * Escapes LaTeX commands and special characters for safe input
 */

export function encodeLatexInput(text: string): string {
  return (
    text
      // LaTeX-Befehle escapen
      .replace(/\\/g, '\\textbackslash{}')

      // LaTeX-Sonderzeichen escapen
      .replace(/%/g, '\\%')
      .replace(/\$/g, '\\$')
      .replace(/#/g, '\\#')
      .replace(/&/g, '\\&')
      .replace(/{/g, '\\{')
      .replace(/}/g, '\\}')
      .replace(/~/g, '\\textasciitilde{}')
      .replace(/\^/g, '\\textasciicircum{}')
      .replace(/_/g, '\\_')
  )
}

export function validateVorstosstyp(typ: string): boolean {
  const validTypes = ['motion', 'interpellation', 'postulat', 'anfrage', 'beschlussantrag', 'initiative']
  return validTypes.includes(typ)
}

export function validateLength(text: string, maxLength: number = 1000): boolean {
  return text.length <= maxLength
}

export function validateRequired(text: string): boolean {
  return text.trim().length > 0
}

export function htmlToLatex(html: string): string {
  // Simple HTML to LaTeX conversion
  return html
    .replace(/<strong>(.*?)<\/strong>/g, '\\textbf{$1}')
    .replace(/<em>(.*?)<\/em>/g, '\\textit{$1}')
    .replace(/<br\s*\/?>/g, '\\\\')
    .replace(/<p>(.*?)<\/p>/g, '$1\\\\')
    .replace(/<[^>]*>/g, '') // Remove other HTML tags
}

export class VorstossValidator {
  static encodeLatexInput = encodeLatexInput
  static validateVorstosstyp = validateVorstosstyp
  static validateLength = validateLength
  static validateRequired = validateRequired
  static htmlToLatex = htmlToLatex
}

export function formatDate(date: Date | string | undefined): string {
  const d = date ? new Date(date) : new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function sanitize(str: string): string {
  // Nur a-z, äöü, - und Ziffern, alles andere zu _
  return (str || '')
    .normalize('NFD')
    .replace(/[^a-zA-Z0-9äöüÄÖÜ\-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function sanitizeFilename(name: string): string {
  // Ersetze alles, was nicht Buchstabe, Ziffer oder - ist, durch _
  return name
    .replace(/[^a-zA-Z0-9äöüÄÖÜ\-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function getVorstosstypWithPrefix(
  vorstosstyp: Vorstosstyp | undefined,
  dringlich: boolean | undefined,
  budget: boolean | undefined,
): string | null {
  if (!vorstosstyp) {
    return null
  }

  const typ = vorstosstyp.charAt(0).toUpperCase() + vorstosstyp.slice(1)

  if (dringlich) {
    let adjective = 'Dringliches' // neuter default (das Postulat)
    if (
      ['motion', 'interpellation', 'anfrage', 'initiative'].includes(vorstosstyp)
    ) {
      adjective = 'Dringliche' // feminine
    } else if (vorstosstyp === 'beschlussantrag') {
      adjective = 'Dringlicher' // masculine
    }
    return `${adjective}_${typ}`
  }

  if (budget) {
    return `Budget_${typ}`
  }

  return typ
}

export function generateFilename(dto: GeneratePdfDto): string {
  const parts: (string | null)[] = []

  // 1. Datum
  parts.push(formatDate(dto.datum))

  // 2. Nummer
  parts.push(dto.nummer || null)

  // 3. Vorstosstyp (mit Prefix)
  parts.push(getVorstosstypWithPrefix(dto.vorstosstyp, dto.dringlich, dto.budget))

  // 4. Betreffend
  parts.push(dto.betreffend || null)

  const combinedName = parts.filter(Boolean).join('_')

  return sanitizeFilename(combinedName)
}
