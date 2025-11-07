import { Controller, Get } from '@nestjs/common'
import { MitgliederService } from './mitglieder.service'

@Controller('mitglieder')
export class MitgliederController {
  constructor(private readonly mitgliederService: MitgliederService) {}

  @Get()
  getMitglieder() {
    return this.mitgliederService.getMitglieder()
  }
} 