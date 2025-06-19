import {Test,TestingModule} from '@nestjs/testing'
import {PdfService} from './pdf.service'
import {GeneratePdfDto, Vorstosstyp} from './dto/generate-pdf.dto'
import * as fs from 'fs'
import * as path from 'path'
import {exec as execOrig} from 'child_process'

// Mock fs module
jest.mock('fs', () => ({
  existsSync:jest.fn(),
  mkdirSync:jest.fn(),
  rmSync:jest.fn(),
  writeFileSync:jest.fn(),
  readFileSync:jest.fn(),
  unlinkSync:jest.fn(),
  readdirSync:jest.fn(),
  statSync:jest.fn()
}))

// Mock child_process
const mockExec = jest.fn()
jest.mock('child_process', () => ({
  exec: mockExec
}))

jest.mock('./pdf.service', () => {
  const original = jest.requireActual('./pdf.service')
  return {
    ...original,
    encodeLatexInput: text => `escaped_${text}`,
    htmlToLatex: html => html.replace(/<[^>]*>/g, '')
  }
})

describe('PdfService', () => {
  let service:PdfService
  let mockFs:jest.Mocked<typeof fs>

  beforeEach( async () => {
    const module:TestingModule = await Test.createTestingModule({providers:[PdfService]}).compile()
    service = module.get<PdfService>(PdfService)
    mockFs = fs as jest.Mocked<typeof fs>
    mockExec.mockReset()
    service.encodeLatexInput = text => `escaped_${text}`
    service.htmlToLatex = html => html.replace(/<[^>]*>/g, '')
  })

  describe('generatePdf', () => {
    const mockDto:GeneratePdfDto = {text:'Test content', vorstosstyp:Vorstosstyp.POSTULAT, betreffend:'Test Vorstoss', eingereichtvon:'Test User', nummer:'2024.001', unterstuetzer:1}
    beforeEach(() => {
      mockFs.existsSync.mockReturnValue(false)
      mockFs.readFileSync.mockReturnValue(Buffer.from('fake-pdf-content'))
      mockExec.mockImplementation((cmd, callback) => {if (callback) callback(null, {stdout:'', stderr:''}); return{}as any})
    })
    it('should generate PDF with text content', async () => {
      const result = await service.generatePdf(mockDto)
      expect(result.success).toBe(true)
      expect(result.message).toBe('PDF generated successfully')
      expect(result.pdf).toBeInstanceOf(Buffer)
      expect(mockFs.writeFileSync).toHaveBeenCalled()
      expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('pdflatex -interaction=nonstopmode'), expect.any(Function))
    })
    it('should generate PDF with antrag and begruendung', async () => {
      const dtoWithAntrag:GeneratePdfDto = {antrag:'Test antrag', begruendung:'Test begruendung', vorstosstyp:Vorstosstyp.MOTION, betreffend:'Test Vorstoss', eingereichtvon:'Test User'}
      const result = await service.generatePdf(dtoWithAntrag)
      expect(result.success).toBe(true)
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('\\antrag'))
    })
    it('should throw error when neither text nor antrag and begruendung provided', async () => {
      const invalidDto:GeneratePdfDto = {vorstosstyp:Vorstosstyp.POSTULAT}
      await expect(service.generatePdf(invalidDto)).rejects.toThrow('Either text or both antrag and begruendung must be provided')
    })
    it('should throw error when only antrag provided', async () => {
      const invalidDto:GeneratePdfDto = {antrag:'Test antrag', vorstosstyp:Vorstosstyp.POSTULAT}
      await expect(service.generatePdf(invalidDto)).rejects.toThrow('Either text or both antrag and begruendung must be provided')
    })
    it('should throw error when only begruendung provided', async () => {
      const invalidDto:GeneratePdfDto = {begruendung:'Test begruendung', vorstosstyp:Vorstosstyp.POSTULAT}
      await expect(service.generatePdf(invalidDto)).rejects.toThrow('Either text or both antrag and begruendung must be provided')
    })
    it('should handle pdflatex execution error', async () => {
      mockExec.mockImplementation((cmd, callback) => {if (callback) callback(new Error('pdflatex failed'), {stdout:'', stderr:'error'}); return{}as any})
      await expect(service.generatePdf(mockDto)).rejects.toThrow('PDF generation failed: pdflatex failed')
    })
    it('should handle missing PDF output file', async () => {
      mockFs.existsSync.mockImplementation(path => {if (path.toString().endsWith('.pdf')) return false; return true})
      await expect(service.generatePdf(mockDto)).rejects.toThrow('PDF generation failed - no output file created')
    })
    it('should cleanup temporary files on success', async () => {
      await service.generatePdf(mockDto)
      expect(mockFs.unlinkSync).toHaveBeenCalledTimes(4)
    })
    it('should cleanup temporary files on error', async () => {
      mockExec.mockImplementation((cmd, callback) => {if (callback) callback(new Error('pdflatex failed'), {stdout:'', stderr:'error'}); return{}as any})
      await expect(service.generatePdf(mockDto)).rejects.toThrow()
      expect(mockFs.unlinkSync).toHaveBeenCalledTimes(4)
    })
  })
  describe('buildClassOptions', () => {
    it('should build options string with vorstosstyp only', () => {
      const dto:GeneratePdfDto = {text:'test', vorstosstyp:Vorstosstyp.MOTION}
      const result = service['buildClassOptions'](dto)
      expect(result).toBe('motion')
    })
    it('should build options string with dringlich', () => {
      const dto:GeneratePdfDto = {text:'test', vorstosstyp:Vorstosstyp.POSTULAT, dringlich:true}
      const result = service['buildClassOptions'](dto)
      expect(result).toBe('postulat,dringlich')
    })
    it('should build options string with budget', () => {
      const dto:GeneratePdfDto = {text:'test', vorstosstyp:Vorstosstyp.INTERPELLATION, budget:true}
      const result = service['buildClassOptions'](dto)
      expect(result).toBe('interpellation,budget')
    })
    it('should build options string with all options', () => {
      const dto:GeneratePdfDto = {text:'test', vorstosstyp:Vorstosstyp.BESCHLUSSANTRAG, dringlich:true, budget:true}
      const result = service['buildClassOptions'](dto)
      expect(result).toBe('beschlussantrag,dringlich,budget')
    })
    it('should return empty string when no options', () => {
      const dto:GeneratePdfDto = {text:'test'}
      const result = service['buildClassOptions'](dto)
      expect(result).toBe('')
    })
  })
})
