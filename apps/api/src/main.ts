import compression from '@fastify/compress'
import helmet from '@fastify/helmet'
import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { randomUUID } from 'node:crypto'
import { IncomingHttpHeaders } from 'node:http'
import { AppModule } from './app.module'
import { AppLogger } from './common/logger/app.logger'
import { GlobalValidationPipe } from './common/pipes/global-validation.pipe'
import { PrismaService } from './database/prisma.service'

async function bootstrap(): Promise<void> {
  const adapter = new FastifyAdapter({
    trustProxy: true,
    logger: false,
    genReqId: (request: { headers: IncomingHttpHeaders }) => {
      const headerValue = request.headers['x-request-id']

      if (typeof headerValue === 'string' && headerValue.length > 0) {
        return headerValue
      }

      if (Array.isArray(headerValue) && headerValue.length > 0) {
        return headerValue[0] ?? randomUUID()
      }

      return randomUUID()
    },
  })

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
    bufferLogs: true,
  })

  const logger = app.get(AppLogger)
  const configService = app.get(ConfigService)
  const prismaService = app.get(PrismaService)
  const globalPrefix = configService.get<string>('app.globalPrefix', 'api/v1')
  const port = configService.get<number>('app.port', 3001)
  const nodeEnv = configService.get<string>('app.nodeEnv', 'development')

  app.useLogger(logger)
  app.useGlobalPipes(new GlobalValidationPipe())
  app.setGlobalPrefix(globalPrefix)

  await app.register(helmet as never, {
    contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
  } as never)

  await app.register(compression as never, {
    encodings: ['gzip', 'deflate'],
  } as never)

  app.enableCors({
    origin: true,
    credentials: true,
    exposedHeaders: ['x-request-id'],
  })

  await prismaService.enableShutdownHooks(app)
  await app.listen(port, '0.0.0.0')

  logger.log(`API running on http://0.0.0.0:${port}/${globalPrefix}`, 'Bootstrap')
}

void bootstrap()
