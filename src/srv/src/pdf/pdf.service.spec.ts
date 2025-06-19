import { Test, TestingModule } from '@nestjs/testing';
import { PdfService } from './pdf.service';
import { GeneratePdfDto, Vorstosstyp } from './dto/generate-pdf.dto';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

// Mock the @ggr-winti/lib module
jest.mock('@ggr-winti/lib', () => ({
  encodeLatexInput: jest.fn((text: string) => `escaped_${text}`),
  htmlToLatex: jest.fn((html: string) => html.replace(/<[^>]*>/g, ''))
}));

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  rmSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(),
  unlinkSync: jest.fn(),
  readdirSync: jest.fn(),
  statSync: jest.fn()
}));

// Mock child_process
jest.mock('child_process', () => ({
  exec: jest.fn()
}));

describe('PdfService', () => {
  let service: PdfService;
  let mockFs: jest.Mocked<typeof fs>;
  let mockExec: jest.MockedFunction<typeof exec>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfService]
    }).compile();

    service = module.get<PdfService>(PdfService);
    mockFs = fs as jest.Mocked<typeof fs>;
    mockExec = exec as jest.MockedFunction<typeof exec>;

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('generatePdf', () => {
    const mockDto: GeneratePdfDto = {
      text: 'Test content',
      vorstosstyp: Vorstosstyp.POSTULAT,
      betreffend: 'Test Vorstoss',
      eingereichtvon: 'Test User',
      nummer: '2024.001',
      unterstuetzer: 1
    };

    beforeEach(() => {
      // Setup default mocks
      mockFs.existsSync.mockReturnValue(false);
      mockFs.readFileSync.mockReturnValue(Buffer.from('fake-pdf-content'));
      mockExec.mockImplementation((cmd, callback: any) => {
        if (callback) callback(null, { stdout: '', stderr: '' })
        return {} as any;
      });
    });

    it('should generate PDF with text content', async () => {
      const result = await service.generatePdf(mockDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('PDF generated successfully');
      expect(result.pdf).toBeInstanceOf(Buffer);
      expect(mockFs.writeFileSync).toHaveBeenCalled();
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('pdflatex -interaction=nonstopmode'),
        expect.any(Function)
      );
    });

    it('should generate PDF with antrag and begruendung', async () => {
      const dtoWithAntrag: GeneratePdfDto = {
        antrag: 'Test antrag',
        begruendung: 'Test begruendung',
        vorstosstyp: Vorstosstyp.MOTION,
        betreffend: 'Test Vorstoss',
        eingereichtvon: 'Test User'
      };

      const result = await service.generatePdf(dtoWithAntrag);

      expect(result.success).toBe(true);
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('\\antrag')
      );
    });

    it('should throw error when neither text nor antrag and begruendung provided', async () => {
      const invalidDto: GeneratePdfDto = {
        vorstosstyp: Vorstosstyp.POSTULAT
      };

      await expect(service.generatePdf(invalidDto)).rejects.toThrow(
        'Either text or both antrag and begruendung must be provided'
      );
    });

    it('should throw error when only antrag provided', async () => {
      const invalidDto: GeneratePdfDto = {
        antrag: 'Test antrag',
        vorstosstyp: Vorstosstyp.POSTULAT
      };

      await expect(service.generatePdf(invalidDto)).rejects.toThrow(
        'Either text or both antrag and begruendung must be provided'
      );
    });

    it('should throw error when only begruendung provided', async () => {
      const invalidDto: GeneratePdfDto = {
        begruendung: 'Test begruendung',
        vorstosstyp: Vorstosstyp.POSTULAT
      };

      await expect(service.generatePdf(invalidDto)).rejects.toThrow(
        'Either text or both antrag and begruendung must be provided'
      );
    });

    it('should handle pdflatex execution error', async () => {
      mockExec.mockImplementation((cmd, callback: any) => {
        if (callback) callback(new Error('pdflatex failed'), { stdout: '', stderr: 'error' })
        return {} as any
      })

      await expect(service.generatePdf(mockDto)).rejects.toThrow(
        'PDF generation failed: pdflatex failed'
      )
    })

    it('should handle missing PDF output file', async () => {
      mockFs.existsSync.mockImplementation((path) => {
        if (path.toString().endsWith('.pdf')) return false
        return true
      })

      await expect(service.generatePdf(mockDto)).rejects.toThrow(
        'PDF generation failed - no output file created'
      )
    })

    it('should cleanup temporary files on success', async () => {
      await service.generatePdf(mockDto)

      expect(mockFs.unlinkSync).toHaveBeenCalledTimes(4) // .tex, .aux, .log, .pdf
    })

    it('should cleanup temporary files on error', async () => {
      mockExec.mockImplementation((cmd, callback: any) => {
        if (callback) callback(new Error('pdflatex failed'), {stdout: '', stderr: 'error'})
        return {} as any
      })

      await expect(service.generatePdf(mockDto)).rejects.toThrow()

      expect(mockFs.unlinkSync).toHaveBeenCalledTimes(4) // Cleanup still happens
    })
  })

  describe('buildClassOptions', () => {
    it('should build options string with vorstosstyp only', () => {
      const dto: GeneratePdfDto = {
        text: 'test',
        vorstosstyp: Vorstosstyp.MOTION
      }

      const result = service['buildClassOptions'](dto)
      expect(result).toBe('motion')
    })

    it('should build options string with dringlich', () => {
      const dto: GeneratePdfDto = {
        text: 'test',
        vorstosstyp: Vorstosstyp.POSTULAT,
        dringlich: true
      }

      const result = service['buildClassOptions'](dto)
      expect(result).toBe('postulat,dringlich')
    })

    it('should build options string with budget', () => {
      const dto: GeneratePdfDto = {
        text: 'test',
        vorstosstyp: Vorstosstyp.INTERPELLATION,
        budget: true
      }

      const result = service['buildClassOptions'](dto)
      expect(result).toBe('interpellation,budget')
    })

    it('should build options string with all options', () => {
      const dto: GeneratePdfDto = {
        text: 'test',
        vorstosstyp: Vorstosstyp.BESCHLUSSANTRAG,
        dringlich: true,
        budget: true
      }

      const result = service['buildClassOptions'](dto)
      expect(result).toBe('beschlussantrag,dringlich,budget')
    })

    it('should return empty string when no options', () => {
      const dto: GeneratePdfDto = {
        text: 'test'
      }

      const result = service['buildClassOptions'](dto)
      expect(result).toBe('')
    })
  })

  describe('generateLatexWithTitle', () => {
    it('should generate correct LaTeX with title', () => {
      const dto: GeneratePdfDto = {
        text: 'Test content',
        vorstosstyp: Vorstosstyp.POSTULAT,
        betreffend: 'Test Vorstoss',
        eingereichtvon: 'Test User',
        datum: '2024-01-01',
        nummer: '2024.001',
        unterstuetzer: 5
      }

      const result = service['generateLatexWithTitle'](dto)

      expect(result).toContain('\\documentclass[postulat]{vorstoss}')
      expect(result).toContain('\\betreffend{escaped_Test Vorstoss}')
      expect(result).toContain('\\eingereichtvon{escaped_Test User}')
      expect(result).toContain('\\datum{2024-01-01}')
      expect(result).toContain('\\nummer{escaped_2024.001}')
      expect(result).toContain('\\unterstuetzer{5}')
      expect(result).toContain('\\titel')
      expect(result).toContain('escaped_Test content')
    })

    it('should use default values when not provided', () => {
      const dto: GeneratePdfDto = {
        text: 'Test content'
      }

      const result = service['generateLatexWithTitle'](dto)

      expect(result).toContain('\\betreffend{escaped_Vorstoss}')
      expect(result).toContain('\\eingereichtvon{escaped_System}')
      expect(result).toContain('\\datum{\\today}')
      expect(result).toContain('\\nummer{escaped_2024.001}')
      expect(result).toContain('\\unterstuetzer{1}')
    })
  })

  describe('generateLatexWithAntragBegruendung', () => {
    it('should generate correct LaTeX with antrag and begruendung', () => {
      const dto: GeneratePdfDto = {
        antrag: 'Test antrag',
        begruendung: 'Test begruendung',
        vorstosstyp: Vorstosstyp.MOTION,
        betreffend: 'Test Vorstoss',
        eingereichtvon: 'Test User'
      }

      const result = service['generateLatexWithAntragBegruendung'](dto)

      expect(result).toContain('\\documentclass[motion]{vorstoss}')
      expect(result).toContain('\\antrag')
      expect(result).toContain('escaped_Test antrag')
      expect(result).toContain('\\begruendung')
      expect(result).toContain('escaped_Test begruendung')
    })
  })

  describe('cleanupTempFiles', () => {
    it('should cleanup existing files', () => {
      mockFs.existsSync.mockReturnValue(true)

      service['cleanupTempFiles'](['/tmp/test1.txt', '/tmp/test2.txt'])

      expect(mockFs.unlinkSync).toHaveBeenCalledWith('/tmp/test1.txt')
      expect(mockFs.unlinkSync).toHaveBeenCalledWith('/tmp/test2.txt')
    })

    it('should handle non-existing files gracefully', () => {
      mockFs.existsSync.mockReturnValue(false)

      expect(() => service['cleanupTempFiles'](['/tmp/test1.txt'])).not.toThrow()
      expect(mockFs.unlinkSync).not.toHaveBeenCalled()
    })

    it('should handle cleanup errors gracefully', () => {
      mockFs.existsSync.mockReturnValue(true)
      mockFs.unlinkSync.mockImplementation(() => {
        throw new Error('Permission denied')
      })

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      expect(() => service['cleanupTempFiles'](['/tmp/test1.txt'])).not.toThrow()
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to cleanup temp file /tmp/test1.txt:',
        'Permission denied'
      )

      consoleSpy.mockRestore()
    })
  })

  describe('cleanupOldTempFiles', () => {
    beforeEach(() => {
      mockFs.readdirSync.mockReturnValue(['old1.txt', 'old2.txt', 'new1.txt'] as any)
      mockFs.statSync.mockImplementation((filePath) => ({
        mtime: new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours old
      }) as any)
    })

    it('should cleanup old files', () => {
      service['cleanupOldTempFiles']()

      expect(mockFs.readdirSync).toHaveBeenCalledWith('/tmp/vorstoss-pdf')
      expect(mockFs.unlinkSync).toHaveBeenCalledTimes(3)
    })

    it('should handle cleanup errors gracefully', () => {
      mockFs.unlinkSync.mockImplementation(() => {
        throw new Error('Permission denied')
      })

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      expect(() => service['cleanupOldTempFiles']()).not.toThrow()
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })
});
