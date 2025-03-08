import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

@Catch(JsonWebTokenError, TokenExpiredError, UnauthorizedException)
export class JwtExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.UNAUTHORIZED;
    let message = 'Unauthorized';

    if (exception instanceof TokenExpiredError) {
      status = HttpStatus.GONE;
      message = 'Token has expired';
    } else if (exception instanceof JsonWebTokenError) {
      status = HttpStatus.UNAUTHORIZED;
      message = 'Invalid token';
    } else if (exception instanceof UnauthorizedException) {
      const exceptionResponse = exception.getResponse() as any;
      message = exceptionResponse.message || 'Unauthorized';
    }

    response.status(status).json({
      statusCode: status,
      message: message,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    });
  }
}
