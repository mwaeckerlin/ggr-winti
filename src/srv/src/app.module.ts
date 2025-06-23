import {Module} from '@nestjs/common'
import {ServeStaticModule} from '@nestjs/serve-static'
import {PdfModule} from './pdf/pdf.module'
import * as path from 'path'

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, '..', '..', 'app', 'dist'),
      exclude: ['/app/v1*'],
    }),
    PdfModule,
  ],
})
export class AppModule {}
