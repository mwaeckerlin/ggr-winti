import {Controller,Post,Body} from '@nestjs/common'
import {PdfService} from './pdf.service'
import {GeneratePdfDto} from './dto/generate-pdf.dto'

@Controller('pdf')
export class PdfController{
  constructor(private readonly pdfService:PdfService){}
  @Post()
  async generatePdf(@Body() generatePdfDto:GeneratePdfDto){
    return this.pdfService.generatePdf(generatePdfDto)
  }
}
