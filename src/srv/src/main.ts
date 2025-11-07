import {NestFactory} from '@nestjs/core'
import {ValidationPipe} from '@nestjs/common'
import {AppModule} from './app.module'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load .env file from the project root
dotenv.config({path: path.resolve(__dirname, '../../../.env')})

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Enable CORS
  const frontendUrl = process.env.FRONTEND
  if (frontendUrl) {
    console.log(`Enabling CORS for origin: ${frontendUrl}`) // Explicit logging
    app.enableCors({
      origin: frontendUrl,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', // Ensure OPTIONS is included
      credentials: true,
    })
  } else {
    console.log('CORS not enabled.')
  }

  app.setGlobalPrefix('api/v1')
  app.useGlobalPipes(new ValidationPipe())
  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
