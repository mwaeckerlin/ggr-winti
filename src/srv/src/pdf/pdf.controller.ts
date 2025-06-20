import {Controller, Post, Body, Res, StreamableFile} from '@nestjs/common'
import {PdfService} from './pdf.service'
import {GeneratePdfDto, generateFilename} from '@ggr-winti/lib'
import {Response} from 'express'

@Controller()
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}
  @Post()
  async generatePdf(@Body() generatePdfDto: GeneratePdfDto, @Res({passthrough: true}) res: Response) {
    const {pdf} = await this.pdfService.generatePdf(generatePdfDto)
    const filename = generateFilename(generatePdfDto)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.pdf`)

    return new StreamableFile(pdf)
  }
}
