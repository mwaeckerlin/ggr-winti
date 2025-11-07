import {Module} from '@nestjs/common'
import {ServeStaticModule} from '@nestjs/serve-static'
import {PdfModule} from './pdf/pdf.module'
import {MitgliederModule} from './mitglieder/mitglieder.module'
import * as path from 'path'

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, 'app'),
      exclude: ['/api/v1']
    }),
    PdfModule,
    MitgliederModule,
  ],
})
export class AppModule {}
