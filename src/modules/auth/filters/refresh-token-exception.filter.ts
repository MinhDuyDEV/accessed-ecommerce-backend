import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(UnauthorizedException, BadRequestException)
export class RefreshTokenExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const exceptionResponse = exception.getResponse() as any;
    const message = exceptionResponse.message || 'Unauthorized';

    let status = HttpStatus.UNAUTHORIZED;

    // Check if the error message indicates an expired token
    if (message.includes('expired')) {
      status = HttpStatus.GONE;
    }

    response.status(status).json({
      statusCode: status,
      message: message,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    });
  }
}
