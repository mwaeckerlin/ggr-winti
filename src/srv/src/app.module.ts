import {Module, NestModule, MiddlewareConsumer} from '@nestjs/common'
import {AppController} from './app.controller'
import {AppService} from './app.service'
import {PdfModule} from './pdf/pdf.module'
import {LoggerMiddleware} from './logger.middleware'

@Module({
  imports: [PdfModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*')
  }
}
