import {Test, TestingModule} from '@nestjs/testing'
import {PdfController} from './pdf.controller'

describe('PdfController', () => {
  let controller: PdfController
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PdfController],
      providers: [require('./pdf.service').PdfService],
    }).compile()
    controller = module.get<PdfController>(PdfController)
  })
  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
