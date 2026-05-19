import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message || exception.message;
    }

    // Handle rate limit (429) with Chinese message consistency
    if (status === HttpStatus.TOO_MANY_REQUESTS) {
      const retryAfter = response.get('Retry-After');
      this.logger.warn(
        `Rate limit hit: ${request.method} ${request.url} (IP: ${request.ip})`,
      );
      response.status(status).json({
        code: status,
        data: null,
        message: Array.isArray(message) ? message[0] : message,
        ...(retryAfter ? { retryAfter: Number(retryAfter) } : {}),
      });
      return;
    }

    response.status(status).json({
      code: status,
      data: null,
      message: Array.isArray(message) ? message[0] : message,
    });
  }
}
