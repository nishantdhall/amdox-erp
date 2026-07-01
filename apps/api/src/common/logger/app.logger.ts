import { ConsoleLogger, Injectable } from '@nestjs/common'

@Injectable()
export class AppLogger extends ConsoleLogger {
  logHttp(event: string, metadata: Record<string, unknown>): void {
    super.log(this.serialize(event, metadata), 'HTTP')
  }

  warnHttp(event: string, metadata: Record<string, unknown>): void {
    super.warn(this.serialize(event, metadata), 'HTTP')
  }

  errorHttp(event: string, error: unknown, metadata: Record<string, unknown>): void {
    super.error(this.serialize(event, metadata), this.stringifyError(error), 'HTTP')
  }

  private serialize(event: string, metadata: Record<string, unknown>): string {
    return JSON.stringify({ event, ...metadata })
  }

  private stringifyError(error: unknown): string {
    if (error instanceof Error) {
      return error.stack ?? error.message
    }

    return typeof error === 'string' ? error : JSON.stringify(error)
  }
}
