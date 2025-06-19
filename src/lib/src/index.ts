/**
 * LaTeX Input Encoding Library
 * Escapes LaTeX commands and special characters for safe input
 */

export function encodeLatexInput(text: string): string {
  return text
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
    .replace(/_/g, '\\_');
}

export function validateVorstosstyp(typ: string): boolean {
  const validTypes = ['motion', 'interpellation', 'postulat', 'anfrage', 'beschlussantrag', 'initiative'];
  return validTypes.includes(typ);
}

export function validateLength(text: string, maxLength: number = 1000): boolean {
  return text.length <= maxLength;
}

export function validateRequired(text: string): boolean {
  return text.trim().length > 0;
}

export function htmlToLatex(html: string): string {
  // Simple HTML to LaTeX conversion
  return html
    .replace(/<strong>(.*?)<\/strong>/g, '\\textbf{$1}')
    .replace(/<em>(.*?)<\/em>/g, '\\textit{$1}')
    .replace(/<br\s*\/?>/g, '\\\\')
    .replace(/<p>(.*?)<\/p>/g, '$1\\\\')
    .replace(/<[^>]*>/g, ''); // Remove other HTML tags
}

export class VorstossValidator {
  static encodeLatexInput = encodeLatexInput;
  static validateVorstosstyp = validateVorstosstyp;
  static validateLength = validateLength;
  static validateRequired = validateRequired;
  static htmlToLatex = htmlToLatex;
} 