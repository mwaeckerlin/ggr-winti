let pdfExists = true
const mockExec = jest.fn()

jest.mock('fs', () => {
  const unlinkSync = jest.fn()
  return {
    existsSync: jest.fn((file) => (file && file.toString().endsWith('.pdf') ? pdfExists : true)),
    mkdirSync: jest.fn(),
    rmSync: jest.fn(),
    writeFileSync: jest.fn(),
    readFileSync: jest.fn(() => Buffer.from('fake-pdf-content')),
    unlinkSync,
    readdirSync: jest.fn(),
    statSync: jest.fn(),
  }
})

jest.mock('child_process', () => ({
  exec: mockExec,
}))

jest.mock('./pdf.service', () => {
  const original = jest.requireActual('./pdf.service')
  return {
    ...original,
    encodeLatexInput: (text) => `escaped_${text}`,
    htmlToLatex: (html) => html.replace(/<[^>]*>/g, ''),
  }
})

import {Test, TestingModule} from '@nestjs/testing'
import {PdfService} from './pdf.service'
import {GeneratePdfDto, Vorstosstyp} from '@ggr-winti/lib'
import * as fs from 'fs'
import * as path from 'path'

describe('PdfService', () => {
  let service: PdfService
  let mockFs: jest.Mocked<typeof fs>
  const originalTexClassPath = process.env.TEX_CLASS_PATH

  beforeEach(async () => {
    process.env.TEX_CLASS_PATH = '/fake/path' // Set dummy path for tests
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfService],
    }).compile()
    service = module.get<PdfService>(PdfService)
    mockFs = fs as jest.Mocked<typeof fs>
    mockExec.mockReset()
    service.encodeLatexInput = (text) => `escaped_${text}`
    service.htmlToLatex = (html) => html.replace(/<[^>]*>/g, '')
    mockFs.unlinkSync.mockClear()
    pdfExists = true
  })

  afterEach(() => {
    process.env.TEX_CLASS_PATH = originalTexClassPath // Restore original value
  })

  describe('generatePdf', () => {
    const mockDto: GeneratePdfDto = {
      text: 'Test content',
      vorstosstyp: Vorstosstyp.POSTULAT,
      betreffend: 'Test Vorstoss',
      eingereichtvon: 'Test User',
      nummer: '2024.001',
      unterstuetzer: 1,
    }
    beforeEach(() => {
      mockFs.readFileSync.mockReturnValue(Buffer.from('fake-pdf-content'))
      mockExec.mockImplementation((cmd, options, callback) => {
        if (callback) callback(null, {stdout: '', stderr: ''})
        return {} as any
      })
      mockFs.unlinkSync.mockImplementation(() => {})
      pdfExists = true
    })
    it('should generate PDF with text content', async () => {
      const result = await service.generatePdf(mockDto)
      expect(result.success).toBe(true)
      expect(result.message).toBe('PDF generated successfully')
      expect(result.pdf).toBeInstanceOf(Buffer)
      expect(mockFs.writeFileSync).toHaveBeenCalled()
      expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('pdflatex -interaction=nonstopmode'), expect.any(Object), expect.any(Function))
    })
    it('should generate PDF with antrag and begruendung', async () => {
      const dtoWithAntrag: GeneratePdfDto = {
        antrag: 'Test antrag',
        begruendung: 'Test begruendung',
        vorstosstyp: Vorstosstyp.MOTION,
        betreffend: 'Test Vorstoss',
        eingereichtvon: 'Test User',
      }
      const result = await service.generatePdf(dtoWithAntrag)
      expect(result.success).toBe(true)
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('\\antrag'))
    })
    it('should throw error when neither text nor antrag and begruendung provided', async () => {
      const invalidDto: GeneratePdfDto = {vorstosstyp: Vorstosstyp.POSTULAT}
      await expect(service.generatePdf(invalidDto)).rejects.toThrow('Either text or both antrag and begruendung must be provided')
    })
    it('should throw error when only antrag provided', async () => {
      const invalidDto: GeneratePdfDto = {
        antrag: 'Test antrag',
        vorstosstyp: Vorstosstyp.POSTULAT,
      }
      await expect(service.generatePdf(invalidDto)).rejects.toThrow('Either text or both antrag and begruendung must be provided')
    })
    it('should throw error when only begruendung provided', async () => {
      const invalidDto: GeneratePdfDto = {
        begruendung: 'Test begruendung',
        vorstosstyp: Vorstosstyp.POSTULAT,
      }
      await expect(service.generatePdf(invalidDto)).rejects.toThrow('Either text or both antrag and begruendung must be provided')
    })
    it('should handle pdflatex execution error', async () => {
      mockExec.mockImplementation((cmd, options, callback) => {
        if (callback)
          callback(new Error('pdflatex failed'), {
            stdout: '',
            stderr: 'error',
          })
        return {} as any
      })
      await expect(service.generatePdf(mockDto)).rejects.toThrow('PDF generation failed: pdflatex failed')
      expect(mockFs.unlinkSync).toHaveBeenCalledTimes(0)
    })
    it('should handle missing PDF output file', async () => {
      pdfExists = false
      await expect(service.generatePdf(mockDto)).rejects.toThrow('PDF generation failed - no output file created')
      expect(mockFs.unlinkSync).toHaveBeenCalledTimes(0)
    })
    it('should cleanup temporary files on success', async () => {
      await service.generatePdf(mockDto)
      expect(mockFs.unlinkSync).toHaveBeenCalledTimes(4)
    })
    it('should not cleanup temporary files on error', async () => {
      mockExec.mockImplementation((cmd, options, callback) => {
        if (callback)
          callback(new Error('pdflatex failed'), {
            stdout: '',
            stderr: 'error',
          })
        return {} as any
      })
      await expect(service.generatePdf(mockDto)).rejects.toThrow()
      expect(mockFs.unlinkSync).toHaveBeenCalledTimes(0)
    })
  })
  describe('buildClassOptions', () => {
    it('should build options string with vorstosstyp only', () => {
      const dto: GeneratePdfDto = {
        text: 'test',
        vorstosstyp: Vorstosstyp.MOTION,
      }
      const result = service['buildClassOptions'](dto)
      expect(result).toBe('motion')
    })
    it('should build options string with dringlich', () => {
      const dto: GeneratePdfDto = {
        text: 'test',
        vorstosstyp: Vorstosstyp.POSTULAT,
        dringlich: true,
      }
      const result = service['buildClassOptions'](dto)
      expect(result).toBe('postulat,dringlich')
    })
    it('should build options string with budget', () => {
      const dto: GeneratePdfDto = {
        text: 'test',
        vorstosstyp: Vorstosstyp.INTERPELLATION,
        budget: true,
      }
      const result = service['buildClassOptions'](dto)
      expect(result).toBe('interpellation,budget')
    })
    it('should build options string with all options', () => {
      const dto: GeneratePdfDto = {
        text: 'test',
        vorstosstyp: Vorstosstyp.BESCHLUSSANTRAG,
        dringlich: true,
        budget: true,
      }
      const result = service['buildClassOptions'](dto)
      expect(result).toBe('beschlussantrag,dringlich,budget')
    })
    it('should return empty string when no options', () => {
      const dto: GeneratePdfDto = {text: 'test', vorstosstyp: Vorstosstyp.MOTION}
      const result = service['buildClassOptions'](dto)
      expect(result).toBe('')
    })
  })
})
