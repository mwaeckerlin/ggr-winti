import { Module } from '@nestjs/common'
import { MitgliederService } from './mitglieder.service'
import { MitgliederController } from './mitglieder.controller'
import { initMitgliederCron } from './cron'

@Module({
  controllers: [MitgliederController],
  providers: [MitgliederService],
})
export class MitgliederModule {
  constructor(private readonly mitgliederService: MitgliederService) {
    initMitgliederCron(this.mitgliederService)
  }
} 