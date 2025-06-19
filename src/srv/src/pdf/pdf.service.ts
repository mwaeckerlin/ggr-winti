import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { GeneratePdfDto } from './dto/generate-pdf.dto';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const execAsync = promisify(exec);

// Temporary local implementations until library is properly linked
function encodeLatexInput(text: string): string {
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/&/g, '\\&')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/_/g, '\\_')
}

function htmlToLatex(html: string): string {
  return html
    .replace(/<strong>(.*?)<\/strong>/g, '\\textbf{$1}')
    .replace(/<em>(.*?)<\/em>/g, '\\textit{$1}')
    .replace(/<br\s*\/?>/g, '\\\\')
    .replace(/<p>(.*?)<\/p>/g, '$1\\\\')
    .replace(/<[^>]*>/g, '')
}

@Injectable()
export class PdfService {
  private readonly tempDir = '/tmp/vorstoss-pdf';

  constructor() {
    // Delete and recreate temp directory to ensure clean state
    if (fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, {recursive: true, force: true})
    }
    fs.mkdirSync(this.tempDir, {recursive: true})
    
    // Cleanup old temporary files on startup
    this.cleanupOldTempFiles()
  }

  async generatePdf(dto: GeneratePdfDto) {
    // Generate unique temporary file names for parallel processing
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(8).toString('hex');
    const baseName = `vorstoss_${timestamp}_${randomId}`;
    
    const latexFile = path.join(this.tempDir, `${baseName}.tex`);
    const auxFile = path.join(this.tempDir, `${baseName}.aux`);
    const logFile = path.join(this.tempDir, `${baseName}.log`);
    const pdfFile = path.join(this.tempDir, `${baseName}.pdf`);
    
    try {
      // 1. LaTeX-Kommandos escapen
      let content = '';
      
      if (dto.text) {
        content = this.generateLatexWithTitle(dto);
      } else if (dto.antrag && dto.begruendung) {
        content = this.generateLatexWithAntragBegruendung(dto);
      } else {
        throw new Error('Either text or both antrag and begruendung must be provided');
      }

      // 2. HTML2LaTeX (nur für den Haupt-text / antrag / begruendung)
      content = htmlToLatex(content);

      // 3. pdflatex aufrufen
      fs.writeFileSync(latexFile, content);
      
      await execAsync(`pdflatex -interaction=nonstopmode -output-directory=${this.tempDir} ${latexFile}`);
      
      // Verify PDF was created
      if (!fs.existsSync(pdfFile)) {
        throw new Error('PDF generation failed - no output file created');
      }
      
      return {
        success: true,
        pdf: fs.readFileSync(pdfFile),
        message: 'PDF generated successfully'
      };
    } catch (error) {
      throw new Error(`PDF generation failed: ${error.message}`);
    } finally {
      // Always cleanup temporary files, even on error
      this.cleanupTempFiles([latexFile, auxFile, logFile, pdfFile]);
    }
  }

  private cleanupTempFiles(files: string[]) {
    for (const file of files) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch (error) {
        // Log error but don't throw - cleanup should not fail the main operation
        console.error(`Failed to cleanup temp file ${file}:`, error.message);
      }
    }
  }

  private cleanupOldTempFiles() {
    try {
      const files = fs.readdirSync(this.tempDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = fs.statSync(filePath);
        
        // Remove files older than 24 hours
        if (now - stats.mtime.getTime() > maxAge) {
          try {
            fs.unlinkSync(filePath);
          } catch (error) {
            console.error(`Failed to cleanup old temp file ${filePath}:`, error.message);
          }
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old temp files:', error.message);
    }
  }

  private generateLatexWithTitle(dto: GeneratePdfDto): string {
    const escapedBetreffend = encodeLatexInput(dto.betreffend || 'Vorstoss');
    const escapedEingereichtvon = encodeLatexInput(dto.eingereichtvon || 'System');
    const escapedNummer = encodeLatexInput(dto.nummer || '2024.001');
    
    return `\\documentclass[${this.buildClassOptions(dto)}]{vorstoss}
\\betreffend{${escapedBetreffend}}
\\eingereichtvon{${escapedEingereichtvon}}
\\datum{${dto.datum || '\\today'}}
\\nummer{${escapedNummer}}
\\unterstuetzer{${dto.unterstuetzer || 1}}

\\begin{document}

\\titel

${encodeLatexInput(dto.text || '')}

\\end{document}`;
  }

  private generateLatexWithAntragBegruendung(dto: GeneratePdfDto): string {
    const escapedBetreffend = encodeLatexInput(dto.betreffend || 'Vorstoss');
    const escapedEingereichtvon = encodeLatexInput(dto.eingereichtvon || 'System');
    const escapedNummer = encodeLatexInput(dto.nummer || '2024.001');
    
    return `\\documentclass[${this.buildClassOptions(dto)}]{vorstoss}
\\betreffend{${escapedBetreffend}}
\\eingereichtvon{${escapedEingereichtvon}}
\\datum{${dto.datum || '\\today'}}
\\nummer{${escapedNummer}}
\\unterstuetzer{${dto.unterstuetzer || 1}}

\\begin{document}

\\antrag

${encodeLatexInput(dto.antrag || '')}

\\begruendung

${encodeLatexInput(dto.begruendung || '')}

\\end{document}`;
  }

  private buildClassOptions(dto: GeneratePdfDto): string {
    const options: string[] = [];
    
    if (dto.vorstosstyp) {
      options.push(dto.vorstosstyp);
    }
    
    if (dto.dringlich) {
      options.push('dringlich');
    }
    
    if (dto.budget) {
      options.push('budget');
    }
    
    return options.join(',');
  }
}
